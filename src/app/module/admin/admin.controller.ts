import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { AdminService } from "./admin.service";
import status from "http-status";


const getAllAdmin = catchAsync(async(req:Request,res:Response)=>{
    const result = await AdminService.getAllAdmin();

    sendResponse(res,{
        httpStatusCode:status.OK,
        success:true,
        message:"Admin Fetched Successfully",
        data:result
    })

    return result
})

export const AdminController={
    getAllAdmin
}