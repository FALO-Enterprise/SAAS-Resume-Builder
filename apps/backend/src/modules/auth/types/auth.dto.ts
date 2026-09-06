import { Plan, User } from "../../../generated/prisma";

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

export type ForgotPasswordDTO = {
    email: string;
    locale?: 'en' | 'ar';
};

export type ResetPasswordDTO = {
    token: string;
    password: string;
};

export type ValidateResetTokenDTO = Pick<ResetPasswordDTO, 'token'>;
