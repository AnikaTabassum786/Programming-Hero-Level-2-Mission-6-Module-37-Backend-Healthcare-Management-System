import { Doctor } from "../../../generated/prisma/client"
import { prisma } from "../../lib/prisma"


const getAllDoctors = async()=>{
    const doctors = await prisma.doctor.findMany({
      include:{
        user:true,
        specialties:{
            include:{
                specialty:true
            }
        }
      }
    })
    return doctors
}

const getDoctorById = async(doctorId:string)=>{
  const doctor = await prisma.doctor.findUnique({
    where:{
      id:doctorId
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

const updateDoctor = async(doctorId:string,payload: Partial<Doctor>)=>{
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

export const DoctorService={
   getAllDoctors,
   getDoctorById,
   deleteDoctor,
   updateDoctor
}