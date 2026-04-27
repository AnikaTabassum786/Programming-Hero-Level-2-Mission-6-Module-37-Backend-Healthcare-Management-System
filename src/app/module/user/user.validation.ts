
import z from "zod"
import { Gender } from "../../../generated/prisma/enums"


export const crateDoctorZodSchema = z.object({
    password: z.string("Password is required").min(6, "Password must be 8 character").max(20, "Password must be at most 20 character"),

    doctor: z.object({
        name: z.string("Name is required").min(5, "Name must be at least 5 character").max(30, "Name must be at most 30 character"),

        email: z.email("Invalid email address"),

        contactNumber: z.string("Contact number is required").min(11, "Contact number must be at least 11 character").max(14, "Contact number must be at most 14 character"),

        address: z.string("Address is required").min(3, "Address must be at least 3 character").optional(),

        registrationNumber: z.string("Registration Number is required"),

        experience: z.int("Experience must be an integer").nonnegative("Experience can not be negative").optional(),

        gender: z.enum([Gender.MALE, Gender.FEMALE]),

        appointmentFee: z.number("Appointment fee must be a number").nonnegative("Appointment fee can not be negative"),

        qualification: z.string("Qualification is required").min(2, "Qualification must be at least 2 characters").max(50, "Qualification must be at most 50 characters"),

        currentWorkingPlace: z.string("Current Working place must be required").min(2, "Current working place must be at least 2 character").max(50, "Current working place must be at most 50 character"),

        designation: z.string("Designation must be required").min(2, "Designation must be at least 2 character").max(50, "Designation must be at most 50 character")
    }),

    specialties:z.array(z.uuid(),"Specialties must be an array of strings").min(1,"at least 2 Specialty is required")
})