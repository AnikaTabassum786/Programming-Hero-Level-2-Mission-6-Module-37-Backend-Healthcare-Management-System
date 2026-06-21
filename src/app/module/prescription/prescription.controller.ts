import { Request, Response } from 'express';
import { catchAsync } from '../../shared/catchAsync';
import { PrescriptionService } from './prescription.service';
import { sendResponse } from '../../shared/sendResponse';
import httpStatus from 'http-status';


// const givePrescription = catchAsync(async (req: Request, res: Response) => {
//     const payload = req.body;
//     const user = req.user;
//     const result = await PrescriptionService.givePrescription(user, payload);
//     sendResponse(res, {
//         httpStatusCode: httpStatus.OK,
//         success: true,
//         message: 'Prescription created successfully',
//         data: result,
//     });
// });

const myPrescriptions = catchAsync(async (req: Request, res: Response) => {
    const user = req.user;
    const result = await PrescriptionService.myPrescriptions(user);
    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: 'Prescription fetched successfully',
        data: result
    });
});


//catchAsync is for error handling. //If an error occurs inside,it will automatically go to the error handler instead of crashing the server.
const getAllPrescriptions = catchAsync(async (req: Request, res: Response) => {

    //Calling PrescriptionService.getAllPrescriptions(). It fetches all prescription data from the database.
    const result = await PrescriptionService.getAllPrescriptions();
    
    //A response is sent to the client (frontend).
    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: 'Prescriptions retrieval successfully',
        data: result
    });
});

// const updatePrescription = catchAsync(async (req: Request, res: Response) => {
//     const user = req.user;
//     const prescriptionId = req.params.id;
//     const payload = req.body;
//     const result = await PrescriptionService.updatePrescription(user, prescriptionId as string, payload);

//     sendResponse(res, {
//         httpStatusCode: httpStatus.OK,
//         success: true,
//         message: 'Prescription updated successfully',
//         data: result
//     });
// });

// const deletePrescription = catchAsync(async (req: Request, res: Response) => {
//     const user = req.user;
//     const prescriptionId = req.params.id;
//     await PrescriptionService.deletePrescription(user, prescriptionId as string);

//     sendResponse(res, {
//         httpStatusCode: httpStatus.OK,
//         success: true,
//         message: 'Prescription deleted successfully',
//     });
// });

export const PrescriptionController = {
    // givePrescription,
    myPrescriptions,
    getAllPrescriptions,
    // updatePrescription,
    // deletePrescription
};