import { User as PrismaUser } from '../../generated/prisma';


export type User = PrismaUser;

export type PublicUser = Omit<PrismaUser, 'password'>;
