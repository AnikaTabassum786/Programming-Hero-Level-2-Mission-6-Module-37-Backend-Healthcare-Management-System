import status from "http-status"
import AppError from "../../errorHelpers/AppError"
import { prisma } from "../../lib/prisma"
import { IUpdateAdminPayload } from "./admin.interface"

const getAllAdmin = async () => {
    const result = await prisma.admin.findMany({
        include: {
            user: true
        }
    })

    return result
}

const getAdminById = async (id: string) => {
    const result = await prisma.admin.findUnique({
        where: {
            id,
        },
        include: {
            user: true
        }
    })

    return result
}
//TODO: Validate who is updating the admin user. Only super admin can update admin user and only super admin can update super admin user but admin user cannot update super admin user
const updateAdmin = async (id: string, payload: IUpdateAdminPayload) => {
    const isAdminExist = await prisma.admin.findUnique({
        where: {
            id,
        }
    })

    if (!isAdminExist) {
        throw new AppError(status.NOT_FOUND, "Admin or super Not found")
    }

    const { admin } = payload;

    const result = await prisma.admin.update({
        where: {
            id,
        },
        data: {
            ...admin
        }
    })

    return result
}

export const AdminService = {
    getAllAdmin,
    getAdminById,
    updateAdmin
}