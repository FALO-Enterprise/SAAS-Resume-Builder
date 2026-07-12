import z, { ZodType } from 'zod';
import { LoginDTO, RegisterDTO } from '../types/auth.dto';

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
