import { NextFunction, Request, Response } from "express"
import z from "zod"

export const validationRequest = (ZodSchema: z.ZodObject)=>{
    return(req:Request, res:Response, next:NextFunction)=>{
        const parsedResult = ZodSchema.safeParse(req.body)

        if(!parsedResult.success){
            next(parsedResult.error)
        }

         req.body = parsedResult.data
         next()
    }
}