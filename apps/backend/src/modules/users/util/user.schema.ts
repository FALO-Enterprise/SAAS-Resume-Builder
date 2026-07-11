import z, { ZodType } from 'zod';
import { User } from '../users.schema';
import { ROLES_NAMES } from '../../../common/utils/constant';

export const userSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.email(),
    role: z.enum(Object.values(ROLES_NAMES)).default('REGULAR'),
    avatar: z.string().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
    password: z.string().min(8) // hash value
}) satisfies ZodType<User>