import { Request, Response, NextFunction } from 'express';
import { verifyJWT } from '../../modules/auth/util/jwt.util';
import { CustomError } from '../exceptions/exception';
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
    try {
        verifyJWT(jwt);
        next();
    } catch {
        next(
            new CustomError(
                'Invalid token',
                'AUTH',
                HttpErrorStatus.Unauthorized
            )
        );
    }
}