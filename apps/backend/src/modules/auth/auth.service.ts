/* eslint-disable */

import { Request, Response } from "express";
import { StringObject } from "../../common/utils/util.types";
import { LoginDTO, LoginResponseDTO, RegisterDTO, RegisterResponseDTO } from "./types/auth.dto";
import { createArgonHash, verifyArgonHash } from "./util/argon.util";
import { removeFields } from "../../common/utils/object.util";
import { userService } from "../users/users.service";
import prisma from "../../prisma/prisma.service";
import { randomUUID } from "node:crypto";


export class AuthService {
    private _userService = userService;

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

        return removeFields(userData, ['password']);

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

        return removeFields(foundUser, ['password']);
    }

    public async markUserAsVerified(userId: string): Promise<RegisterResponseDTO> {
        const user = await this._userService.markUserAsVerified(userId);
        return removeFields(user, ['password']);
    }

    public logout(req: Request, res: Response) { };
}

// export const authService = new AuthService(); 