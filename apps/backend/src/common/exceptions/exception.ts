import type { Response } from "express";
import { ModuleNameType } from "../utils/constant";
import { ErrorStatusCode } from "../utils/util.types";

const isPrismaError = (error: unknown): error is { name: string; message: string } =>
  typeof error === 'object' && error !== null && 'name' in error && (error as { name: unknown }).name === 'PrismaClientKnownRequestError';

export class CustomError extends Error {
    public errorType = 'custom';

    constructor(
        msg: string,
        public moduleName: ModuleNameType,
        public statusCode: ErrorStatusCode
    ) {
        super(msg);
    }
}

export const handleError = (error: unknown, res: Response) => {
    if (error instanceof CustomError) {
        console.log('customError', error);
        res.status(error.statusCode).send(error.message);
        return;
    }

    if (isPrismaError(error)) {
        console.log('Prisma error message', error.message);
        res.status(400).send({ message: error.message });
        return;
    }

    console.log(`internal server error`, error);
    // we should alert ourself
    res.status(500).send('internal server');
}
