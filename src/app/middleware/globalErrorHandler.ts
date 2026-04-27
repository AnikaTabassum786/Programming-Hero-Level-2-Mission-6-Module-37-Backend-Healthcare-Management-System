/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction, Request, Response } from "express";
import { envVars } from "../../config/env";
import { error } from "node:console";
import status from "http-status";
import z from "zod";
import { TErrorResponse, TErrorSources } from "../interfaces/error.interface";
import { handleZodError } from "../errorHelpers/handleZodError";

export const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {


    if (envVars.NODE_ENV === 'development') {
        console.log('Error from global error handler', err)
    }


    let errorSources: TErrorSources[] = []
    let statusCode: number = status.INTERNAL_SERVER_ERROR;
    let message: string = "Internal Server Error";

    if (err instanceof z.ZodError) {

        const simplifiedError = handleZodError(err);
        statusCode = simplifiedError.statusCode as number
        message = simplifiedError.message
        errorSources = [...simplifiedError.errorSources]

        err.issues.forEach(issue => {
            errorSources.push({
                path: issue.path.join(" => "),
                message: issue.message
            })
        })
    }

     const errorResponse: TErrorResponse = {
        success: false,
        message: message,
        errorSources,
        error: envVars.NODE_ENV === 'development' ? err : undefined
    }

    res.status(statusCode).json(errorResponse);
}