import { Router } from "express";
import { UserController } from "./user.controller";

import { validationRequest } from "../../middleware/validateRequest";
import { crateDoctorZodSchema } from "./user.validation";




const router = Router();


router.post("/create-doctor", 
//     (req:Request,res:Response,next:NextFunction)=>{
//     const parsedResult = crateDoctorZodSchema.safeParse(req.body);
//     if(!parsedResult.success){
//         next(parsedResult.error)
//     }
//     //sanitizing data
//     req.body = parsedResult.data
//     next()
// } 

validationRequest(crateDoctorZodSchema)
,

UserController.createDoctor)

export const UserRoute = router;