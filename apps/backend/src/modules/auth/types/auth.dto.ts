import { Plan, User } from "@prisma/client";

export type LoginDTO = {
    email: string;
    password: string;
}

export type AuthenticatedUserDTO = Omit<User, 'password'> & {
    plan: Pick<Plan, 'id' | 'name'>;
}

export type LoginResponseDTO = AuthenticatedUserDTO;
export type LoginResponseDTOWithJWT = {
    user: AuthenticatedUserDTO;
    token: string;
}

export type RegisterDTO =
    Omit<Pick<User, 'avatar' | 'email' | 'name' | 'password'>, 'avatar'> & {
        avatar?: string | null;
    };
export type RegisterResponseDTO = AuthenticatedUserDTO;
