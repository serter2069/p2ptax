import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";

const router = Router();

// PATCH /api/user/profile — update profile (auth required)
router.patch("/profile", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { firstName, lastName, avatarUrl } = req.body;

    const data: Record<string, unknown> = {};
    if (firstName !== undefined) data.firstName = firstName;
    if (lastName !== undefined) data.lastName = lastName;
    if (avatarUrl !== undefined) data.avatarUrl = avatarUrl;

    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
      },
    });

    res.json({ user });
  } catch (error) {
    console.error("user/profile error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/user/notification-settings — update notification settings
router.patch("/notification-settings", authMiddleware, async (req: Request, res: Response) => {
  try {
    // For now, just acknowledge — notification settings can be stored
    // in a user_settings table later when push notifications are implemented
    res.json({ success: true });
  } catch (error) {
    console.error("user/notification-settings error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
