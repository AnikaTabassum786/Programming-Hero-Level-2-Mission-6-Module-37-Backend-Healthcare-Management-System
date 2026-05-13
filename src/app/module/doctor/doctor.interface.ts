import { Gender } from "../../../generated/prisma/enums";

export interface IUpdateDoctorPayload{
    name?: string;
    profilePhoto?:string;
    contactNumber?:string;
    address?:string;
    gender?:Gender
    experience?:string;
    designation?:string
}






// export interface IUpdateDoctorSpecialtyPayload {
//     specialtyId: string;
//     shouldDelete?: boolean;
// }
// export interface IUpdateDoctorPayload {
//     doctor?: {
//         name?: string;
//         profilePhoto?: string;
//         contactNumber?: string;
//         address?: string;
//         experience?: number
//         registrationNumber?: string;
//         appointmentFee?: number;
//         qualification?: string;
//         currentWorkingPlace?: string;
//         designation?: string;
//     },
//     specialties?: IUpdateDoctorSpecialtyPayload[];
// }