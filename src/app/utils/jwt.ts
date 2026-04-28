/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import jwt,{JwtPayload, SignOptions} from "jsonwebtoken";




const createToken = (payload: JwtPayload,secret:string,{expiresIn}: SignOptions)=>{
const token = jwt.sign(payload,secret,{expiresIn})
return token
}

const verifyToken = (token:string,secret:string)=>{
   try{
        const decode = jwt.verify(token,secret) as JwtPayload;
        return{
            success:true,
            data:decode
        }
   }
   catch(error:any){
    return{
        success:false,
        message:error.message,
        error
    }
   }
}

const decodeToken = (token:string)=>{
    const decoded = jwt.decode(token) as JwtPayload
    return decoded;
}

export const jwtUtils = {
    createToken,
    verifyToken,
    decodeToken
}