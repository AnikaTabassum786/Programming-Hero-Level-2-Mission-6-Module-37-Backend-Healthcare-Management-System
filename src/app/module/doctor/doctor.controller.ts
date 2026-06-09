import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";
import { DoctorService } from "./doctor.service";
import { sendResponse } from "../../shared/sendResponse";
import status from "http-status";
import { IQueryParams } from "../../interfaces/query.interface";


const getAllDoctors = catchAsync(async(req:Request,res:Response)=>{
    const query = req.query;
    const result = await DoctorService.getAllDoctors(query as IQueryParams);

    sendResponse(res,{
        httpStatusCode:status.OK,
        success:true,
        message:"Doctor Fetched Successfully",
        data:result.data,
        meta:result.meta
    })

    return result
})

const getDoctorById = catchAsync(async(req:Request,res:Response)=>{

    const {doctorId} = req.params
    const result = await DoctorService.getDoctorById(doctorId as string);
     sendResponse(res,{
        httpStatusCode:status.OK,
        success:true,
        message:"Doctor Fetched Successfully",
        data:result
    })

    return result
})

const deleteDoctor= catchAsync(async(req:Request,res:Response)=>{
  const {doctorId} = req.params

  const result = await DoctorService.deleteDoctor(doctorId as string);

    sendResponse(res,{
        httpStatusCode:status.OK,
        success:true,
        message:"Doctor Deleted Successfully",
        data:result
    })

    return result
})

const updateDoctor = catchAsync(async(req:Request,res:Response)=>{
    const {doctorId} = req.params

    const result = await DoctorService.updateDoctor(doctorId as string,req.body)

    sendResponse(res,{
        httpStatusCode:status.OK,
        success:true,
        message:"Doctor Updated Successfully",
         data:result
    })
})

export const DoctorController={
   getAllDoctors ,
   getDoctorById,
   deleteDoctor,
   updateDoctor
}

