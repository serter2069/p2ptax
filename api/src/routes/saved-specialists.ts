import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";

const router = Router();
router.use(authMiddleware);

// POST /api/saved-specialists/:specialistId — save specialist
router.post("/:specialistId", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const specialistId = String(req.params.specialistId);

    // Verify target is a specialist (and not soft-deleted)
    const target = await prisma.user.findUnique({
      where: { id: specialistId },
      select: { isSpecialist: true, deletedAt: true },
    });
    if (!target || target.deletedAt) {
      res.status(404).json({ error: "Specialist not found" });
      return;
    }
    if (!target.isSpecialist) {
      res.status(400).json({ error: "User is not a specialist" });
      return;
    }
    if (userId === specialistId) {
      res.status(400).json({ error: "Cannot save yourself" });
      return;
    }

    await prisma.savedSpecialist.upsert({
      where: { userId_specialistId: { userId, specialistId } },
      create: { userId, specialistId },
      update: {},
    });

    res.json({ saved: true });
  } catch (err) {
    console.error("[saved-specialists] POST /:specialistId", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/saved-specialists/:specialistId — unsave specialist
router.delete("/:specialistId", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const specialistId = String(req.params.specialistId);

    await prisma.savedSpecialist.deleteMany({
      where: { userId, specialistId },
    });

    res.json({ saved: false });
  } catch (err) {
    console.error("[saved-specialists] DELETE /:specialistId", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
