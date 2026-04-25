import { Router } from "express";
import { SpecialtyRoutes } from "../module/specialty/specialty.route";
import { AuthRoutes } from "../module/auth/auth.route";
import { UserRoute } from "../module/user/user.route";

const router = Router();

router.use('/auth',AuthRoutes)
router.use('/specialties',SpecialtyRoutes)
router.use('/doctors',UserRoute)

export const IndexRoutes = router;

