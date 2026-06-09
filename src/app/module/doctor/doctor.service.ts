
import { prisma } from "../../lib/prisma"

import { Doctor, Prisma } from "../../../generated/prisma/client"
import { QueryBuilder } from "../../utils/QueryBuilder"
import { doctorFilterableFields, doctorSearchableFields } from "./doctor.constant"
import { IQueryParams } from "../../interfaces/query.interface"


const getAllDoctors = async(query : IQueryParams)=>{
    // const doctors = await prisma.doctor.findMany({
    //   include:{
    //     user:true,
    //     specialties:{
    //         include:{
    //             specialty:true
    //         }
    //     }
    //   }
    // })
    // return doctors

    
    const queryBuilder = new QueryBuilder<Doctor, Prisma.DoctorWhereInput, Prisma.DoctorInclude>(
        prisma.doctor,
        query,
        {
            searchableFields: doctorSearchableFields,
            filterableFields: doctorFilterableFields,
        }
    )
}

const getDoctorById = async(doctorId:string)=>{
  const doctor = await prisma.doctor.findUnique({
    where:{
      id:doctorId,
      isDeleted:false,
    },
     include: {
            user: true,
            specialties: {
                include: {
                    specialty: true
                }
            },
            appointments: {
                include: {
                    patient: true,
                    schedule: true,
                    prescription: true,
                }
            },
            doctorSchedules: {
                include: {
                    schedule: true,
                }
            },
            reviews: true
        }
  })

  return doctor
}

const deleteDoctor= async(doctorId:string)=>{
  const doctor = await prisma.doctor.delete({
    where:{
      id:doctorId
    }
  })

  return doctor
}

const updateDoctor = async(doctorId:string,payload:  Partial<Prisma.DoctorUpdateInput>)=>{
  const existingDoctor = await prisma.doctor.findFirst({
    where:{
      id:doctorId,
      isDeleted:false,
    }
  })

  if (!existingDoctor){
    throw new Error("Doctor not found")
  }

  const result = await prisma.doctor.update({
    where:{
      id:doctorId
    },
    data:payload
  })

  return result
}



// const updateDoctor = async (doctorId: string, payload: IUpdateDoctorPayload) => {
//     const isDoctorExist = await prisma.doctor.findUnique({
//         where: {
//             id:doctorId,
//         }
//     })

//     if (!isDoctorExist) {
//         throw new AppError(status.NOT_FOUND, "Doctor not found");
//     }

//     const { doctor: doctorData, specialties } = payload;

//     await prisma.$transaction(async (tx) => {
//         if (doctorData) {
//             await tx.doctor.update({
//                 where: {
//                     id:doctorId,
//                 },
//                 data: {
//                     ...doctorData,
//                 }
//             })
//         }

//         if (specialties && specialties.length > 0) {
//             for (const specialty of specialties) {
//                 const { specialtyId, shouldDelete } = specialty;
//                 if (shouldDelete) {
//                     await tx.doctorSpecialty.delete({
//                         where: {
//                             doctorId_specialtyId: {
//                                 doctorId: doctorId,
//                                 specialtyId,
//                             }
//                         }
//                     })
//                 } else {
//                     await tx.doctorSpecialty.upsert({
//                         where: {
//                             doctorId_specialtyId: {
//                                 doctorId: doctorId,
//                                 specialtyId,
//                             }
//                         },
//                         create: {
//                             doctorId: doctorId,
//                             specialtyId,
//                         },
//                         update: {}
//                     })
//                 }
//             }
//         }
//     })

//     const doctor = await getDoctorById(doctorId);

//     return doctor;
// }

export const DoctorService={
   getAllDoctors,
   getDoctorById,
   deleteDoctor,
   updateDoctor
}