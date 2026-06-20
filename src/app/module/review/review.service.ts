import status from "http-status";
import { PaymentStatus } from "../../../generated/prisma/enums";
import AppError from "../../errorHelpers/AppError";
import { IRequestUser } from "../../interfaces/requestUser.interface";
import { prisma } from "../../lib/prisma";
import { ICreateReviewPayload } from "./review.interface";


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

// const getAllReviews = async (
// ) => {
//     const reviews = await prisma.review.findMany({
//         include: {
//             doctor: true,
//             patient: true,
//             appointment: true
//         }
//     });

//     return reviews;
// };

// const myReviews = async (user: IRequestUser) => {
//     const isUserExist = await prisma.user.findUnique({
//         where: {
//             email: user?.email
//         }
//     });
//     if (!isUserExist) {
//         throw new AppError(status.BAD_REQUEST, "Only patients can view their reviews");
//     }

//     if (isUserExist.role === Role.DOCTOR) {
//         const doctorData = await prisma.doctor.findUniqueOrThrow({
//             where: {
//                 email: user?.email
//             }
//         });
//         return await prisma.review.findMany({
//             where: {
//                 doctorId: doctorData.id
//             },
//             include: {
//                 patient: true,
//                 appointment: true
//             }
//         });
//     }

//     if (isUserExist.role === Role.PATIENT) {
//         const patientData = await prisma.patient.findUniqueOrThrow({
//             where: {
//                 email: user?.email
//             }
//         });
//         return await prisma.review.findMany({
//             where: {
//                 patientId: patientData.id
//             },
//             include: {
//                 doctor: true,
//                 appointment: true
//             }
//         });
//     }
// };

// const updateReview = async (user: IRequestUser, reviewId: string, payload: IUpdateReviewPayload) => {
//     const patientData = await prisma.patient.findUniqueOrThrow({
//         where: {
//             email: user?.email
//         }
//     });
//     const reviewData = await prisma.review.findUniqueOrThrow({
//         where: {
//             id: reviewId
//         }
//     });
//     if (!(patientData.id === reviewData.patientId)) {
//         throw new AppError(status.BAD_REQUEST, "This is not your review!")
//     }
//     const result = await prisma.$transaction(async (tx) => {
//         const updatedReview = await tx.review.update({
//             where: {
//                 id: reviewId
//             },
//             data: {
//                 ...payload
//             }
//         });

//         const averageRating = await tx.review.aggregate({
//             where: {
//                 doctorId: reviewData.doctorId
//             },
//             _avg: {
//                 rating: true
//             }
//         });

//         await tx.doctor.update({
//             where: {
//                 id: updatedReview.doctorId
//             },
//             data: {
//                 averageRating: averageRating._avg.rating as number
//             }
//         })

//         return updatedReview;
//     });

//     return result;
// }

// const deleteReview = async (user: IRequestUser, reviewId: string) => {
//     const patientData = await prisma.patient.findUniqueOrThrow({
//         where: {
//             email: user?.email
//         }
//     });
//     const reviewData = await prisma.review.findUniqueOrThrow({
//         where: {
//             id: reviewId
//         }
//     });
//     if (!(patientData.id === reviewData.patientId)) {
//         throw new AppError(status.BAD_REQUEST, "This is not your review!")
//     }

//     const result = await prisma.$transaction(async (tx) => {
//         const deletedReview = await tx.review.delete({
//             where: {
//                 id: reviewId
//             }
//         });

//         const averageRating = await tx.review.aggregate({
//             where: {
//                 doctorId: deletedReview.doctorId
//             },
//             _avg: {
//                 rating: true
//             }
//         });

//         await tx.doctor.update({
//             where: {
//                 id: deletedReview.doctorId
//             },
//             data: {
//                 averageRating: averageRating._avg.rating as number
//             }
//         })
//         return deletedReview;
//     });

//     return result;
// }


export const ReviewService = {
    giveReview,
    // getAllReviews,
    // myReviews,
    // updateReview,
    // deleteReview
}