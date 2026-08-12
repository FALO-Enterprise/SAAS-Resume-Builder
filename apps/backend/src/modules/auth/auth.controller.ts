/* eslint-disable */

import { Request, Response, NextFunction } from "express";
import { AuthService } from "./auth.service";
import { HttpErrorStatus, StringObject } from "../../common/utils/util.types";
import {
    ForgotPasswordDTO,
    LoginDTO,
    LoginResponseDTO,
    LoginResponseDTOWithJWT,
    RegisterDTO,
    RegisterResponseDTO,
    ResetPasswordDTO,
    ValidateResetTokenDTO,
} from "./types/auth.dto";
import { zodValidation } from "../../common/utils/zod.util";
import {
    forgotPasswordDTOSchema,
    loginDTOSchema,
    registerDTOSchema,
    resetPasswordDTOSchema,
    validateResetTokenDTOSchema,
} from "./util/auth.schema";
import { deleteUploadedAsset } from "../../common/utils/assets.util";
import { signJWT } from "./util/jwt.util";
import { resendVerificationCode, sendVerificationCode, verifyVerificationCode } from "./util/verification.util";
import { sendPasswordResetEmail } from "./util/password-reset-email.util";

export class AuthController {

    private authService = new AuthService();

    public async register(req: Request<StringObject, StringObject, RegisterDTO>, res: Response<RegisterResponseDTO | string>, next: NextFunction) {
        try {
            // utility method to validate zod schema
            const payloadData = zodValidation(registerDTOSchema, req.body, 'AUTH');

            const user = await this.authService.register(payloadData);
            await sendVerificationCode(user.email);
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
            res.error({ statusCode: HttpErrorStatus.BadRequest, message: 'Email and code are required' });
            return;
        }

        const entry = verifyVerificationCode(email, code);
        if (!entry) {
            console.log('Invalid or expired verification code for:', email);
            res.error({ statusCode: HttpErrorStatus.BadRequest, message: 'Invalid or expired verification code' });
            return;
        }

        // Mark user as verified
        try {
            const verificationUser = await this.authService.findUserForVerification(email);
            if (!verificationUser) {
                res.error({ statusCode: HttpErrorStatus.NotFound, message: 'User not found' });
                return;
            }

            const user = await this.authService.markUserAsVerified(verificationUser.id);
            console.log('User marked as verified:', user.id);

            const token = signJWT({ sub: user.id, name: user.name });
            console.log('JWT token generated for user:', user.id);

            res.status(200).json({ token, user });
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to verify user';
            console.log('Error during verification:', message);
            res.error({ message, statusCode: HttpErrorStatus.InternalServerError })
        }
    }

    public async resendCode(req: Request, res: Response) {
        const { email } = req.body as { email?: string };

        if (!email) {
            res.error({ message: 'Email is required', statusCode: HttpErrorStatus.BadRequest })
            return;
        }

        const user = await this.authService.findUserForVerification(email);
        if (!user) {
            res.error({ message: 'User not found', statusCode: HttpErrorStatus.NotFound });
            return;
        }

        if (user.isVerified) {
            res.error({ message: 'Account is already verified', statusCode: HttpErrorStatus.BadRequest });
            return;
        }

        await resendVerificationCode(user.email);
        res.status(200).json({ success: true, message: 'Verification code resent' });
    }

    public async forgotPassword(
        req: Request<StringObject, StringObject, ForgotPasswordDTO>,
        res: Response,
    ) {
        let payloadData: ForgotPasswordDTO;

        try {
            payloadData = zodValidation(forgotPasswordDTOSchema, req.body, 'AUTH');
        } catch {
            res.error({
                statusCode: HttpErrorStatus.BadRequest,
                message: 'Enter a valid email address',
            });
            return;
        }

        try {
            const result = await this.authService.createPasswordResetToken(payloadData.email);

            if (result) {
                try {
                    await sendPasswordResetEmail(
                        result.user.email,
                        result.user.name,
                        result.token,
                        payloadData.locale ?? 'en',
                    );
                } catch (error) {
                    console.error('Failed to send password reset email:', error);
                }
            }

            // Always return the same response so this endpoint cannot reveal
            // whether an email address is registered.
            res.ok({
                message: 'If an account exists for that email, a reset link has been sent.',
            });
        } catch (error) {
            console.error('Failed to create password reset token:', error);
            res.error({
                statusCode: HttpErrorStatus.InternalServerError,
                message: 'Unable to process the password reset request',
            });
        }
    }

    public async validateResetToken(
        req: Request<StringObject, StringObject, ValidateResetTokenDTO>,
        res: Response,
    ) {
        try {
            const payloadData = zodValidation(validateResetTokenDTOSchema, req.body, 'AUTH');
            const valid = await this.authService.isPasswordResetTokenValid(payloadData.token);
            res.ok({ valid });
        } catch {
            res.ok({ valid: false });
        }
    }

    public async resetPassword(
        req: Request<StringObject, StringObject, ResetPasswordDTO>,
        res: Response,
    ) {
        let payloadData: ResetPasswordDTO;

        try {
            payloadData = zodValidation(resetPasswordDTOSchema, req.body, 'AUTH');
        } catch {
            res.error({
                statusCode: HttpErrorStatus.BadRequest,
                message: 'The reset link or password is invalid',
            });
            return;
        }

        try {
            const didReset = await this.authService.resetPassword(
                payloadData.token,
                payloadData.password,
            );

            if (!didReset) {
                res.error({
                    statusCode: HttpErrorStatus.BadRequest,
                    message: 'This reset link is invalid or has expired',
                });
                return;
            }

            res.ok({ message: 'Password updated successfully' });
        } catch (error) {
            console.error('Failed to reset password:', error);
            res.error({
                statusCode: HttpErrorStatus.InternalServerError,
                message: 'Unable to reset the password',
            });
        }
    }

    public async login(
        req: Request<StringObject, StringObject, LoginDTO>,
        res: Response<LoginResponseDTO | string>,
        next: NextFunction
    ) {
        const payloadData = zodValidation(loginDTOSchema, req.body, 'AUTH');
        try {
            const userData = await this.authService.login(payloadData);
            if (!userData) {
                res.error({ statusCode: HttpErrorStatus.BadRequest, message: 'Wrong credentials' });
                return;
            }

            console.log(req.session, 'before i set the req.session');
            req.session.userId = userData.id;

            //  express session => create new entity  { 12345: { userId:123213} } => save memory
            // express session on  response it will send the cookie with same key on session memory [abc] and sign it with my secret

            res.ok(userData);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Internal server error';
            if (message === 'Please verify your email before logging in') {
                res.error({ statusCode: HttpErrorStatus.BadRequest, message });
                return;
            }
            console.error('Login failed:', err);
            res.error({ statusCode: HttpErrorStatus.InternalServerError, message: 'Internal server error' });
        }
    }


    public async loginWithJWT(
        req: Request<StringObject, StringObject, LoginDTO>,
        res: Response<LoginResponseDTOWithJWT | string>,
        next: NextFunction
    ) {
        const payloadData = zodValidation(loginDTOSchema, req.body, 'AUTH');
        try {
            const userData = await this.authService.login(payloadData);
            if (!userData) {
                res.error({ statusCode: HttpErrorStatus.BadRequest, message: 'Wrong credentials' });
                return;
            }

            const token = signJWT({ sub: userData.id, name: userData.name });
            res.ok({ user: userData, token });
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Internal server error';
            if (message === 'Please verify your email before logging in') {
                res.error({ statusCode: HttpErrorStatus.BadRequest, message });
                return;
            }
            console.error('JWT login failed:', err);
            res.error({ statusCode: HttpErrorStatus.InternalServerError, message: 'Internal server error' });
        }
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


