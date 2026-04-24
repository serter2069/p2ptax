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

// GET /api/specialist/threads-today — how many threads this specialist
// created since midnight (for the 20/day limit progress bar on dashboard).
router.get("/threads-today", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const count = await prisma.thread.count({
      where: {
        specialistId: userId,
        createdAt: { gte: startOfDay },
      },
    });
    res.json({ count, limit: 20 });
  } catch (error) {
    console.error("specialist/threads-today error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Shared handler for GET /api/specialist/requests and /matched alias.
async function matchedRequestsHandler(req: Request, res: Response) {
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

    const requestInclude = {
      city: true,
      fns: true,
      _count: { select: { threads: true } },
    } as const;

    // Fetch my-region requests and all other active requests in parallel,
    // filtering at DB level instead of loading every row into JS memory.
    const [myRequests, otherRequests] = await Promise.all([
      // Requests matching this specialist's FNS offices (isMyRegion = true)
      fnsIds.length > 0
        ? prisma.request.findMany({
            where: {
              status: { not: "CLOSED" },
              fnsId: { in: fnsIds },
              cityId: { in: cityIds },
            },
            orderBy: { createdAt: "desc" },
            include: requestInclude,
          })
        : Promise.resolve([]),
      // All other active requests outside specialist's region
      prisma.request.findMany({
        where: {
          status: { not: "CLOSED" },
          ...(fnsIds.length > 0
            ? {
                NOT: {
                  fnsId: { in: fnsIds },
                  cityId: { in: cityIds },
                },
              }
            : {}),
        },
        orderBy: { createdAt: "desc" },
        include: requestInclude,
      }),
    ]);

    const mapRequest = (r: (typeof myRequests)[number], isMyRegion: boolean) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      status: r.status,
      createdAt: r.createdAt,
      city: { id: r.city.id, name: r.city.name },
      fns: { id: r.fns.id, name: r.fns.name, code: r.fns.code },
      threadsCount: r._count.threads,
      isMyRegion,
      hasThread: threadByRequest.has(r.id),
      existingThreadId: threadByRequest.get(r.id) || null,
    });

    const mapped = [
      ...myRequests.map((r) => mapRequest(r, true)),
      ...otherRequests.map((r) => mapRequest(r, false)),
    ];

    res.json({ items: mapped });
  } catch (error) {
    console.error("specialist/requests error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// GET /api/specialist/requests — matching requests for this specialist
router.get("/requests", matchedRequestsHandler);

// GET /api/specialist/matched — preferred name (alias of /requests)
router.get("/matched", matchedRequestsHandler);

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
