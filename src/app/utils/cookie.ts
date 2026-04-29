
import { Request, Response,CookieOptions } from "express";


const setCookie =(res:Response,key:string,values:string,options:CookieOptions)=>{
  res.cookie(key,values,options)
}

const getCookie=(req:Request,key:string)=>{
    return req.cookies[key]
}

const clearCookie =(res:Response,key:string,options:CookieOptions)=>{
    res.clearCookie(key,options)
}


export const CookieUtils = {
    setCookie,
    getCookie,
    clearCookie,
}

