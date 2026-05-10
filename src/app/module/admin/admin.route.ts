import { Router } from "express";
import { AdminController } from "./admin.controller";
import { checkAuth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";


const router = Router();
router.get("/",checkAuth(Role.ADMIN,Role.SUPER_ADMIN), AdminController.getAllAdmin)
router.get("/:id",checkAuth(Role.ADMIN,Role.SUPER_ADMIN),AdminController.getAdminById)
router.patch("/:id",checkAuth(Role.SUPER_ADMIN),AdminController.updateAdmin)
// router.delete("/:id",checkAuth(Role.SUPER_ADMIN),AdminController.deleteAdmin)

export const AdminRoute = router;