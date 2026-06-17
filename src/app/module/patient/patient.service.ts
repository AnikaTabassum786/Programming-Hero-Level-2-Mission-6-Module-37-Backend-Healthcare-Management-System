// import { deleteFileFromCloudinary } from "../../config/cloudinary.config";
import { IRequestUser } from "../../interfaces/requestUser.interface";
import { prisma } from "../../lib/prisma";
import { IUpdatePatientHealthDataPayload, IUpdatePatientProfilePayload } from "./patient.interface";
import { convertToDateTime } from "./patient.utils";


//This is the entire backend logic for updating the patient profile where patient, user, and health data are updated together in a secure manner

const updateMyProfile = async (user: IRequestUser, payload: IUpdatePatientProfilePayload) => {
    //findUniqueOrThrow-> throw new Error("This is an intentional error to test Sentry integration in the backend.");
    const patientData = await prisma.patient.findUniqueOrThrow({
        where: {
            email: user.email
        },
        include: {
            patientHealthData: true,
            medicalReports: true,
        }
    });

    await prisma.$transaction(async (tx) => {


        if (payload.patientInfo) {
            await tx.patient.update({  // Update patient information like name,profile Photo,contact Number,address
                where: {
                    id: patientData.id
                },
                data: {
                    ...payload.patientInfo
                }
            });

            if (payload.patientInfo.name || payload.patientInfo.profilePhoto) {

                //If there is a new value, it will be taken. If not, it will be kept as the previous value.
                const userData = {
                    name: payload.patientInfo.name ? payload.patientInfo.name : patientData.name,
                    image: payload.patientInfo.profilePhoto ? payload.patientInfo.profilePhoto : patientData.profilePhoto,
                }

                ////Here the user table is updated, because: When patient info changes,the user (login profile) name/image is being synced
                await tx.user.update({
                    where: {
                        id: patientData.userId
                    },
                    data: {
                        ...userData
                    }
                });
            };


        }

        if (payload.patientHealthData) {  //Health data comes in (age, weight,bp etc.).
            const healthDataToSave: IUpdatePatientHealthDataPayload = {
                ...payload.patientHealthData,
            };


            //If DOB is a string → Date object must be created
            if (payload.patientHealthData.dateOfBirth) {
                healthDataToSave.dateOfBirth = convertToDateTime(
                    typeof healthDataToSave.dateOfBirth === "string" ? healthDataToSave.dateOfBirth : undefined
                ) as Date;
            }

            //upsert means: If data exists → will update , If not → will create

            await tx.patientHealthData.upsert({
                where: {
                    patientId: patientData.id
                },
                update: healthDataToSave, //Update case
                create: {                 //Create case
                    patientId: patientData.id,
                    ...healthDataToSave
                }
            })
        }

        if(payload.medicalReports && Array.isArray(payload.medicalReports) && payload.medicalReports.length > 0){
            for (const report of payload.medicalReports){
                if(report.shouldDelete && report.reportId){
                    const deletedReport = await tx.medicalReport.delete({
                        where : {
                            id : report.reportId,
                        }
                    });

                    if(deletedReport.reportLink){
                        // await deleteFileFromCloudinary(deletedReport.reportLink);
                    }
                }else if(report.reportName && report.reportLink){
                    await tx.medicalReport.create({
                        data : {
                            patientId : patientData.id,
                            reportName : report.reportName,
                            reportLink : report.reportLink,
                        }
                    });
                }
            }
        }
    });


    //Fresh data is brought after all updates.
    const result = await prisma.patient.findUnique({
        where: {
            id: patientData.id
        },
        include: {
            user: true,
            patientHealthData: true,
            medicalReports: true,
        }
    });

    return result;
};

export const PatientService = {
    updateMyProfile,
}