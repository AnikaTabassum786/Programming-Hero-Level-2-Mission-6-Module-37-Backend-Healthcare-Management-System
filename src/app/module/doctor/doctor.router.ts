import { Router } from "express";
import { DoctorController } from "./doctor.controller";

const router = Router();

router.get("/", DoctorController.getAllDoctors)
router.get("/:doctorId",DoctorController.getDoctorById)
router.delete("/:doctorId",DoctorController.deleteDoctor)
router.patch("/:doctorId",DoctorController.updateDoctor)

export const DoctorRoute = router;