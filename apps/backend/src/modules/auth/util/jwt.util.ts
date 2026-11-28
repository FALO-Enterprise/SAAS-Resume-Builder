import jwt, { SignOptions } from "jsonwebtoken";
import { getEnvOrThrow } from "../../../common/utils/util";

// sign
type JWT_PAYLOAD_INPUT = { sub: string, name: string }
type JWT_PAYLOAD = JWT_PAYLOAD_INPUT & { iat?: number }

export const signJWT = (payload: JWT_PAYLOAD,
    options?: SignOptions
) => {
    return jwt.sign(payload, getEnvOrThrow('JWT_SECRET'), { expiresIn: '30d', ...options });
    // expiresIn => in ms format (library)
}

// verify

export const verifyJWT = (token: string): JWT_PAYLOAD => {
    return jwt.verify(token, getEnvOrThrow('JWT_SECRET')) as JWT_PAYLOAD;
}