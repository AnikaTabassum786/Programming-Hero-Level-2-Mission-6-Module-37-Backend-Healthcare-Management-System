/* eslint-disable no-useless-assignment */
import { v7 as uuidv7 } from "uuid";
import { IRequestUser } from "../../interfaces/requestUser.interface";
import { prisma } from "../../lib/prisma";
import { IBookAppointmentPayload } from "./appointment.interface";
import { envVars } from "../../../config/env";
import { AppointmentStatus, PaymentStatus, Role } from "../../../generated/prisma/enums";
import AppError from "../../errorHelpers/AppError";
import status from "http-status";

import { stripe } from "../../../config/stripe.config";


// Pay Now Book Appointment
const bookAppointment = async (payload: IBookAppointmentPayload, user: IRequestUser) => {

    //Find the patient. Email is available from JWT Token.
    const patientData = await prisma.patient.findUniqueOrThrow({
        where: {
            email: user.email,
        }
    });

    //Check whether there is a doctor.
    const doctorData = await prisma.doctor.findUniqueOrThrow({
        where: {
            id: payload.doctorId,
            isDeleted: false,
        }
    });

    //Check if the schedule is in the database.
    const scheduleData = await prisma.schedule.findUniqueOrThrow({
        where: {
            id: payload.scheduleId,
        }
    });

    const doctorSchedule = await prisma.doctorSchedules.findUniqueOrThrow({
        where: {
            doctorId_scheduleId: {
                doctorId: doctorData.id,
                scheduleId: scheduleData.id,
            }
        }
    });

    //A unique ID will be created.
    const videoCallingId = String(uuidv7());

    const result = await prisma.$transaction(async (tx) => {

        // A new row will be created in the Appointment Table.
        const appointmentData = await tx.appointment.create({
            data: {
                doctorId: payload.doctorId,
                patientId: patientData.id,
                scheduleId: doctorSchedule.scheduleId,
                videoCallingId,
            }
        });

        await tx.doctorSchedules.update({
            where: {
                doctorId_scheduleId: {
                    doctorId: payload.doctorId,
                    scheduleId: payload.scheduleId,
                }
            },
            data: {
                isBooked: true, // Appointment is booked by patient. now another patient can not book this schedule
            }
        });

        //TODO : Payment Integration will be here

        const transactionId = String(uuidv7()); //Unique transaction ID for payment.

        //A record is created in the Payment table.
        const paymentData = await tx.payment.create({
            data: {
                appointmentId: appointmentData.id,
                amount: doctorData.appointmentFee,
                transactionId
            }
        });

        //Here Stripe is creating a payment page.
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            line_items: [
                {
                    price_data: {
                        currency: "bdt",
                        product_data: {
                            name: `Appointment with Dr. ${doctorData.name}`,
                        },
                        unit_amount: doctorData.appointmentFee * 100, //Stripe takes the amount in paisa/cents.
                    },
                    quantity: 1,
                }
            ],


            //Sending extra data with Stripe. This data will be used later in the webhook.
            metadata: {
                appointmentId: appointmentData.id,
                paymentId: paymentData.id,
            },

            success_url: `${envVars.FRONTEND_URL}/dashboard/payment/payment-success`, //If the payment is successful, the user will be redirected here.

            // cancel_url: `${envVars.FRONTEND_URL}/dashboard/payment/payment-failed`, //If the user cancels the payment, it will go here.
            cancel_url: `${envVars.FRONTEND_URL}/dashboard/appointments`,
        })

        return {
            appointmentData,
            paymentData,
            paymentUrl: session.url, //Stripe provides a payment link.
        };
    });

    return {
        //This data will be sent to the frontend.
        appointment: result.appointmentData,
        payment: result.paymentData,
        paymentUrl: result.paymentUrl,
    };
}

const getMyAppointments = async (user: IRequestUser) => {
    //user can be patient or doctor, so we need to check both
    const patientData = await prisma.patient.findUnique({
        where: {
            email: user?.email
        }
    });

    const doctorData = await prisma.doctor.findUnique({
        where: {
            email: user?.email
        }
    });

    let appointments = [];

    if (patientData) {
        appointments = await prisma.appointment.findMany({
            where: {
                patientId: patientData.id
            },
            include: {
                doctor: true,
                schedule: true
            }
        });
    } else if (doctorData) {
        appointments = await prisma.appointment.findMany({
            where: {
                doctorId: doctorData.id
            },
            include: {
                patient: true,
                schedule: true
            }
        });
    } else {
        throw new Error("User not found");
    }

    return appointments;

}

// 1. Completed Or Cancelled Appointments should not be allowed to update status
// 2. Doctors can only update Appoinment status from schedule to inprogress or inprogress to complted or schedule to cancelled.
// 3. Patients can only cancel the scheduled appointment if it scheduled not completed or cancelled or inprogress. 
// 4. Admin and Super admin can update to any status.

const changeAppointmentStatus = async (appointmentId: string, appointmentStatus: AppointmentStatus, user: IRequestUser) => {
    const appointmentData = await prisma.appointment.findUniqueOrThrow({
        where: {
            id: appointmentId,
            // status: AppointmentStatus.SCHEDULED
        },
        include: {
            doctor: true
        }
    });

    // if (!appointmentData) {
    //     throw new AppError(status.NOT_FOUND, "Appointment not found or already completed/cancelled");
    // }

    if (user?.role === Role.DOCTOR) {
        if (!(user?.email === appointmentData.doctor.email))
            throw new AppError(status.BAD_REQUEST, "This is not your appointment")
    }

    return await prisma.appointment.update({
        where: {
            id: appointmentId
        },
        data: {
            status: appointmentStatus
        }
    })

}

// refactoring on include of doctor and patient data in appointment details, we can use query builder to get the data in single query instead of multiple queries in case of doctor and patient both
const getMySingleAppointment = async (appointmentId: string, user: IRequestUser) => {

    const patientData = await prisma.patient.findUnique({
        where: {
            email: user?.email
        }
    });

    const doctorData = await prisma.doctor.findUnique({
        where: {
            email: user?.email
        }
    });

    let appointment;

    if (patientData) {
        appointment = await prisma.appointment.findFirst({
            where: {
                id: appointmentId,
                patientId: patientData.id
            },
            include: {
                doctor: true,
                schedule: true
            }
        });
    } else if (doctorData) {
        appointment = await prisma.appointment.findFirst({
            where: {
                id: appointmentId,
                doctorId: doctorData.id
            },
            include: {
                patient: true,
                schedule: true
            }
        });
    }

    if (!appointment) {
        throw new AppError(status.NOT_FOUND, "Appointment not found");
    }

    return appointment;
}

// integrate query builder
const getAllAppointments = async () => {
    const appointments = await prisma.appointment.findMany({
        include: {
            doctor: true,
            patient: true,
            schedule: true
        }
    });
    return appointments;
}

const bookAppointmentWithPayLater = async (payload: IBookAppointmentPayload, user: IRequestUser) => {

    //Extracting patient from JWT Token.
    const patientData = await prisma.patient.findUniqueOrThrow({
        where: {
            email: user.email,
        }
    });


    //The doctor I want to make an appointment with:Is he in the database?Is he not deleted?
    const doctorData = await prisma.doctor.findUniqueOrThrow({
        where: {
            id: payload.doctorId,
            isDeleted: false,
        }
    });

    //Checking whether the time slot (schedule) chosen by the user is available.
    const scheduleData = await prisma.schedule.findUniqueOrThrow({
        where: {
            id: payload.scheduleId,
        }
    });


    //Is this doctor available on this schedule?Checking if the relationship is OK
    const doctorSchedule = await prisma.doctorSchedules.findUniqueOrThrow({
        where: {
            doctorId_scheduleId: {
                doctorId: doctorData.id,
                scheduleId: scheduleData.id,
            }
        }
    });

    //A unique ID is created for each appointment.Video consultation room,meeting link reference
    const videoCallingId = String(uuidv7());


    // 3 tasks will be done together:

    //appointment create
    //schedule booked update
    //payment record create

    const result = await prisma.$transaction(async (tx) => {
        const appointmentData = await tx.appointment.create({
            data: {
                doctorId: payload.doctorId,
                patientId: patientData.id,
                scheduleId: doctorSchedule.scheduleId,
                videoCallingId,
            }
        });

        await tx.doctorSchedules.update({
            where: {
                doctorId_scheduleId: {
                    doctorId: payload.doctorId,
                    scheduleId: payload.scheduleId,
                }
            },
            data: {
                isBooked: true, //No one else can book this time slot.
            }
        });

        const transactionId = String(uuidv7());

        //Here only payment record is being created
        //Money is not  taken
        //Stripe call is not  made
        // “pending payment record” is  kept

        const paymentData = await tx.payment.create({
            data: {
                appointmentId: appointmentData.id,
                amount: doctorData.appointmentFee,
                transactionId,
            }
        });

        return {
            appointment: appointmentData,
            payment: paymentData
        };

    });

    return result;
}

const initiatePayment = async (appointmentId: string, user: IRequestUser) => {
    const patientData = await prisma.patient.findUniqueOrThrow({
        where: {
            email: user.email,
        }
    });

    const appointmentData = await prisma.appointment.findUniqueOrThrow({
        where: {
            id: appointmentId,
            patientId: patientData.id,
        },
        include: {
            doctor: true,
            payment: true,
        }
    });

    if (!appointmentData) {
        throw new AppError(status.NOT_FOUND, "Appointment not found");
    }

    if (!appointmentData.payment) {
        throw new AppError(status.NOT_FOUND, "Payment data not found for this appointment");
    }

    if (appointmentData.payment?.status === PaymentStatus.PAID) {
        throw new AppError(status.BAD_REQUEST, "Payment already completed for this appointment");
    };

    if (appointmentData.status === AppointmentStatus.CANCELED) {
        throw new AppError(status.BAD_REQUEST, "Appointment is canceled");
    }

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: 'payment',
        line_items: [
            {
                price_data: {
                    currency: "bdt",
                    product_data: {
                        name: `Appointment with Dr. ${appointmentData.doctor.name}`,
                    },
                    unit_amount: appointmentData.doctor.appointmentFee * 100,
                },
                quantity: 1,
            }
        ],
        metadata: {
            appointmentId: appointmentData.id,
            paymentId: appointmentData.payment.id,
        },

        success_url: `${envVars.FRONTEND_URL}/dashboard/payment/payment-success?appointment_id=${appointmentData.id}&payment_id=${appointmentData.payment.id}`,

        // cancel_url: `${envVars.FRONTEND_URL}/dashboard/payment/payment-failed`,
        cancel_url: `${envVars.FRONTEND_URL}/dashboard/appointments?error=payment_cancelled`,
    })

    return {
        paymentUrl: session.url,
    }
}

const cancelUnpaidAppointments = async () => {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    const unpaidAppointments = await prisma.appointment.findMany({
        where: {
            // status: AppointmentStatus.SCHEDULED,
            createdAt: {
                lte: thirtyMinutesAgo,
            },
            paymentStatus: PaymentStatus.UNPAID,
        },
    });

    const appointmentToCancel = unpaidAppointments.map(appointment => appointment.id);

    await prisma.$transaction(async (tx) => {

        await tx.appointment.updateMany({
            where: {
                id: {
                    in: appointmentToCancel,
                },
            },
            data: {
                status: AppointmentStatus.CANCELED,
            },
        });

        await tx.payment.deleteMany({
            where: {
                appointmentId: {
                    in: appointmentToCancel,
                },
            },
        });

        for (const unpaidAppointment of unpaidAppointments) {
            await tx.doctorSchedules.update({
                where: {
                    doctorId_scheduleId: {
                        doctorId: unpaidAppointment.doctorId,
                        scheduleId: unpaidAppointment.scheduleId,
                    },
                },
                data: {
                    isBooked: false,
                },
            });
        }
    });
}



export const AppointmentService = {
    bookAppointment,
    getMyAppointments,
    changeAppointmentStatus,
    getMySingleAppointment,
    getAllAppointments,
    bookAppointmentWithPayLater,
    initiatePayment,
    cancelUnpaidAppointments,
}