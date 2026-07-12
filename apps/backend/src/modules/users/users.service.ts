/* eslint-disable */
import { UserRepository } from "./users.repository";
import { User } from "./users.schema";

class UserService {
    private repository = new UserRepository();

    getUsers(page: number, limit: number): Promise<User[]> {
        return this.repository.findAll({});
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