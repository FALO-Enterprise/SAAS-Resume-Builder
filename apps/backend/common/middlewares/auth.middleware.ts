import { Request, Response, NextFunction } from 'express';
import { userService } from '../module/user/user.service';
import { verifyJWT } from '../module/auth/util/jwt.util';
import { CustomError } from '../utils/exception';
import { HttpErrorStatus } from '../utils/util.types';

//Access token = “ticket to enter the building” (expires soon) eg.:15mins.
//Refresh token = “membership card” (used at the front desk to get a new ticket) eg.:7days.

export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    // if (req.session.userId) {
    //     const isUserStillExist = userService.isUserIdExist(req.session.userId);

    //     if (isUserStillExist) {
    //         next();
    //         return;
    //     }
    // }
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        next(
            new CustomError(
                'user is not Authenticated',
                'AUTH',
                HttpErrorStatus.Unauthorized
            )
        );
        return;
    }

    const jwt = authHeader.replace('Bearer ', '');
    console.log("jwt", jwt);
    try {
        verifyJWT(jwt);
        next();
    } catch (error) {
        console.log("jwt is wrong", error);
        next(
            new CustomError(
                'Invalid token',
                'AUTH',
                HttpErrorStatus.Unauthorized
            )
        );
    }
}