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

// PATCH /api/user/specialist-mode — enable or disable specialist mode
router.patch("/specialist-mode", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { isSpecialist } = req.body;

    if (typeof isSpecialist !== "boolean") {
      res.status(400).json({ error: "isSpecialist must be a boolean" });
      return;
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { isSpecialist },
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
    console.error("user/specialist-mode error:", error);
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


// POST /api/user/become-specialist — progressive specialist activation.
//
// Iter11 PR 3 — allows an existing USER account to flip `isSpecialist=true`
// without going through the full onboarding flow. Required payload covers
// the minimal specialist profile fields (phone + description) plus the
// domain metadata (cities, fns, services). On success we:
//   - flip `isSpecialist = true` on the user
//   - set `specialistProfileCompletedAt = now()` (gates canWriteThreads + catalog)
//   - upsert the profile row with contacts/workingHours/officeAddress
//   - replace the user's specialist-services matrix with the new selection
// No re-verification; the user stays signed in with the same token.
router.post("/become-specialist", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const {
      cities,
      fns,
      services,
      bio,
      phone,
      telegram,
      whatsapp,
      officeAddress,
      workingHours,
    } = req.body ?? {};

    // Basic required-field validation. FNS + services drive the catalog;
    // `cities` is accepted for client-side UX but not persisted (every FNS
    // row already belongs to a city via its foreign key).
    void cities;
    if (!Array.isArray(fns) || fns.length === 0) {
      res.status(400).json({ error: "fns required" });
      return;
    }
    if (!Array.isArray(services) || services.length === 0) {
      res.status(400).json({ error: "services required" });
      return;
    }

    // Normalise services input — accept either a flat `[{fnsId, serviceIds}]`
    // matrix (preferred) or a mapping-like shape from the UI. Fall back to
    // deriving fns+services by intersecting the two parallel arrays.
    type Matrix = { fnsId: string; serviceIds: string[] }[];
    let matrix: Matrix = [];
    if (Array.isArray(services) && services.every((x) => x && typeof x === "object" && "fnsId" in x && "serviceIds" in x)) {
      matrix = (services as Matrix).filter((m) => typeof m.fnsId === "string" && Array.isArray(m.serviceIds));
    } else {
      // Simple intersection: every selected FNS gets every selected service.
      const fnsIds = (fns as unknown[]).filter((v): v is string => typeof v === "string");
      const serviceIds = (services as unknown[]).filter((v): v is string => typeof v === "string");
      if (fnsIds.length === 0 || serviceIds.length === 0) {
        res.status(400).json({ error: "fns and services must be non-empty arrays" });
        return;
      }
      matrix = fnsIds.map((fnsId) => ({ fnsId, serviceIds }));
    }
    if (matrix.length === 0) {
      res.status(400).json({ error: "services matrix is empty" });
      return;
    }

    const now = new Date();

    // Transaction: all-or-nothing so we never leave a half-flipped user.
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          isSpecialist: true,
          specialistProfileCompletedAt: now,
          isAvailable: true,
        },
      });

      await tx.specialistProfile.upsert({
        where: { userId },
        create: {
          userId,
          description: typeof bio === "string" ? bio : null,
          phone: typeof phone === "string" ? phone : null,
          telegram: typeof telegram === "string" ? telegram : null,
          whatsapp: typeof whatsapp === "string" ? whatsapp : null,
          officeAddress: typeof officeAddress === "string" ? officeAddress : null,
          workingHours: typeof workingHours === "string" ? workingHours : null,
        },
        update: {
          description: typeof bio === "string" ? bio : undefined,
          phone: typeof phone === "string" ? phone : undefined,
          telegram: typeof telegram === "string" ? telegram : undefined,
          whatsapp: typeof whatsapp === "string" ? whatsapp : undefined,
          officeAddress: typeof officeAddress === "string" ? officeAddress : undefined,
          workingHours: typeof workingHours === "string" ? workingHours : undefined,
        },
      });

      // Replace existing specialist-services + specialist-fns rows.
      await tx.specialistService.deleteMany({ where: { specialistId: userId } });
      await tx.specialistFns.deleteMany({ where: { specialistId: userId } });

      for (const entry of matrix) {
        if (!entry.serviceIds || entry.serviceIds.length === 0) continue;
        const specialistFns = await tx.specialistFns.create({
          data: { specialistId: userId, fnsId: entry.fnsId },
        });
        for (const serviceId of entry.serviceIds) {
          await tx.specialistService.create({
            data: {
              specialistId: userId,
              fnsId: entry.fnsId,
              serviceId,
              specialistFnsId: specialistFns.id,
            },
          });
        }
      }
    });

    const updated = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        isSpecialist: true,
        specialistProfileCompletedAt: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        isAvailable: true,
      },
    });

    res.json({ user: updated });
  } catch (error) {
    console.error("user/become-specialist error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/user/leave-specialist — disable specialist mode
router.post("/leave-specialist", authMiddleware, async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  try {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { isSpecialist: false, isAvailable: false },
      select: { id: true, isSpecialist: true, isAvailable: true },
    });
    res.json({ user: updated });
  } catch (error) {
    console.error("user/leave-specialist error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/user/leave-specialist-toggle — re-enable specialist mode (user already has FNS data)
router.post("/leave-specialist-toggle", authMiddleware, async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  try {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { isSpecialist: true },
      select: { id: true, isSpecialist: true, isAvailable: true },
    });
    res.json({ user: updated });
  } catch (error) {
    console.error("user/leave-specialist-toggle error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
