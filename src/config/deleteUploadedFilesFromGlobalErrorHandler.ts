/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request } from "express";
import { deleteFileFromCloudinary } from "../config/cloudinary.config";

//If an error occurs, delete all files uploaded to Cloudinary during the request.

export const deleteUploadedFilesFromGlobalErrorHandler = async (req: Request) => {
    try {

        //Store all the file URLs that need to be deleted.
        const filesToDelete : string[] = [];

        //When a single file is uploaded (like a profile picture),its path is being retrieved and pushed into the array.

        if(req.file && req.file?.path){ 
            filesToDelete.push(req.file.path);
        }
        
        //If multiple files are received as an object.  This happens when 'multer.fields()' used.
        else if(req.files && typeof req.files === 'object' && !Array.isArray(req.files)){
            // [ [{path : "rfrf"}] , [{}, {}]]
            Object.values(req.files).forEach(fileArray =>{
                if(Array.isArray(fileArray)){   //Extract each file. If a path exists, add it to the array.
                    fileArray.forEach(file => {
                        if(file.path){
                            filesToDelete.push(file.path);
                        }
                    })
                }
            })
        }else if(req.files && Array.isArray(req.files) && req.files.length > 0){  //It comes from multer.array().
            req.files.forEach(file => {
                if(file.path){
                    filesToDelete.push(file.path);
                }
            })
        }

        if(filesToDelete.length > 0){

            //All files will be deleted in parallel.
            await Promise.all(
                filesToDelete.map(url => deleteFileFromCloudinary(url))
            )
            console.log(`\nDeleted ${filesToDelete.length} uploaded file(s) from Cloudinary due to an error during request processing.\n`);
        }
        
    } catch (error : any) {
        console.error("Error deleting uploaded files from Global Error Handler", error);
        
    }
}