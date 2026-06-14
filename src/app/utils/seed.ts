

import { envVars } from "../../config/env";
import { Role } from "../../generated/prisma/enums";
import { auth } from "../lib/auth";
import { prisma } from "../lib/prisma";

//The job of this seedSuperAdmin function is to create a Super Admin account when the application is launched, 
// if there is no Super Admin already.

export const seedSuperAdmin = async () => {
    try {
        const isSuperAdminExist = await prisma.user.findFirst({ //Check if super admin already exists
            where:{
                role : Role.SUPER_ADMIN
            }
        })

        //If Super Admin is available, 
        //Then the function will end here.
        // Because there is no need to create the same Super Admin again and again.

        if(isSuperAdminExist) {
            console.log("Super admin already exists. Skipping seeding super admin.");
            return;
        }

        //Creating a User with Better Auth
        const superAdminUser = await auth.api.signUpEmail({
            body:{
                email : envVars.SUPER_ADMIN_EMAIL,
                password : envVars.SUPER_ADMIN_PASSWORD,
                name : "Super Admin",
                role : Role.SUPER_ADMIN,
                needPasswordChange : false,
                rememberMe : false,
            }
        })

        await prisma.$transaction(async (tx) => {
            await tx.user.update({
                where : {
                    id : superAdminUser.user.id
                },
                data : {
                    emailVerified : true,
                }
            });

            //Creating a Record in the Admin Table
            await tx.admin.create({
                data : {
                    userId : superAdminUser.user.id,
                    name : "Super Admin",
                    email : envVars.SUPER_ADMIN_EMAIL,
                }
            })

            
            
        });

        //Here, Super Admin data and its User data are being brought together.
        const superAdmin = await prisma.admin.findFirst({
            where : {
                email : envVars.SUPER_ADMIN_EMAIL,
            },
            include : {
                user : true,
            }
        })

        console.log("Super Admin Created ", superAdmin);
    } catch (error) {
        console.error("Error seeding super admin: ", error);
        await prisma.user.delete({
            where : {
                email : envVars.SUPER_ADMIN_EMAIL,
            }
        })
    }
}