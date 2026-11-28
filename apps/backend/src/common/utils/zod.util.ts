import { ZodError, ZodType } from 'zod';
import { CustomError } from '../exceptions/exception';
import { ModuleNameType } from './constant';
import { HttpErrorStatus } from './util.types';


export const zodValidation = <T>(schema: ZodType<T>, payload: T, moduleName: ModuleNameType) => {
    // validate
    // return valid data
    // catch error
    // custom error

    try {
        const safeData = schema.parse(payload);
        return safeData;
    } catch (error) {
        if (error instanceof ZodError) {
            throw new CustomError(error.message, moduleName, HttpErrorStatus.BadRequest)
        };

        throw error;
    }
}