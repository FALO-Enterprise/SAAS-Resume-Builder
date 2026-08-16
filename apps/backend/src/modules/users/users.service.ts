/* eslint-disable */
import { UserRepository } from "./users.repository";
import { User } from "./users.schema";
import type { PaginationMeta } from "../../common/middlewares/response.middleware";

const DEFAULT_PAGE_LIMIT = 20;
const MAX_PAGE_LIMIT = 100;

class UserService {
    private repository = new UserRepository();

    async getUsers(page: number, limit: number): Promise<{ users: User[]; meta: PaginationMeta }> {
        const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
        const safeLimit = Number.isFinite(limit) && limit > 0
            ? Math.min(Math.floor(limit), MAX_PAGE_LIMIT)
            : DEFAULT_PAGE_LIMIT;
        const skip = (safePage - 1) * safeLimit;

        const [users, totalRecords] = await Promise.all([
            this.repository.findAll({}, skip, safeLimit),
            this.repository.count({}),
        ]);

        return {
            users,
            meta: {
                page: safePage,
                limit: safeLimit,
                totalRecords,
                totalPages: Math.max(1, Math.ceil(totalRecords / safeLimit)),
            },
        };
    }

    getUser(id: string): Promise<User | null> {
        return this.repository.findById(id);
    }

    public findByEmail(email: string): Promise<User | null> {
        return this.repository.findByEmail(email);
    }

    public createUser(name: string, email: string, password: string, avatar?: string): Promise<User> {
        return this.repository.create(name, email, password, avatar);
    }

    updateUser(id: string, name?: string, email?: string, avatar?: string): Promise<User> {
        return this.repository.update(id, name, email, avatar);
    }

    deleteUser(id: string): Promise<boolean> {
        return this.repository.delete(id);
    }

    isUserIdExist(id: string): Promise<boolean> {
        return this.repository.findById(id).then(user => !!user);
    }

    public markUserAsVerified(id: string): Promise<User> {
        return this.repository.markAsVerified(id);
    }
}

export const userService = new UserService(); 