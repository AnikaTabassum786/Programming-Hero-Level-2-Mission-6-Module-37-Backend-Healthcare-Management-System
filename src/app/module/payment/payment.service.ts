
import Stripe from "stripe";
import { prisma } from "../../lib/prisma";
import { PaymentStatus } from "../../../generated/prisma/enums";
/* eslint-disable @typescript-eslint/no-explicit-any */

const handlerStripeWebhookEvent = async (event : Stripe.Event) =>{


    //First, it is checked whether the event has been processed before.
    const existingPayment = await prisma.payment.findFirst({
        where:{
            stripeEventId : event.id //Stripe provides a unique event.id for each event.
        }
    })


    //Stripe can sometimes send the same event multiple times.
    //If the same stripeEventId is found in the database, it will not be processed again.
    if(existingPayment){
        console.log(`Event ${event.id} already processed. Skipping`);
        return {message : `Event ${event.id} already processed. Skipping`}
    }

    switch(event.type){
        case "checkout.session.completed" : {
            const session = event.data.object //Stripe checkout session is available.


            //The appointmentId and paymentId saved in the metadata are retrieved when creating a Checkout Session.
            const appointmentId = session.metadata?.appointmentId
            const paymentId = session.metadata?.paymentId


            //If there is no metadata, the process will stop.
            if(!appointmentId || !paymentId){
                console.error("Missing appointmentId or paymentId in session metadata");
                return {message : "Missing appointmentId or paymentId in session metadata"}
            }

            //Checking whether the appointment is in the database.
            const appointment = await prisma.appointment.findUnique({
                where : {
                    id : appointmentId
                }
            })

            if(!appointment){
                console.error(`Appointment with id ${appointmentId} not found`);
                return {message : `Appointment with id ${appointmentId} not found`}
            }

            await prisma.$transaction(async (tx) => {
                await tx.appointment.update({  //Appointment update হবে
                    where : {
                        id : appointmentId
                    },
                    data : {
                        paymentStatus : session.payment_status === "paid" ? PaymentStatus.PAID : PaymentStatus.UNPAID
                    }
                });

                await tx.payment.update({  //Payment update হবে
                    where : {
                        id : paymentId
                    },
                    data : {
                        stripeEventId : event.id, //To detect Duplicate webhook 
                        status : session.payment_status === "paid" ? PaymentStatus.PAID : PaymentStatus.UNPAID, //Save Payment status  
                        paymentGatewayData : session as any, //The entire session object received from Stripe is stored in the database.
                    }
                });
            });

            //If the process is successful, the log will be displayed.
            console.log(`Processed checkout.session.completed for appointment ${appointmentId} and payment ${paymentId}`);
            break;
        }

        //When the user opened the checkout page but did not complete the payment.
        case "checkout.session.expired" : {
                const session = event.data.object

                console.log(`Checkout session ${session.id} expired. Marking associated payment as failed.`);
                break;

        }

        //When the payment attempt fails. For example, Insufficient balance,Card declined,Authentication failed
        case "payment_intent.payment_failed" : {
            const session = event.data.object

            console.log(`Payment intent ${session.id} failed. Marking associated payment as failed.`);
            break;
        }

        //Will log events that were not handled. For example customer.created,charge.refunded,invoice.paid
        default :
            console.log(`Unhandled event type ${event.type}`);
    }

    return {message : `Webhook Event ${event.id} processed successfully`}
}

export const PaymentService = {
    handlerStripeWebhookEvent
}