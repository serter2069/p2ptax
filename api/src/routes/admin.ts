import { Router } from "express";
import { authMiddleware, roleGuard } from "../middleware/auth";
import statsRouter from "./admin/stats";
import usersRouter from "./admin/users";
import contentRouter from "./admin/content";
import consultantRouter from "./admin/consultant";

const router = Router();

// All admin routes require auth + ADMIN role
router.use(authMiddleware);
router.use(roleGuard("ADMIN"));

router.use("/stats", statsRouter);
router.use("/users", usersRouter);
router.use("/consultant", consultantRouter);
router.use("/", contentRouter);

export default router;
