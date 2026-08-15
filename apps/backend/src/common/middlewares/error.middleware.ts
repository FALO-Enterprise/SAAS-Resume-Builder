import type { ErrorRequestHandler } from 'express';

import { handleError } from '../exceptions/exception';

export const errorHandler: ErrorRequestHandler = (error, _req, res, next) => {
    if (res.headersSent) {
        next(error);
        return;
    }

    handleError(error, res);
};
