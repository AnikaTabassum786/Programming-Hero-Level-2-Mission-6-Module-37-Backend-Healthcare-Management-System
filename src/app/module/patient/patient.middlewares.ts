import { NextFunction, Request, Response } from "express";
import { IUpdatePatientInfoPayload, IUpdatePatientProfilePayload } from "./patient.interface";

//This middleware organizes the data after the request arrives
export const updateMyPatientProfileMiddleware = (req : Request, res : Response, next : NextFunction) => { 
    


    //Object cannot be sent directly within FormData.
    //Because FormData can only send String or File.So the Object is converted to String:
    //JSON.parse ->Converts String back to Object.

    if (req.body.data) {
        req.body = JSON.parse(req.body.data)
    }

    //Now the payload contains patient update data.
    const payload: IUpdatePatientProfilePayload = req.body;
  

    //Multer stores uploaded files here.
    const files = req.files as { [fieldName: string]: Express.Multer.File[] | undefined }; 

    //Checking if profile photo has been uploaded.
    if (files?.profilePhoto?.[0]) {
        if (!payload.patientInfo) {
            payload.patientInfo = {} as IUpdatePatientInfoPayload; //If patientInfo does not exist, an empty object is created.
        }
        payload.patientInfo.profilePhoto = files.profilePhoto[0].path; //Let's say the Cloudinary URL is:
    }

     //Checking if the report has been uploaded.
    if (files?.medicalReports && files?.medicalReports.length > 0) {
        const newReports = files.medicalReports.map(file => ({
            reportName: file.originalname || `Medical Report - ${new Date().getTime()}`,
            reportLink: file.path,
        }))

        //Merge old reports if any
        if (payload.medicalReports && Array.isArray(payload.medicalReports)) {
            payload.medicalReports = [...payload.medicalReports, ...newReports]
        } else {
            payload.medicalReports = newReports;
        }
    }
    console.log(payload);

    req.body = payload;//Now the modified data is sent to the controller.
    console.log(req.body);

    next(); //Moving on to the next middleware, validateRequest(...)
};