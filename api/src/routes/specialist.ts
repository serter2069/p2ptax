import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware, roleGuard } from "../middleware/auth";

const router = Router();

// All routes require auth + SPECIALIST role
router.use(authMiddleware, roleGuard("SPECIALIST"));

// GET /api/specialist/stats
router.get("/stats", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const threads = await prisma.thread.findMany({
      where: { specialistId: userId },
      select: {
        id: true,
        specialistLastReadAt: true,
      },
    });

    let newMessages = 0;
    for (const thread of threads) {
      const unread = await prisma.message.count({
        where: {
          threadId: thread.id,
          senderId: { not: userId },
          ...(thread.specialistLastReadAt
            ? { createdAt: { gt: thread.specialistLastReadAt } }
            : {}),
        },
      });
      newMessages += unread;
    }

    res.json({ threadsTotal: threads.length, newMessages });
  } catch (error) {
    console.error("specialist/stats error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/specialist/requests — matching requests for this specialist
router.get("/requests", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    // Get specialist's FNS ids and city ids
    const specialistFns = await prisma.specialistFns.findMany({
      where: { specialistId: userId },
      select: {
        fnsId: true,
        fns: { select: { cityId: true } },
      },
    });

    const fnsIds = specialistFns.map((sf) => sf.fnsId);
    const cityIds = [...new Set(specialistFns.map((sf) => sf.fns.cityId))];

    // Get existing threads for this specialist
    const existingThreads = await prisma.thread.findMany({
      where: { specialistId: userId },
      select: { requestId: true, id: true },
    });

    const threadByRequest = new Map(
      existingThreads.map((t) => [t.requestId, t.id])
    );

    // Get active requests (not closed), ordered by newest
    const requests = await prisma.request.findMany({
      where: {
        status: { not: "CLOSED" },
      },
      orderBy: { createdAt: "desc" },
      include: {
        city: true,
        fns: true,
        _count: { select: { threads: true } },
      },
    });

    const mapped = requests.map((r) => {
      const isMyFns = fnsIds.includes(r.fnsId);
      const isMyCity = cityIds.includes(r.cityId);
      const existingThreadId = threadByRequest.get(r.id) || null;

      return {
        id: r.id,
        title: r.title,
        description: r.description,
        status: r.status,
        createdAt: r.createdAt,
        city: { id: r.city.id, name: r.city.name },
        fns: { id: r.fns.id, name: r.fns.name, code: r.fns.code },
        threadsCount: r._count.threads,
        isMyRegion: isMyCity && isMyFns,
        existingThreadId,
      };
    });

    res.json({ items: mapped });
  } catch (error) {
    console.error("specialist/requests error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/specialist/profile — full profile for editing
router.get("/profile", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        specialistProfile: true,
        specialistFns: {
          include: {
            fns: { include: { city: true } },
            services: { include: { service: true } },
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const fnsServices = user.specialistFns.map((sf) => ({
      fns: { id: sf.fns.id, name: sf.fns.name, code: sf.fns.code },
      city: { id: sf.fns.city.id, name: sf.fns.city.name },
      services: sf.services.map((ss) => ({
        id: ss.service.id,
        name: ss.service.name,
      })),
    }));

    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      isAvailable: user.isAvailable,
      profile: user.specialistProfile
        ? {
            description: user.specialistProfile.description,
            phone: user.specialistProfile.phone,
            telegram: user.specialistProfile.telegram,
            whatsapp: user.specialistProfile.whatsapp,
            officeAddress: user.specialistProfile.officeAddress,
            workingHours: user.specialistProfile.workingHours,
          }
        : null,
      fnsServices,
    });
  } catch (error) {
    console.error("specialist/profile error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/specialist/profile — update profile
router.patch("/profile", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const {
      firstName,
      lastName,
      avatarUrl,
      isAvailable,
      description,
      phone,
      telegram,
      whatsapp,
      officeAddress,
      workingHours,
    } = req.body;

    // Update user fields
    const userUpdate: Record<string, unknown> = {};
    if (firstName !== undefined) userUpdate.firstName = firstName;
    if (lastName !== undefined) userUpdate.lastName = lastName;
    if (avatarUrl !== undefined) userUpdate.avatarUrl = avatarUrl;
    if (isAvailable !== undefined) userUpdate.isAvailable = isAvailable;

    if (Object.keys(userUpdate).length > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: userUpdate,
      });
    }

    // Update or create specialist profile
    const profileUpdate: Record<string, unknown> = {};
    if (description !== undefined) profileUpdate.description = description;
    if (phone !== undefined) profileUpdate.phone = phone;
    if (telegram !== undefined) profileUpdate.telegram = telegram;
    if (whatsapp !== undefined) profileUpdate.whatsapp = whatsapp;
    if (officeAddress !== undefined) profileUpdate.officeAddress = officeAddress;
    if (workingHours !== undefined) profileUpdate.workingHours = workingHours;

    if (Object.keys(profileUpdate).length > 0) {
      await prisma.specialistProfile.upsert({
        where: { userId },
        update: profileUpdate,
        create: {
          userId,
          description: profileUpdate.description as string | undefined,
          phone: profileUpdate.phone as string | undefined,
          telegram: profileUpdate.telegram as string | undefined,
          whatsapp: profileUpdate.whatsapp as string | undefined,
          officeAddress: profileUpdate.officeAddress as string | undefined,
          workingHours: profileUpdate.workingHours as string | undefined,
        },
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("specialist/profile update error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
