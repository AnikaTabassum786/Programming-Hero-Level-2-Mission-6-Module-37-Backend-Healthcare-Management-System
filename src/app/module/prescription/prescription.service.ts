/* eslint-disable @typescript-eslint/no-explicit-any */

import status from "http-status";
import AppError from "../../errorHelpers/AppError";
import { IRequestUser } from "../../interfaces/requestUser.interface";
import { prisma } from "../../lib/prisma";
import { ICreatePrescriptionPayload } from "./prescription.interface";
import { Role } from "../../../generated/prisma/enums";
import { generatePrescriptionPDF } from "./prescription.utils";
import { deleteFileFromCloudinary, uploadFileToCloudinary } from "../../../config/cloudinary.config";
import { sendEmail } from "../../utils/email";

//The function of this API is to enable a doctor to create a prescription for an appointment, generate a PDF, upload it to Cloudinary, and send an email to the patient.

const givePrescription = async (user: IRequestUser, payload: ICreatePrescriptionPayload) => {
    const doctorData = await prisma.doctor.findUniqueOrThrow({ //Information about the logged-in doctor is retrieved from the database.
        where: {
            email: user?.email
        },
    });

    const appointmentData = await prisma.appointment.findUniqueOrThrow({ //All appointment details are retrieved.It takes other info like patient,specialties and doctorSchedules
        where: {
            id: payload.appointmentId
        },
        include: {
            patient: true,
            doctor: {
                include: {
                    specialties: true
                }
            },
            schedule: {
                include: {
                    doctorSchedules: true
                }
            },
        }
    });

    //Check the doctor's appointment status.A doctor cannot write a prescription for another doctor's patient.
    if (appointmentData.doctorId !== doctorData.id) {
        throw new AppError(status.BAD_REQUEST, "You can only give prescription for your own appointments");
    }


    //Whether a prescription has been issued previously.
    const isAlreadyPrescribed = await prisma.prescription.findFirst({
        where: {
            appointmentId: payload.appointmentId
        }
    });


    //Checking. If there is a prior prescription for the same appointment
    if (isAlreadyPrescribed) {
        throw new AppError(status.BAD_REQUEST, "You have already given prescription for this appointment. You can update the prescription instead.");
    }

    const followUpDate = new Date(payload.followUpDate); //Convert String to Date object 



    const result = await prisma.$transaction(async (tx) => {
        const result = await tx.prescription.create({ //Prescription Create
            data: {
                ...payload,
                followUpDate,
                doctorId: appointmentData.doctorId,
                patientId: appointmentData.patientId,
            }
        });

        const pdfBuffer = await generatePrescriptionPDF({ //The prescription PDF is generated here with these info
            doctorName: doctorData.name,
            patientName: appointmentData.patient.name,
            appointmentDate: appointmentData.schedule.startDateTime,
            instructions: payload.instructions,
            followUpDate,
            doctorEmail: doctorData.email,
            patientEmail: appointmentData.patient.email,
            prescriptionId: result.id,
            createdAt: new Date(),
        });

        //A buffer consists of binary data.Simply, The PDF file does not yet exist as a file.It exists in memory as data.
        const fileName = `Prescription-${Date.now()}.pdf`;
        const uploadedFile = await uploadFileToCloudinary(pdfBuffer, fileName); //The PDF file is uploaded to Cloudinary.
        const pdfUrl = uploadedFile.secure_url; // Cloudinary return a url

        const updatedPrescription = await tx.prescription.update({ //The prescription record is updated.
            where: {
                id: result.id
            },
            data: {
                pdfUrl
            }
        });

        try {
            const patient = appointmentData.patient;
            const doctor = appointmentData.doctor;

            await sendEmail({  //A notification will be sent to the patient's email.
                to: patient.email,
                subject: `You have received a new prescription from Dr. ${doctor.name}`,
                templateName: "prescription",
                templateData: { //These info in in email template
                    doctorName: doctor.name,
                    patientName: patient.name,
                    specialization: doctor.specialties.map((s: any) => s.title).join(", "),
                    appointmentDate: new Date(appointmentData.schedule.startDateTime).toLocaleString(),
                    issuedDate: new Date().toLocaleDateString(),
                    prescriptionId: result.id,
                    instructions: payload.instructions,
                    followUpDate: followUpDate.toLocaleDateString(),
                    pdfUrl: pdfUrl
                },
                attachments: [ //The PDF will be attached to the email.The patient will be able to download the PDF upon opening the email.
                    {
                        filename: fileName,
                        content: pdfBuffer,
                        contentType: 'application/pdf'
                    }
                ]
            })
        } catch (error) {
            console.log("Failed To send email notification for prescription", error);
        }

        return updatedPrescription; //The prescription will remain saved even if the email is not sent.
    }, {
        maxWait: 15000,
        timeout: 20000,
    });

    return result;

};

const myPrescriptions = async (user: IRequestUser) => {

    //The user is searched for in the database using their email.
    const isUserExists = await prisma.user.findUnique({
        where: {
            email: user?.email
        }
    });

    if (!isUserExists) {
        throw new AppError(status.NOT_FOUND, "User not found");
    }

    //If the logged-in user is a doctor
    if (isUserExists.role === Role.DOCTOR) {
        const prescriptions = await prisma.prescription.findMany({
            where: {
                doctor: {
                    email: user?.email  //Retrieve the prescriptions written by the doctor who has logged in.
                }
            },
            include: {   //Retrieve also patient,doctor and appointment information   
                patient: true,
                doctor: true,
                appointment: true,
            }
        });
        return prescriptions;
    }

    //If the logged-in user is a patient
    if (isUserExists.role === Role.PATIENT) {
        const prescriptions = await prisma.prescription.findMany({
            where: {
                patient: {
                    email: user?.email  //Retrieve all prescriptions for the patient who has logged in.
                }
            },
            include: {  // //Retrieve also patient,doctor and appointment information  
                patient: true,
                doctor: true,
                appointment: true,
            }
        });
        return prescriptions;
    }
};

const getAllPrescriptions = async () => {
    const result = await prisma.prescription.findMany({ // fetch all Prescriptions with patient.doctor and appointment information
        include: {
            patient: true,
            doctor: true,
            appointment: true,
        }
    })

    return result;
};

//The function of this API is to allow a doctor to update their prescription. Upon updating, a new PDF will be generated and uploaded to Cloudinary, the old PDF will be deleted, and an email will be sent to the patient.

const updatePrescription = async (user: IRequestUser, prescriptionId: string, payload: any) => {
    // Verify user exists
    const isUserExists = await prisma.user.findUnique({ //Check if the user exists
        where: {
            email: user?.email
        }
    });

    if (!isUserExists) {
        throw new AppError(status.NOT_FOUND, "User not found"); //If user not exist
    }

    // Fetch current prescription data.It is fetching all the prescription data.
    const prescriptionData = await prisma.prescription.findUniqueOrThrow({ 
        where: {
            id: prescriptionId
        },
        include: {
            doctor: true,
            patient: true,
            appointment: {
                include: {
                    schedule: true
                }
            }
        }
    });

    // Verify the user is the doctor for this prescription
    if (!(user?.email === prescriptionData.doctor.email)) {
        throw new AppError(status.BAD_REQUEST, "This is not your prescription!")
    }

    // Prepare updated data
    // If new instructions are sent, it will use those. If none are sent,it will retain the old value
    const updatedInstructions = payload.instructions || prescriptionData.instructions;
    const updatedFollowUpDate = payload.followUpDate
        ? new Date(payload.followUpDate)
        : prescriptionData.followUpDate;

    // Step 1: Generate new PDF with updated data
    //A new PDF is being created with updated prescription information.
    const pdfBuffer = await generatePrescriptionPDF({
        doctorName: prescriptionData.doctor.name,
        doctorEmail: prescriptionData.doctor.email,
        patientName: prescriptionData.patient.name,
        patientEmail: prescriptionData.patient.email,
        appointmentDate: prescriptionData.appointment.schedule.startDateTime,
        instructions: updatedInstructions,
        followUpDate: updatedFollowUpDate,
        prescriptionId: prescriptionData.id,
        createdAt: prescriptionData.createdAt,
    });

    // Step 2: Upload new PDF to Cloudinary
   
    const fileName = `prescription-updated-${Date.now()}.pdf`;
    const uploadedFile = await uploadFileToCloudinary(pdfBuffer, fileName);
    const newPdfUrl = uploadedFile.secure_url;

    // Step 3: Delete old PDF from Cloudinary if it exists
    //If the deletion fails,It will only log the error to the console.It will not stop the prescription update.
    if (prescriptionData.pdfUrl) {
        try {
            await deleteFileFromCloudinary(prescriptionData.pdfUrl);
        } catch (deleteError) {
            // Log but don't fail
            console.error("Failed to delete old PDF from Cloudinary:", deleteError);
        }
    }

    // Step 4: Update prescription in database
    //Update Instructions,Follow Up Date,PDF URL
 
    const result = await prisma.prescription.update({
        where: {
            id: prescriptionId
        },
        data: {
            instructions: updatedInstructions,
            followUpDate: updatedFollowUpDate,
            pdfUrl: newPdfUrl
        },
        include: {
            patient: true,
            doctor: true,
            appointment: {
                include: {
                    schedule: true
                }
            },

        }
    });

    // Step 5: Send updated prescription email to patient
    try {
        await sendEmail({
            to: result.patient.email,
            subject: `Your Prescription has been Updated by ${result.doctor.name}`,
            templateName: "prescription",
            templateData: {
                patientName: result.patient.name,
                doctorName: result.doctor.name,
                specialization: "Healthcare Provider",
                prescriptionId: result.id,
                appointmentDate: new Date(result.appointment.schedule.startDateTime).toLocaleString(),
                issuedDate: new Date(result.createdAt).toLocaleDateString(),
                followUpDate: new Date(result.followUpDate).toLocaleDateString(),
                instructions: result.instructions,
                pdfUrl: newPdfUrl
            },
            //The patient will also receive a PDF file along with the email.
            attachments: [
                {
                    filename: `Prescription-${result.id}.pdf`,
                    content: pdfBuffer,
                    contentType: "application/pdf"
                }
            ]
        });
    } catch (emailError) {
        // Log email error but don't fail the prescription update
        console.error("Failed to send updated prescription email:", emailError);
    }

    return result;
};

const deletePrescription = async (user: IRequestUser, prescriptionId: string): Promise<void> => {
    // Verify user exists
    const isUserExists = await prisma.user.findUnique({
        where: {
            email: user?.email
        }
    });

    if (!isUserExists) {
        throw new AppError(status.NOT_FOUND, "User not found");
    }

    // Fetch prescription data
    const prescriptionData = await prisma.prescription.findUniqueOrThrow({
        where: {
            id: prescriptionId
        },
        include: {
            doctor: true
        }
    });

    // Verify the user is the doctor for this prescription
    if (!(user?.email === prescriptionData.doctor.email)) {
        throw new AppError(status.BAD_REQUEST, "This is not your prescription!")
    }

    // Delete PDF from Cloudinary if it exists
    if (prescriptionData.pdfUrl) {
        try {
            await deleteFileFromCloudinary(prescriptionData.pdfUrl);
        } catch (deleteError) {
            // Log but don't fail - still delete from database
            console.error("Failed to delete PDF from Cloudinary:", deleteError);
        }
    }

    // Delete prescription from database
    await prisma.prescription.delete({
        where: {
            id: prescriptionId
        }
    });
}


export const PrescriptionService = {
    givePrescription,
    myPrescriptions,
    getAllPrescriptions,
    updatePrescription,
    deletePrescription
}