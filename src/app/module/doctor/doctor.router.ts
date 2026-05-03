import { Router } from "express";
import { DoctorController } from "./doctor.controller";

const router = Router();

router.get("/", DoctorController.getAllDoctors)
router.get("/:doctorId",DoctorController.getDoctorById)

export const DoctorRoute = router;