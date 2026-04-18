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

// PATCH /api/user/email — change email for authenticated user
// Fix #184: atomic update relies on DB unique constraint (P2002) instead of
// a non-atomic check-then-act pattern, eliminating the TOCTOU race.
router.patch("/email", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { email } = req.body;

    if (!email || typeof email !== "string") {
      res.status(400).json({ error: "Email is required" });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Basic format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      res.status(400).json({ error: "Invalid email format" });
      return;
    }

    // Atomic update: DB unique constraint on email handles the race condition.
    // If two users race to claim the same email, the second one gets P2002
    // instead of a 500 from an unguarded constraint violation.
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
      },
    });

    res.json({ user: updatedUser });
  } catch (error: unknown) {
    // P2002 = unique constraint violation — email already taken
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      res.status(409).json({ error: "Email is already in use" });
      return;
    }
    console.error("user/email error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
