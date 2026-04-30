import { Router, Request, Response } from "express";
import { Prisma } from "@prisma/client";
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
//
// Optional query params (filter the result set):
//   ?cityId=...     — only specialists working at FNS in this city
//   ?fnsId=...      — only specialists tied to this FNS office
//   ?serviceId=...  — only specialists who provide this service
router.get("/full", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const cityId = typeof req.query.cityId === "string" ? req.query.cityId : "";
    const fnsId = typeof req.query.fnsId === "string" ? req.query.fnsId : "";
    const serviceId =
      typeof req.query.serviceId === "string" ? req.query.serviceId : "";

    // Build the specialist-side filter so we can compose city / FNS / service.
    const specialistFilter: Prisma.UserWhereInput = { deletedAt: null };

    if (fnsId) {
      specialistFilter.specialistFns = { some: { fnsId } };
    } else if (cityId) {
      specialistFilter.specialistFns = { some: { fns: { cityId } } };
    }

    if (serviceId) {
      specialistFilter.specialistServices = { some: { serviceId } };
    }

    const saved = await prisma.savedSpecialist.findMany({
      where: {
        userId,
        // Hide soft-deleted specialists from the saved list (their PII has
        // been anonymized — surfacing them would be confusing) and apply the
        // optional city / FNS / service filters from the query string.
        specialist: specialistFilter,
      },
      orderBy: { savedAt: "desc" },
      include: {
        specialist: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            isAvailable: true,
            createdAt: true,
            specialistProfile: {
              select: {
                description: true,
                yearsOfExperience: true,
                exFnsStartYear: true,
              },
            },
            specialistServices: {
              select: { service: { select: { id: true, name: true } } },
              distinct: ["serviceId"],
            },
            specialistFns: {
              select: {
                id: true,
                fnsId: true,
                fns: {
                  select: {
                    id: true,
                    name: true,
                    city: { select: { id: true, name: true } },
                  },
                },
                services: {
                  select: {
                    service: { select: { id: true, name: true } },
                  },
                },
              },
            },
            _count: {
              select: {
                specialistCases: true,
                specialistReviews: true,
              },
            },
          },
        },
      },
    });

    const items = saved.map((s) => {
      const sp = s.specialist;

      // Deduplicate cities (a specialist may be linked to multiple FNS in
      // the same city) keeping insertion order for stable rendering.
      const cities = Array.from(
        new Map(
          sp.specialistFns
            .map((sf) => sf.fns?.city)
            .filter((c): c is { id: string; name: string } => Boolean(c))
            .map((c) => [c.id, c])
        ).values()
      );

      // FNS list with the office name (used in the filter chips + cards).
      const fnsNames = Array.from(
        new Map(
          sp.specialistFns
            .filter((sf) => Boolean(sf.fns))
            .map((sf) => [
              sf.fns!.id,
              { id: sf.id, fnsId: sf.fns!.id, fnsName: sf.fns!.name },
            ])
        ).values()
      );

      // Cascade: FNS groups with services per group (matches /api/specialists shape
      // so the same `SpecialistsGrid` component can render both lists).
      const specialistFns = sp.specialistFns
        .filter((sf) => Boolean(sf.fns))
        .map((sf) => ({
          fnsId: sf.fns!.id,
          fnsName: sf.fns!.name,
          city: sf.fns!.city,
          services: sf.services.map((sv) => sv.service),
        }));

      return {
        id: sp.id,
        firstName: sp.firstName,
        lastName: sp.lastName,
        avatarUrl: sp.avatarUrl,
        isAvailable: sp.isAvailable,
        createdAt: sp.createdAt.toISOString(),
        cities,
        fnsNames,
        services: sp.specialistServices.map((ss) => ss.service),
        specialistFns,
        description: sp.specialistProfile?.description ?? null,
        profile: {
          description: sp.specialistProfile?.description ?? null,
          yearsOfExperience: sp.specialistProfile?.yearsOfExperience ?? null,
          exFnsStartYear: sp.specialistProfile?.exFnsStartYear ?? null,
        },
        casesCount: sp._count.specialistCases,
        reviewsCount: sp._count.specialistReviews,
      };
    });

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
