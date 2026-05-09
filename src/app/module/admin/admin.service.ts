import { prisma } from "../../lib/prisma"

const getAllAdmin =async()=>{
    const result = await prisma.admin.findMany({
        include:{
            user:true
        }
    })

    return result
}

export const AdminService={
    getAllAdmin
}