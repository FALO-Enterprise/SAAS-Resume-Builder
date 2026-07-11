/* eslint-disable */

import { Request, Response, NextFunction } from "express";
import { AuthService } from "./auth.service";
import { HttpErrorStatus, StringObject } from "../../common/utils/util.types";
import { LoginDTO, LoginResponseDTO, LoginResponseDTOWithJWT, RegisterDTO, RegisterResponseDTO } from "./types/auth.dto";
import { zodValidation } from "../../common/utils/zod.util";
import { loginDTOSchema, registerDTOSchema } from "./util/auth.schema";
import { deleteUploadedAsset } from "../../common/utils/assets.util";
import { signJWT } from "./util/jwt.util";

export class AuthController {

    private authService = new AuthService();

    public async register(req: Request<StringObject, StringObject, RegisterDTO>, res: Response<RegisterResponseDTO | string>, next: NextFunction) {
        try {
            // utility method to validate zod schema
            const payloadData = zodValidation(registerDTOSchema, req.body, 'AUTH');

            const user = await this.authService.register(payloadData);
            console.log('user registered succefully');
            res.create(user);
        } catch (err) {
            await deleteUploadedAsset(req.file?.filename!);
            res.error({ statusCode: HttpErrorStatus.InternalServerError, message: `Internal server error: ${err}` });
        }

    }

    public async login(
        req: Request<StringObject, StringObject, LoginDTO>,
        res: Response<LoginResponseDTO | string>,
        next: NextFunction
    ) {
        const payloadData = zodValidation(loginDTOSchema, req.body, 'AUTH');
        const userData = await this.authService.login(payloadData);
        if (!userData) {
            res.status(HttpErrorStatus.BadRequest).send('wrong credentials');
            return;
        }
        console.log(req.session, 'before i set the req.session');
        req.session.userId = userData.id;

        //  express session => create new entity  { 12345: { userId:123213} } => save memory
        // express session on  response it will send the cookie with same key on session memory [abc] and sign it with my secret

        res.ok(userData);
    }


    public async loginWithJWT(
        req: Request<StringObject, StringObject, LoginDTO>,
        res: Response<LoginResponseDTOWithJWT | string>,
        next: NextFunction
    ) {
        const payloadData = zodValidation(loginDTOSchema, req.body, 'AUTH');
        const userData = await this.authService.login(payloadData);
        if (!userData) {
            res.status(HttpErrorStatus.BadRequest).send('wrong credentials');
            return;
        }
        const token = signJWT({ sub: userData.id, name: userData.name });
        res.ok({ user: userData, token });
    }
    public logout(req: Request, res: Response) {
        req.session.destroy((err) => {
            if (err) {
                res.error({ statusCode: HttpErrorStatus.InternalServerError, message: 'Failed to logout' });
                return;
            }
            res.ok({});
        });
    }
}


export const authController = new AuthController();


