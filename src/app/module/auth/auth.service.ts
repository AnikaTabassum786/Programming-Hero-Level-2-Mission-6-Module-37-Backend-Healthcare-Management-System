
import { auth } from "../../lib/auth";


interface IRegisterPatientPayload{
    name:string;
    email:string;
    password:string;
}

const registerPatient = async(payload:IRegisterPatientPayload)=>{
    const {name,email,password} = payload;

    const data = await auth.api.signUpEmail({
        body:{
            name,
            email,
            password,
            //default values
            // needPasswordChange:false,
            // role:Role.PATIENT
        }
    })

    if(!data.user){
        throw new Error("Failed to registered patient")
    }

    //TODO: Create Patient Profile in transaction after sign up of patient in user model

    // const patient = await prisma.$transaction(async(tx)=>{

    // })

    return data
}

export const AuthService={
    registerPatient
}