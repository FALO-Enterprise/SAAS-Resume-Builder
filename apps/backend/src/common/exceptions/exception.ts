import type { Response } from "express";
import { ModuleNameType } from "../utils/constant";
import { ErrorStatusCode } from "../utils/util.types";

const isPrismaError = (error: unknown): error is { name: string; message: string } =>
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    typeof (error as { name: unknown }).name === 'string' &&
    (error as { name: string }).name.startsWith('PrismaClient');

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
        res.error({
            statusCode: error.statusCode,
            message: error.message,
        });
        return;
    }

    if (isPrismaError(error)) {
        console.error('Prisma request failed', error.message);
        res.error({
            statusCode: 400,
            message: 'The request could not be completed',
        });
        return;
    }

    console.error('Internal server error', error);
    res.error({
        statusCode: 500,
        message: 'Internal server error',
    });
}
