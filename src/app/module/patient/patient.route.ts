

import { Router } from "express";
import { checkAuth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import { multerUpload } from "../../../config/multer.config";
import { updateMyPatientProfileMiddleware } from "./patient.middlewares";
import { validateRequest } from "../../middleware/validateRequest";
import { PatientValidation } from "./patient.validation";
import { PatientController } from "./patient.controller";

const router = Router();

router.patch("/update-my-profile",
    checkAuth(Role.PATIENT),

    //You can upload a picture.A maximum of 5 reports can be uploaded.
    multerUpload.fields([
        { name : "profilePhoto", maxCount : 1},
        { name : "medicalReports", maxCount : 5}
    ]),

    updateMyPatientProfileMiddleware,
    validateRequest(PatientValidation.updatePatientProfileZodSchema),
    PatientController.updateMyProfile
)

export const PatientRoutes = router;