/* eslint-disable */

import { Request, Response } from "express";
import { StringObject } from "../../common/utils/util.types";
import { AuthenticatedUserDTO, LoginDTO, LoginResponseDTO, RegisterDTO, RegisterResponseDTO } from "./types/auth.dto";
import { createArgonHash, verifyArgonHash } from "./util/argon.util";
import { removeFields } from "../../common/utils/object.util";
import { userService } from "../users/users.service";
import prisma from "../../prisma/prisma.service";
import { randomUUID } from "node:crypto";


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
        // Check if user is verified
        if (!foundUser.isVerified) {
            throw new Error('Please verify your email before logging in');
        }

        const isPasswordMatch = await verifyArgonHash(
            payload.password,
            foundUser.password
        )

        if (!isPasswordMatch) return null;

        return this.attachPlan(foundUser);
    }

    public async markUserAsVerified(userId: string): Promise<RegisterResponseDTO> {
        const user = await this._userService.markUserAsVerified(userId);
        return this.attachPlan(user);
    }

    public logout(req: Request, res: Response) { };
}

// export const authService = new AuthService();
