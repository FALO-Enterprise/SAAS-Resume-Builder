/* eslint-disable */

import { Request, Response } from "express";
import { StringObject } from "../../common/utils/util.types";
import { AuthenticatedUserDTO, LoginDTO, LoginResponseDTO, RegisterDTO, RegisterResponseDTO } from "./types/auth.dto";
import { createArgonHash, verifyArgonHash } from "./util/argon.util";
import { removeFields } from "../../common/utils/object.util";
import { userService } from "../users/users.service";
import prisma from "../../prisma/prisma.service";
import { createHash, randomBytes, randomUUID } from "node:crypto";

const PASSWORD_RESET_TTL_MS = 15 * 60 * 1000;

function hashResetToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
}


export class AuthService {
    private _userService = userService;

    public async findUserForVerification(email: string) {
        const user = await this._userService.findByEmail(email);
        if (!user) return null;

        return {
            id: user.id,
            name: user.name,
            email: user.email,
            isVerified: user.isVerified
        };
    }

    private async attachPlan(user: Awaited<ReturnType<typeof this._userService.findByEmail>>): Promise<AuthenticatedUserDTO> {
        if (!user) throw new Error('User not found.');

        const subscription = await prisma.subscription.findUnique({
            where: { userId: user.id },
            select: {
                Plan: {
                    select: { id: true, name: true }
                }
            }
        });

        if (!subscription) throw new Error('Active plan not found for user.');

        return {
            ...removeFields(user, ['password']),
            plan: subscription.Plan
        };
    }

    public async register(payload: RegisterDTO): Promise<RegisterResponseDTO> {
        const existingUser = await this._userService.findByEmail(payload.email);
        if (existingUser) {
            throw new Error('Email already in use');
        }
        const freePlan = await prisma.plan.findFirst({
            where: { name: 'FREE' }
        });

        if (!freePlan) throw new Error('FREE plan not found.')
        //hash password
        const hashedValue = await createArgonHash(payload.password);
        //save user data in db
        const userData = await this._userService.createUser(
            payload.name,
            payload.email,
            hashedValue,
            payload.avatar ?? undefined,
        );
        await prisma.subscription.create({
            data: {
                id: randomUUID(),
                updatedAt: new Date(),
                userId: userData.id,
                planId: freePlan.id,
                status: 'ACTIVE',
            }
        });

        return {
            ...removeFields(userData, ['password']),
            plan: { id: freePlan.id, name: freePlan.name }
        };

    }

    public async login(payload: LoginDTO): Promise<LoginResponseDTO | null> {
        //find email
        const foundUser = await this._userService.findByEmail(payload.email);

        //if no email => return error
        if (!foundUser) return null;

        const isPasswordMatch = await verifyArgonHash(
            payload.password,
            foundUser.password
        )

        if (!isPasswordMatch) return null;

        // Only reveal the "please verify" state after the password has
        // already been confirmed correct. Checking isVerified before the
        // password comparison let an unauthenticated caller confirm an
        // email is registered (and unverified) via this endpoint just by
        // supplying any password — a pure enumeration oracle.
        if (!foundUser.isVerified) {
            throw new Error('Please verify your email before logging in');
        }

        return this.attachPlan(foundUser);
    }

    public async markUserAsVerified(userId: string): Promise<RegisterResponseDTO> {
        const user = await this._userService.markUserAsVerified(userId);
        return this.attachPlan(user);
    }

    public async createPasswordResetToken(email: string) {
        const user = await prisma.user.findFirst({
            where: {
                email: {
                    equals: email.trim(),
                    mode: 'insensitive',
                },
            },
            select: {
                id: true,
                email: true,
                name: true,
            },
        });

        if (!user) return null;

        const token = randomBytes(32).toString('base64url');
        const tokenHash = hashResetToken(token);
        const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);

        await prisma.$transaction([
            prisma.passwordResetToken.deleteMany({
                where: {
                    userId: user.id,
                    usedAt: null,
                },
            }),
            prisma.passwordResetToken.create({
                data: {
                    tokenHash,
                    userId: user.id,
                    expiresAt,
                },
            }),
        ]);

        return { token, user };
    }

    public async isPasswordResetTokenValid(token: string) {
        const resetToken = await prisma.passwordResetToken.findUnique({
            where: { tokenHash: hashResetToken(token) },
            select: {
                expiresAt: true,
                usedAt: true,
            },
        });

        return Boolean(
            resetToken
            && !resetToken.usedAt
            && resetToken.expiresAt.getTime() > Date.now()
        );
    }

    public async resetPassword(token: string, password: string) {
        const tokenHash = hashResetToken(token);
        const resetToken = await prisma.passwordResetToken.findUnique({
            where: { tokenHash },
            select: {
                id: true,
                userId: true,
            },
        });

        if (!resetToken) return false;

        const hashedPassword = await createArgonHash(password);
        const usedAt = new Date();

        return prisma.$transaction(async (transaction) => {
            const consumed = await transaction.passwordResetToken.updateMany({
                where: {
                    id: resetToken.id,
                    usedAt: null,
                    expiresAt: { gt: usedAt },
                },
                data: { usedAt },
            });

            if (consumed.count !== 1) return false;

            await transaction.user.update({
                where: { id: resetToken.userId },
                data: { password: hashedPassword },
            });

            await transaction.passwordResetToken.updateMany({
                where: {
                    userId: resetToken.userId,
                    usedAt: null,
                },
                data: { usedAt },
            });

            return true;
        });
    }

    public logout(req: Request, res: Response) { };
}

// export const authService = new AuthService();
