import { Router } from "express";
import { DoctorController } from "./doctor.controller";
import { checkAuth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";

const router = Router();

router.get("/", checkAuth(Role.ADMIN,Role.SUPER_ADMIN), DoctorController.getAllDoctors)
router.get("/:doctorId",checkAuth(Role.ADMIN,Role.SUPER_ADMIN),DoctorController.getDoctorById)
router.delete("/:doctorId",checkAuth(Role.ADMIN,Role.SUPER_ADMIN),DoctorController.deleteDoctor)
router.patch("/:doctorId",checkAuth(Role.ADMIN,Role.SUPER_ADMIN),DoctorController.updateDoctor)

export const DoctorRoute = router;