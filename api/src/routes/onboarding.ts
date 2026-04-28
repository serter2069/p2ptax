import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";

const router = Router();

// PUT /api/onboarding/name
router.put("/name", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { firstName, lastName } = req.body;

    if (
      !firstName ||
      typeof firstName !== "string" ||
      firstName.trim().length < 2 ||
      firstName.trim().length > 50
    ) {
      res.status(400).json({ error: "First name must be 2-50 characters" });
      return;
    }

    if (
      !lastName ||
      typeof lastName !== "string" ||
      lastName.trim().length < 2 ||
      lastName.trim().length > 50
    ) {
      res.status(400).json({ error: "Last name must be 2-50 characters" });
      return;
    }

    // Iter11 — /onboarding/name is part of the specialist signup flow.
    // After unification everyone is role=USER; specialist identity is opt-in
    // via isSpecialist=true. Profile completion timestamp is set only once
    // the specialist has filled out their full profile (see /profile route).
    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        role: "CLIENT",
        isSpecialist: true,
      },
      select: {
        id: true,
        email: true,
        role: true,
        isSpecialist: true,
        firstName: true,
        lastName: true,
      },
    });

    res.json({ user });
  } catch (error) {
    console.error("onboarding/name error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/onboarding/work-area
// Accepts two payload shapes for forward/back compat:
//   A) { fnsServices: [{ fnsId, serviceIds: [...] }, ...] }  (legacy/client)
//   B) { cities: [...], fns: [...], specialist_services: [{ fns_id, service_id }, ...] }
//      — new shape used by the CityFnsCascade-based onboarding UI.
router.put("/work-area", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { fnsServices, specialist_services: specialistServicesRaw } = req.body as {
      fnsServices?: { fnsId?: string; serviceIds?: string[] }[];
      cities?: string[];
      fns?: string[];
      specialist_services?: { fns_id?: string; service_id?: string }[];
    };

    // Normalise to the internal shape: Array<{ fnsId, serviceIds }>
    let normalized: { fnsId: string; serviceIds: string[] }[] = [];

    if (Array.isArray(fnsServices) && fnsServices.length > 0) {
      normalized = fnsServices
        .filter((x) => x && typeof x.fnsId === "string")
        .map((x) => ({
          fnsId: x.fnsId as string,
          serviceIds: Array.isArray(x.serviceIds) ? x.serviceIds : [],
        }));
    } else if (Array.isArray(specialistServicesRaw) && specialistServicesRaw.length > 0) {
      const grouped = new Map<string, string[]>();
      for (const item of specialistServicesRaw) {
        if (!item?.fns_id || !item?.service_id) continue;
        const arr = grouped.get(item.fns_id) || [];
        if (!arr.includes(item.service_id)) arr.push(item.service_id);
        grouped.set(item.fns_id, arr);
      }
      normalized = [...grouped.entries()].map(([fnsId, serviceIds]) => ({
        fnsId,
        serviceIds,
      }));
    }

    if (normalized.length === 0) {
      res.status(400).json({
        error: "At least one FNS office with services is required",
      });
      return;
    }

    const userId = req.user!.userId;

    // Verify user has specialist features enabled (Iter11 — flag-based).
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isSpecialist: true },
    });

    if (!user || !user.isSpecialist) {
      res.status(403).json({ error: "Only specialists can set work area" });
      return;
    }

    for (const item of normalized) {
      if (!item.fnsId || item.serviceIds.length === 0) {
        res
          .status(400)
          .json({ error: "Each FNS must have at least one service" });
        return;
      }
    }

    // Clear existing and recreate
    await prisma.$transaction(async (tx) => {
      await tx.specialistService.deleteMany({ where: { specialistId: userId } });
      await tx.specialistFns.deleteMany({ where: { specialistId: userId } });

      for (const item of normalized) {
        const specialistFns = await tx.specialistFns.create({
          data: {
            specialistId: userId,
            fnsId: item.fnsId,
          },
        });

        for (const serviceId of item.serviceIds) {
          await tx.specialistService.create({
            data: {
              specialistId: userId,
              fnsId: item.fnsId,
              serviceId,
              specialistFnsId: specialistFns.id,
            },
          });
        }
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error("onboarding/work-area error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/onboarding/profile
router.put("/profile", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { description, phone, telegram, whatsapp, officeAddress, workingHours, avatarUrl } =
      req.body;

    // Verify user has specialist features enabled (Iter11 — flag-based).
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isSpecialist: true },
    });

    if (!user || !user.isSpecialist) {
      res.status(403).json({ error: "Only specialists can set profile" });
      return;
    }

    // Upsert specialist profile
    await prisma.specialistProfile.upsert({
      where: { userId },
      create: {
        userId,
        description: description || null,
        phone: phone || null,
        telegram: telegram || null,
        whatsapp: whatsapp || null,
        officeAddress: officeAddress || null,
        workingHours: workingHours || null,
      },
      update: {
        description: description || null,
        phone: phone || null,
        telegram: telegram || null,
        whatsapp: whatsapp || null,
        officeAddress: officeAddress || null,
        workingHours: workingHours || null,
      },
    });

    // Iter11: mark profile complete once the specialist finishes onboarding —
    // specialistProfileCompletedAt is the gate for canWriteThreads() + appearing
    // in the catalog. We set it on the first /profile call and never revert it.
    const nowCompletion = new Date();
    const userPatch: Record<string, unknown> = {
      isAvailable: true,
      specialistProfileCompletedAt: nowCompletion,
    };
    if (avatarUrl !== undefined) {
      userPatch.avatarUrl = avatarUrl || null;
    }
    await prisma.user.update({
      where: { id: userId },
      data: userPatch,
    });

    res.json({ success: true });
  } catch (error) {
    console.error("onboarding/profile error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
