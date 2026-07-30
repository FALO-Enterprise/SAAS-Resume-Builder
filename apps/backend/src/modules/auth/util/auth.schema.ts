import z, { ZodType } from 'zod';
import {
    ForgotPasswordDTO,
    LoginDTO,
    RegisterDTO,
    ResetPasswordDTO,
    ValidateResetTokenDTO,
} from '../types/auth.dto';

export const registerDTOSchema = z.object({
    avatar: z.string().nullable().optional(),
    email: z.string().email(),
    name: z.string().min(1),
    password: z.string().min(6),
}) satisfies ZodType<RegisterDTO>;

export const loginDTOSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
}) satisfies ZodType<LoginDTO>;

export const forgotPasswordDTOSchema = z.object({
    email: z.string().trim().toLowerCase().email(),
    locale: z.enum(['en', 'ar']).optional(),
}) satisfies ZodType<ForgotPasswordDTO>;

export const resetPasswordDTOSchema = z.object({
    token: z.string().min(32),
    password: z.string()
        .min(8)
        .regex(/[A-Z]/)
        .regex(/\d/)
        .regex(/[^A-Za-z0-9]/),
}) satisfies ZodType<ResetPasswordDTO>;

export const validateResetTokenDTOSchema = z.object({
    token: z.string().min(32),
}) satisfies ZodType<ValidateResetTokenDTO>;
