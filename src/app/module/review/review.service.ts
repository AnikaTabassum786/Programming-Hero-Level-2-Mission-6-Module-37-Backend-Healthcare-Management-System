import status from "http-status";
import { PaymentStatus, Role } from "../../../generated/prisma/enums";
import AppError from "../../errorHelpers/AppError";
import { IRequestUser } from "../../interfaces/requestUser.interface";
import { prisma } from "../../lib/prisma";
import { ICreateReviewPayload, IUpdateReviewPayload } from "./review.interface";


const giveReview = async (user : IRequestUser, payload : ICreateReviewPayload) => {
   const patientData = await prisma.patient.findUniqueOrThrow({
    where: {
        email : user.email //Retrieving the patient from the Patient table using the logged-in user's email.
    }
   });

   const appointmentData = await prisma.appointment.findUniqueOrThrow({
    where: {
        id : payload.appointmentId //Retrieving the appointment for which the review is to be submitted from the database.
    }   });

    //Cannot leave a review without making the payment.
    if(appointmentData.paymentStatus !== PaymentStatus.PAID){
        throw new AppError(status.BAD_REQUEST, "You can only review after payment is done");
    };

    //Can not give review of another patient
    if(appointmentData.patientId !== patientData.id){
        throw new AppError(status.BAD_REQUEST, "You can only review for your own appointments");
    };

    //Checking if there is a prior review for the appointment.
    const isReviewed = await prisma.review.findFirst({
        where: {
            appointmentId : payload.appointmentId
        }
    });

    //If a review already exists for this, it will not allow a new review to be created.
    if (isReviewed) {
        throw new AppError(status.BAD_REQUEST, "You have already reviewed for this appointment. You can update your review instead.");
    };   

    const result = await prisma.$transaction(async (tx) => {
        const review = await tx.review.create({   //create review
            data: {
                ...payload,
                patientId:appointmentData.patientId,
                doctorId: appointmentData.doctorId
            }
        });

        //Calculating the doctor's average rating
        const averageRating = await tx.review.aggregate({
            where: {
                doctorId: appointmentData.doctorId 
            },
            _avg: {
                rating: true
            }
        });

        //The average rating will be updated in the Doctor table.
        await tx.doctor.update({
            where: {
                id: appointmentData.doctorId
            },
            data: {
                averageRating: averageRating._avg.rating as number
            }
        });

        return review;
    });

    return result;
};



const getAllReviews = async (
) => {
    const reviews = await prisma.review.findMany({  //It will fetch all data from the review table.
        include: {
            doctor: true, //it will take extra data, Doctor details for each review
            patient: true, //patient details for each review
            appointment: true //appointment  for each review
        }
    });

    return reviews;
};

const myReviews = async (user: IRequestUser) => {
    const isUserExist = await prisma.user.findUnique({  //It is checking whether the user exists in the database.
        where: {
            email: user?.email
        }
    });
    if (!isUserExist) {
        throw new AppError(status.BAD_REQUEST, "Only patients can view their reviews");
    }


    // doctor is taking the doctor ID out from the table.
    if (isUserExist.role === Role.DOCTOR) {
        const doctorData = await prisma.doctor.findUniqueOrThrow({
            where: {
                email: user?.email
            }
        });
        return await prisma.review.findMany({ //doctor can view only the reviews written for this doctor.
            where: {
                doctorId: doctorData.id
            },
            include: { //With each review it takes: patient info, appointment info
                patient: true,
                appointment: true
            }
        });
    }


    //If user is a patient, then this part will work.
    if (isUserExist.role === Role.PATIENT) {
        const patientData = await prisma.patient.findUniqueOrThrow({ //Retrieving patient data
            where: {
                email: user?.email
            }
        });

        //Only the reviews written by this patient.

        return await prisma.review.findMany({
            where: {
                patientId: patientData.id
            },
            include: {
                doctor: true,
                appointment: true
            }
        });
    }
};

const updateReview = async (user: IRequestUser, reviewId: string, payload: IUpdateReviewPayload) => {
    const patientData = await prisma.patient.findUniqueOrThrow({
        where: {
            email: user?.email  //It is identifying exactly which patient the logged-in user is
        }
    });
    const reviewData = await prisma.review.findUniqueOrThrow({
        where: {
            id: reviewId   //The review that is being updated is being fetched from the database.
        }
    });

    //only updated your own review which you submitted
    if (!(patientData.id === reviewData.patientId)) {
        throw new AppError(status.BAD_REQUEST, "This is not your review!")
    }

    //Two tasks will be performed here simultaneously that's why transaction used
    //review update
    //doctor average rating update

    const result = await prisma.$transaction(async (tx) => {
        const updatedReview = await tx.review.update({
            where: {
                id: reviewId
            },
            data: {
                ...payload
            }
        });

        const averageRating = await tx.review.aggregate({
            where: {
                doctorId: reviewData.doctorId
            },
            _avg: {
                rating: true
            }
        });

        await tx.doctor.update({
            where: {
                id: updatedReview.doctorId
            },
            data: {
                averageRating: averageRating._avg.rating as number
            }
        })

        return updatedReview;
    });

    return result;
}

const deleteReview = async (user: IRequestUser, reviewId: string) => {
    const patientData = await prisma.patient.findUniqueOrThrow({ //Identifying the patient
        where: {
            email: user?.email
        }
    });
    const reviewData = await prisma.review.findUniqueOrThrow({ //The review intended for deletion is being retrieved from the database.
        where: {
            id: reviewId
        }
    });

    //You will only be able to delete your own review.
    if (!(patientData.id === reviewData.patientId)) {
        throw new AppError(status.BAD_REQUEST, "This is not your review!")
    }

    const result = await prisma.$transaction(async (tx) => {
        const deletedReview = await tx.review.delete({ 
            where: {
                id: reviewId
            }
        });

        const averageRating = await tx.review.aggregate({  //review delete
            where: {
                doctorId: deletedReview.doctorId
            },
            _avg: {
                rating: true
            }
        });

        await tx.doctor.update({  ////doctor average rating update
            where: {
                id: deletedReview.doctorId
            },
            data: {
                averageRating: averageRating._avg.rating as number
            }
        })
        return deletedReview;
    });

    return result;
}


export const ReviewService = {
    giveReview,
    getAllReviews,
    myReviews,
    updateReview,
    deleteReview
}