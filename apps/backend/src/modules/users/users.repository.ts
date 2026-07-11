import { Prisma, Role } from "@prisma/client";
import { User } from "./users.schema";
import prisma from "../../prisma/prisma.service";

export class UserRepository {
    private prismaUser = prisma.user;


    findAll(query: Prisma.UserWhereInput): Promise<User[]> {
        return this.prismaUser.findMany({ where: query });
    }

    findById(id: string): Promise<User | null> {
        return this.prismaUser.findUniqueOrThrow({
            where: {
                id
            }
        });
    }

    findByEmail(email: string): Promise<User | null> {
        return this.prismaUser.findUnique({
            where: {
                email
            }
        });
    }


    create(name: string, email: string, password: string, avatar?: string, role: Role = Role.REGULAR,): Promise<User> {
        const user: Omit<User, 'id'> = {
            name,
            email,
            role,
            createdAt: new Date(),
            updatedAt: new Date(),
            password,
            avatar: avatar || null
        }

        return this.prismaUser.create({
            data: user
        });
    }

    update(id: string, name?: string, email?: string, avatar?: string, role?: Role): Promise<User> {
        return this.prismaUser.update({
            where: {
                id
            },
            data: {
                name,
                email,
                avatar,
                role
            } satisfies Prisma.UserUpdateInput
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