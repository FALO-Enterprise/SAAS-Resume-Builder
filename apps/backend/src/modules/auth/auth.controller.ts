/* eslint-disable */

import { Request, Response, NextFunction } from "express";
import { AuthService } from "./auth.service";
import { HttpErrorStatus, StringObject } from "../../common/utils/util.types";
import { LoginDTO, LoginResponseDTO, LoginResponseDTOWithJWT, RegisterDTO, RegisterResponseDTO } from "./types/auth.dto";
import { zodValidation } from "../../common/utils/zod.util";
import { loginDTOSchema, registerDTOSchema } from "./util/auth.schema";
import { deleteUploadedAsset } from "../../common/utils/assets.util";
import { signJWT } from "./util/jwt.util";
import { resendVerificationCode, sendVerificationCode, verifyVerificationCode } from "./util/verification.util";

export class AuthController {

    private authService = new AuthService();

    public async register(req: Request<StringObject, StringObject, RegisterDTO>, res: Response<RegisterResponseDTO | string>, next: NextFunction) {
        try {
            // utility method to validate zod schema
            const payloadData = zodValidation(registerDTOSchema, req.body, 'AUTH');

            const user = await this.authService.register(payloadData);
            await sendVerificationCode(user.email, user.id, user.name);
            console.log('user registered succefully');
            res.create({ user, message: 'Verification code sent' });
        } catch (err) {
            if (req.file?.filename) {
                await deleteUploadedAsset(req.file.filename);
            }

            const message = err instanceof Error ? err.message : 'Internal server error';
            const statusCode = message === 'Email already in use' ? HttpErrorStatus.BadRequest : HttpErrorStatus.InternalServerError;
            console.log(message);
            res.error({ statusCode, message });

        }

    }

    public async verify(req: Request, res: Response) {
        const { email, code } = req.body as { email?: string; code?: string };

        console.log('Verify request received:', { email, code });

        if (!email || !code) {
            console.log('Missing email or code');
            res.status(HttpErrorStatus.BadRequest).json({ error: 'email and code are required' });
            return;
        }

        const entry = verifyVerificationCode(email, code);
        if (!entry) {
            console.log('Invalid or expired verification code for:', email);
            res.status(HttpErrorStatus.BadRequest).json({ error: 'Invalid or expired verification code' });
            return;
        }

        console.log('Code verified for user:', entry.userId);

        // Mark user as verified
        try {
            await this.authService.markUserAsVerified(entry.userId);
            console.log('User marked as verified:', entry.userId);

            const token = signJWT({ sub: entry.userId, name: entry.name });
            console.log('JWT token generated for user:', entry.userId);

            res.status(200).json({ token, user: { id: entry.userId, name: entry.name, email } });
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to verify user';
            console.log('Error during verification:', message);
            res.error({ message: 'Error during verification:', statusCode: HttpErrorStatus.InternalServerError })
        }
    }

    public async resendCode(req: Request, res: Response) {
        const { email, userId, name } = req.body as { email?: string; userId?: string; name?: string };

        if (!email) {
            res.error({ message: 'email is required', statusCode: HttpErrorStatus.BadRequest })
            return;
        }

        await resendVerificationCode(email, userId || 'unknown', name || 'User');
        res.status(200).json({ success: true, message: 'Verification code resent' });
    }

    public async login(
        req: Request<StringObject, StringObject, LoginDTO>,
        res: Response<LoginResponseDTO | string>,
        next: NextFunction
    ) {
        const payloadData = zodValidation(loginDTOSchema, req.body, 'AUTH');
        const userData = await this.authService.login(payloadData);
        if (!userData) {
            res.status(HttpErrorStatus.BadRequest).send('wrong credentials');
            return;
        }
        console.log(req.session, 'before i set the req.session');
        req.session.userId = userData.id;

        //  express session => create new entity  { 12345: { userId:123213} } => save memory
        // express session on  response it will send the cookie with same key on session memory [abc] and sign it with my secret

        res.ok(userData);
    }


    public async loginWithJWT(
        req: Request<StringObject, StringObject, LoginDTO>,
        res: Response<LoginResponseDTOWithJWT | string>,
        next: NextFunction
    ) {
        const payloadData = zodValidation(loginDTOSchema, req.body, 'AUTH');
        const userData = await this.authService.login(payloadData);
        if (!userData) {
            res.status(HttpErrorStatus.BadRequest).send('wrong credentials');
            return;
        }
        const token = signJWT({ sub: userData.id, name: userData.name });
        res.ok({ user: userData, token });
    }
    public logout(req: Request, res: Response) {
        req.session.destroy((err) => {
            if (err) {
                res.error({ statusCode: HttpErrorStatus.InternalServerError, message: 'Failed to logout' });
                return;
            }
            res.ok({});
        });
    }
}


export const authController = new AuthController();


