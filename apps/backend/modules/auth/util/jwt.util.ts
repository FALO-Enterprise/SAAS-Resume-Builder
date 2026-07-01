/* eslint-disable */

import jwt, { SignOptions, VerifyOptions } from "jsonwebtoken";

// sign 
type JWT_PAYLOAD_INPUT = { sub: string, name: string }
type JWT_PAYLOAD = JWT_PAYLOAD_INPUT & { iat?: number }
const JWT_SECRET = "JWT_SECRET";

export const signJWT = (payload: JWT_PAYLOAD,
    options?: SignOptions
) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
    // expiresIn => in ms format (library)
}

// verify

export const verifyJWT = (token: string): JWT_PAYLOAD => {
    return jwt.verify(token, JWT_SECRET) as JWT_PAYLOAD;
}