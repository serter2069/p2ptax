import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";

const router = Router();

/**
 * POST /api/account/delete — soft-delete the authenticated user's account.
 *
 * NEVER hard-deletes the user row. Instead:
 *   - sets `deletedAt = now()`
 *   - anonymizes PII (email, firstName, lastName, avatarUrl)
 *   - flips `isAvailable = false`, `isSpecialist = false`, `isBanned = true`
 *     so the user is hidden from the catalog and cannot sign in even if
 *     their old email is reused by someone else.
 *   - revokes every refresh token (forces sign-out across devices)
 *
 * Threads/messages keep referencing the same user row so other participants
 * still see a valid (anonymous) author. The auth middleware additionally
 * rejects every request from a deleted user (401 Account deleted).
 *
 * Body: `{ confirm: string }` where `confirm` must equal the user's own
 * (current, non-anonymized) email — basic confirmation step. We do not
 * use a password (the project is OTP-only).
 */
router.post("/delete", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { confirm } = req.body ?? {};

    if (typeof confirm !== "string" || confirm.trim().length === 0) {
      res.status(400).json({ error: "confirm is required" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, deletedAt: true },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    if (user.deletedAt) {
      res.status(409).json({ error: "Account already deleted" });
      return;
    }

    if (confirm.trim().toLowerCase() !== user.email.toLowerCase()) {
      res.status(400).json({ error: "confirm must match your current email" });
      return;
    }

    const now = new Date();
    // NOTE: do NOT use prisma.user.delete() — soft-delete only.
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          deletedAt: now,
          email: `deleted-${userId}@p2ptax.local`,
          firstName: null,
          lastName: null,
          avatarUrl: null,
          isAvailable: false,
          isSpecialist: false,
          isBanned: true,
        },
      });

      // Revoke every refresh token so the user is signed out everywhere.
      await tx.refreshToken.deleteMany({ where: { userId } });
    });

    res.status(204).send();
  } catch (error) {
    console.error("account/delete error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
