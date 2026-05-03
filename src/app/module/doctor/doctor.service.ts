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

export const DoctorService={
   getAllDoctors ,
   getDoctorById
}