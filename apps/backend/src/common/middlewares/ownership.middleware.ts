import { Request, Response, NextFunction } from 'express';
import { CustomError } from '../exceptions/exception';
import { HttpErrorStatus } from '../utils/util.types';
import { MODULES_NAMES, ROLES_NAMES } from '../utils/constant';

/**
 * Restricts an `:id`-scoped account route to its owner (or an admin).
 *
 * `isAuthenticated` only proves that *somebody* is logged in — it never
 * compares the caller against the record named in the URL. Without this guard,
 * any authenticated user could read, modify or delete another account just by
 * editing the id in the path.
 *
 * Must be mounted AFTER `isAuthenticated`, which is what populates `req.user`.
 */
export const isSelfOrAdmin =
    (paramName: string = 'id') =>
        (req: Request, _res: Response, next: NextFunction) => {
            const actor = req.user;

            if (!actor) {
                next(
                    new CustomError(
                        'user is not Authenticated',
                        MODULES_NAMES.auth,
                        HttpErrorStatus.Unauthorized
                    )
                );
                return;
            }

            const targetId = req.params[paramName];

            if (!targetId) {
                next(
                    new CustomError(
                        'ID required',
                        MODULES_NAMES.user,
                        HttpErrorStatus.BadRequest
                    )
                );
                return;
            }

            if (actor.role === ROLES_NAMES.admin || actor.id === targetId) {
                next();
                return;
            }

            // Deliberately vague: revealing "that account exists but isn't yours"
            // would turn this endpoint into a user-id oracle.
            next(
                new CustomError(
                    'You are not allowed to access this account',
                    MODULES_NAMES.user,
                    HttpErrorStatus.Forbidden
                )
            );
        };

/** Restricts a route to admins — used for endpoints that enumerate all users. */
export const isAdmin = (req: Request, _res: Response, next: NextFunction) => {
    if (req.user?.role === ROLES_NAMES.admin) {
        next();
        return;
    }

    next(
        new CustomError(
            'You are not allowed to access this resource',
            MODULES_NAMES.user,
            HttpErrorStatus.Forbidden
        )
    );
};
