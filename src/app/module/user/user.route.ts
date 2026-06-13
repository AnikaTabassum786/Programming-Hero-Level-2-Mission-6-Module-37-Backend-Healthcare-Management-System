import { Router } from "express";
import { UserController } from "./user.controller";

import { validateRequest } from "../../middleware/validateRequest";
import { crateDoctorZodSchema } from "./user.validation";
import { checkAuth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";

const router = Router();

router.post("/create-doctor",validateRequest(crateDoctorZodSchema),UserController.createDoctor)
router.post("/create-admin", checkAuth(Role.SUPER_ADMIN,Role.ADMIN),UserController.createAdmin)

export const UserRoute = router;