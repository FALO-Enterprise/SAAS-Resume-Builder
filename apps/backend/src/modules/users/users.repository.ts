import { Prisma, Role } from "../../generated/prisma";
import { PublicUser, User } from "./users.schema";
import prisma from "../../prisma/prisma.service";

const withoutPassword = { password: true } as const;

export class UserRepository {
    private prismaUser = prisma.user;


    findAll(query: Prisma.UserWhereInput, skip?: number, take?: number): Promise<PublicUser[]> {
        return this.prismaUser.findMany({ where: query, skip, take, omit: withoutPassword });
    }

    count(query: Prisma.UserWhereInput): Promise<number> {
        return this.prismaUser.count({ where: query });
    }

    findById(id: string): Promise<PublicUser | null> {
        return this.prismaUser.findUnique({
            where: {
                id
            },
            omit: withoutPassword
        });
    }



    findByEmail(email: string): Promise<User | null> {
        return this.prismaUser.findUnique({
            where: {
                email
            }
        });
    }


    create(name: string, email: string, password: string, avatar?: string, role: Role = Role.USER, isVerified?: boolean): Promise<PublicUser> {
        return this.prismaUser.create({
            data: {
                name,
                email,
                role,
                password,
                isVerified: isVerified || false,
                avatar: avatar || null
            },
            omit: withoutPassword
        });
    }

    markAsVerified(id: string): Promise<PublicUser> {
        return this.prismaUser.update({
            where: { id },
            data: { isVerified: true },
            omit: withoutPassword
        });
    }


    update(id: string, name?: string, email?: string, avatar?: string, role?: Role): Promise<PublicUser> {
        return this.prismaUser.update({
            where: {
                id
            },
            data: {
                name,
                email,
                avatar,
                role
            } satisfies Prisma.UserUpdateInput,
            omit: withoutPassword
        });

    }

    async delete(id: string): Promise<boolean> {
        const user = await this.findById(id);
        if (user) {
            await this.prismaUser.delete({
                where: {
                    id
                }
            });
            return true;
        }
        return false;
    }
}
