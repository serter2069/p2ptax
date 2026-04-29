import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";

const router = Router();
router.use(authMiddleware);

// GET /api/saved-specialists — list saved specialist IDs for current user
router.get("/", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const saved = await prisma.savedSpecialist.findMany({
      where: { userId },
      select: { specialistId: true, savedAt: true },
      orderBy: { savedAt: "desc" },
    });
    res.json({ ids: saved.map((s) => s.specialistId), items: saved });
  } catch (err) {
    console.error("[saved-specialists] GET /", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/saved-specialists/full — full specialist data for saved items
router.get("/full", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const saved = await prisma.savedSpecialist.findMany({
      where: {
        userId,
        // Hide soft-deleted specialists from the saved list (their PII has
        // been anonymized — surfacing them would be confusing).
        specialist: { deletedAt: null },
      },
      orderBy: { savedAt: "desc" },
      include: {
        specialist: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            createdAt: true,
            specialistProfile: { select: { description: true } },
            specialistServices: {
              select: { service: { select: { id: true, name: true } } },
              distinct: ["serviceId"],
            },
            specialistFns: {
              select: { fns: { select: { city: { select: { id: true, name: true } } } } },
            },
          },
        },
      },
    });

    const items = saved.map((s) => ({
      id: s.specialist.id,
      firstName: s.specialist.firstName,
      lastName: s.specialist.lastName,
      avatarUrl: s.specialist.avatarUrl,
      createdAt: s.specialist.createdAt.toISOString(),
      description: s.specialist.specialistProfile?.description ?? null,
      services: s.specialist.specialistServices.map((ss) => ss.service),
      cities: Array.from(
        new Map(
          s.specialist.specialistFns
            .map((sf) => sf.fns.city)
            .filter(Boolean)
            .map((c) => [c!.id, c!])
        ).values()
      ),
    }));

    res.json({ items });
  } catch (err) {
    console.error("[saved-specialists] GET /full", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

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
