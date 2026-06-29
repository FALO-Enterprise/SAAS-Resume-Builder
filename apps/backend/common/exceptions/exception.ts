import type { Response } from "express";
import { ModuleNameType } from "../utils/constant";
import { ErrorStatusCode } from "../utils/util.types";
import { Prisma } from "@prisma/client";


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

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        console.log('Prisma error message', error.message)
        res.error({ message: error.message, statusCode: 400 });
        return;
    }

    console.log(`internal server error`, error);
    // we should alert ourself
    res.status(500).send('internal server');
}
