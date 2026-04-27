/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction, Request, Response } from "express";
import { envVars } from "../../config/env";
import { error } from "node:console";
import status from "http-status";
import z from "zod";

export const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {

    interface TErrorSources {
        path: string;
        message: string
    }

    if (envVars.NODE_ENV === 'development') {
        console.log('Error from global error handler', err)
    }


    const errorSource: TErrorSources[] = []
    let statusCode: number = status.INTERNAL_SERVER_ERROR;
    let message: string = "Internal Server Error";

    if (err instanceof z.ZodError) {
        statusCode = status.BAD_REQUEST;
        message = "Zod Validation Error";


        err.issues.forEach(issue => {
            errorSource.push({
                path: issue.path.join(" => "),
                message: issue.message
            })
        })
    }

    res.status(statusCode).json({
        success: false,
        message: message,
        error: err.message
    })
}