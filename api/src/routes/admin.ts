import { Router } from "express";
import { authMiddleware, roleGuard } from "../middleware/auth";
import statsRouter from "./admin/stats";
import usersRouter from "./admin/users";
import contentRouter from "./admin/content";

const router = Router();

// All admin routes require auth + ADMIN role
router.use(authMiddleware);
router.use(roleGuard("ADMIN"));

router.use("/stats", statsRouter);
router.use("/users", usersRouter);
router.use("/", contentRouter);

export default router;
