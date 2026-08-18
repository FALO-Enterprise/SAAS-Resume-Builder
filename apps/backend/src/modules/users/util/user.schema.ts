import z, { ZodType } from 'zod';
import { User } from '../users.schema';
import { ROLES_NAMES } from '../../../common/utils/constant';

export const userSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.email(),
    role: z.enum(Object.values(ROLES_NAMES)).default('USER'),
    avatar: z.string().nullable(),
    isVerified: z.boolean().default(false),
    createdAt: z.date(),
    updatedAt: z.date(),
    password: z.string().min(8), // hash value
    notificationSettings: z.any().nullable(),
}) satisfies ZodType<User>