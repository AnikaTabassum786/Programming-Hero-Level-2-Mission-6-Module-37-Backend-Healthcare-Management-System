/* eslint-disable @typescript-eslint/no-explicit-any */
import express,{ Application,Request, Response } from "express";
import { prisma } from "./app/lib/prisma";
import { IndexRoutes } from "./app/routes";

import { globalErrorHandler } from "./app/middleware/globalErrorHandler";
import { notFound } from "./app/middleware/notFound";
import cookieParser from "cookie-parser";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./app/lib/auth";
import path from "path";
import cors from "cors"
import { envVars } from "./config/env";
import qs from "qs";
import { PaymentController } from "./app/module/payment/payment.controller";
import { AppointmentService } from "./app/module/appointment/appointment.service";
import cron from "node-cron";

const app:Application = express()
app.set("query parse",(str:string)=>qs.parse(str))

app.set("view engine","ejs")
app.set("views",path.resolve(process.cwd(),`src/app/templates`))

app.post("/webhook", express.raw({ type: "application/json" }),  PaymentController.handleStripeWebhookEvent)

app.use(cors({
  origin:[envVars.FRONTEND_URL,envVars.BETTER_AUTH_URL,"http://localhost:5000","http://localhost:3000"],
  credentials:true,
  methods:["GET","POST","DELETE","PATCH"],
  allowedHeaders:["content-Type","Authorization"]
}))




// Enable URL-encoded form data parsing
app.use(express.urlencoded({ extended: true }));

// Middleware to parse JSON bodies
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({extended:true}))

cron.schedule("*/25 * * * *", async () => {
    try {
        console.log("Running cron job to cancel unpaid appointments...");
        await AppointmentService.cancelUnpaidAppointments();
    } catch (error : any) {
        console.error("Error occurred while canceling unpaid appointments:", error.message);    
    }
})

app.use("/api/v1",IndexRoutes)

app.use("/api/auth",toNodeHandler(auth))

// Basic route
app.get('/', async (req: Request, res: Response) => {
  // const specialty = await prisma.specialty.create({
  //   data:{
  //     title:'Cardiology'
  //   }
  // })

  res.status(201).json({
    success:true,
    message:'API is working',
    // data: specialty
  })
});


app.use(globalErrorHandler)
app.use(notFound)

export default app