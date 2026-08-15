import { Request, Response, NextFunction } from 'express';
import { JsonWebTokenError } from 'jsonwebtoken';
import { verifyJWT } from '../../modules/auth/util/jwt.util';
import { CustomError } from '../exceptions/exception';
import { HttpErrorStatus } from '../utils/util.types';
import { userService } from '../../modules/users/users.service';

//Access token = “ticket to enter the building” (expires soon) eg.:15mins.
//Refresh token = “membership card” (used at the front desk to get a new ticket) eg.:7days.

export const isAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (req.session.userId) {
        const user = await userService.getUser(req.session.userId);

        if (user) {
            req.user = { id: user.id, email: user.email, role: user.role };
            next();
            return;
        }
    }


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
    let payload;

    try {
        payload = verifyJWT(jwt);
    } catch (error) {
        if (!(error instanceof JsonWebTokenError)) {
            next(error);
            return;
        }

        next(
            new CustomError(
                'Invalid token',
                'AUTH',
                HttpErrorStatus.Unauthorized
            )
        );
        return;
    }

    const user = await userService.getUser(payload.sub);

    if (!user) {
        next(
            new CustomError(
                'User no longer exists',
                'AUTH',
                HttpErrorStatus.Unauthorized
            )
        );
        return;
    }

    req.user = { id: user.id, email: user.email, role: user.role };
    next();
}
