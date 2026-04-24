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

    // Guard: role can only be set once (during onboarding)
    const existing = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { role: true },
    });
    if (existing?.role !== null && existing?.role !== undefined) {
      res.status(400).json({ error: "Role already set" });
      return;
    }

    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        role: "SPECIALIST",
      },
      select: {
        id: true,
        email: true,
        role: true,
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

    // Verify user is specialist
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user || user.role !== "SPECIALIST") {
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

    // Verify user is specialist
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user || user.role !== "SPECIALIST") {
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

    // Update avatar on user if provided
    if (avatarUrl !== undefined) {
      await prisma.user.update({
        where: { id: userId },
        data: { avatarUrl: avatarUrl || null, isAvailable: true },
      });
    } else {
      await prisma.user.update({
        where: { id: userId },
        data: { isAvailable: true },
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("onboarding/profile error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
