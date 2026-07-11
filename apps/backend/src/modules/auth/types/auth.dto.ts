import { User } from "../../users/users.schema";

export type LoginDTO = {
    email: string;
    password: string;
}

export type LoginResponseDTO = Omit<User, 'password'>
export type LoginResponseDTOWithJWT = {
    user: Omit<User, 'password'>;
    token: string;
}

export type RegisterDTO = Pick<User, 'avatar' | 'email' | 'name' | 'password'>

export type RegisterResponseDTO = Omit<User, 'password'>