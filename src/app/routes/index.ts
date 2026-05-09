import { Router } from "express";
import { SpecialtyRoutes } from "../module/specialty/specialty.route";
import { AuthRoutes } from "../module/auth/auth.route";
import { UserRoute } from "../module/user/user.route";
import { DoctorRoute } from "../module/doctor/doctor.router";
import { AdminRoute } from "../module/admin/admin.route";

const router = Router();

router.use('/auth',AuthRoutes)
router.use('/specialties',SpecialtyRoutes)
router.use('/users',UserRoute)
router.use('/doctors',DoctorRoute)
router.use('/admins',AdminRoute)

export const IndexRoutes = router;

