import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";
import { roleGuard } from "../middleware/auth";

const router = Router();

// All admin routes require auth + ADMIN role
router.use(authMiddleware);
router.use(roleGuard("ADMIN"));

// GET /api/admin/stats
router.get("/stats", async (_req: Request, res: Response) => {
  try {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Active requests count
    const activeRequests = await prisma.request.count({
      where: { status: { in: ["ACTIVE", "CLOSING_SOON"] } },
    });

    // New users week/month
    const newUsersWeek = await prisma.user.count({
      where: { createdAt: { gte: weekAgo } },
    });
    const newUsersMonth = await prisma.user.count({
      where: { createdAt: { gte: monthAgo } },
    });

    // Threads (dialogs) week/month
    const threadsWeek = await prisma.thread.count({
      where: { createdAt: { gte: weekAgo } },
    });
    const threadsMonth = await prisma.thread.count({
      where: { createdAt: { gte: monthAgo } },
    });

    // Conversion: requests with at least one thread / total requests
    const totalRequests = await prisma.request.count();
    const requestsWithThreads = await prisma.request.count({
      where: { threads: { some: {} } },
    });
    const conversion =
      totalRequests > 0
        ? Math.round((requestsWithThreads / totalRequests) * 100)
        : 0;

    // Top 5 cities by active requests
    const topCities = await prisma.request.groupBy({
      by: ["cityId"],
      where: { status: { in: ["ACTIVE", "CLOSING_SOON"] } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    });

    const cityIds = topCities.map((c) => c.cityId);
    const cities = await prisma.city.findMany({
      where: { id: { in: cityIds } },
      select: { id: true, name: true },
    });
    const cityMap = new Map(cities.map((c) => [c.id, c.name]));

    const topCitiesResult = topCities.map((c) => ({
      name: cityMap.get(c.cityId) || "Unknown",
      count: c._count.id,
    }));

    // Top 5 specialists by thread count
    const topSpecialists = await prisma.thread.groupBy({
      by: ["specialistId"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    });

    const specIds = topSpecialists.map((s) => s.specialistId);
    const specs = await prisma.user.findMany({
      where: { id: { in: specIds } },
      select: { id: true, firstName: true, lastName: true, email: true },
    });
    const specMap = new Map(specs.map((s) => [s.id, s]));

    const topSpecialistsResult = topSpecialists.map((s) => {
      const spec = specMap.get(s.specialistId);
      const name = spec
        ? [spec.firstName, spec.lastName].filter(Boolean).join(" ") ||
          spec.email
        : "Unknown";
      return { name, count: s._count.id };
    });

    res.json({
      activeRequests,
      newUsersWeek,
      newUsersMonth,
      threadsWeek,
      threadsMonth,
      conversion,
      topCities: topCitiesResult,
      topSpecialists: topSpecialistsResult,
    });
  } catch (error) {
    console.error("admin/stats error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/admin/users
router.get("/users", async (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string) || "";
    const role = req.query.role as string | undefined;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (q) {
      where.OR = [
        { email: { contains: q, mode: "insensitive" } },
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
      ];
    }

    if (role === "CLIENT" || role === "SPECIALIST" || role === "ADMIN") {
      where.role = role;
    } else if (role === "BANNED") {
      where.isBanned = true;
    }

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isBanned: true,
          createdAt: true,
          avatarUrl: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      items,
      total,
      page,
      limit,
      hasMore: skip + items.length < total,
    });
  } catch (error) {
    console.error("admin/users error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/admin/users/:id
router.patch("/users/:id", async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { isBanned, firstName, lastName, role } = req.body;

    const data: Record<string, unknown> = {};
    if (typeof isBanned === "boolean") data.isBanned = isBanned;
    if (typeof firstName === "string") data.firstName = firstName;
    if (typeof lastName === "string") data.lastName = lastName;
    if (role === "CLIENT" || role === "SPECIALIST" || role === "ADMIN") {
      data.role = role;
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isBanned: true,
        createdAt: true,
        avatarUrl: true,
      },
    });

    res.json(user);
  } catch (error) {
    console.error("admin/users/:id patch error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/admin/users/:id/close-all-requests
router.post(
  "/users/:id/close-all-requests",
  async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;

      const result = await prisma.request.updateMany({
        where: {
          userId: id,
          status: { in: ["ACTIVE", "CLOSING_SOON"] },
        },
        data: { status: "CLOSED" },
      });

      res.json({ closed: result.count });
    } catch (error) {
      console.error("admin/users/:id/close-all-requests error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /api/admin/moderation/queue
router.get("/moderation/queue", async (_req: Request, res: Response) => {
  // MVP: always return empty array
  res.json({ items: [] });
});

// GET /api/admin/settings
router.get("/settings", async (_req: Request, res: Response) => {
  try {
    const settings = await prisma.setting.findMany();
    const result: Record<string, string> = {};
    for (const s of settings) {
      result[s.key] = s.value;
    }
    res.json(result);
  } catch (error) {
    console.error("admin/settings error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/admin/settings
router.patch("/settings", async (req: Request, res: Response) => {
  try {
    const updates = req.body as Record<string, string>;

    for (const [key, value] of Object.entries(updates)) {
      await prisma.setting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      });
    }

    // Return updated settings
    const settings = await prisma.setting.findMany();
    const result: Record<string, string> = {};
    for (const s of settings) {
      result[s.key] = s.value;
    }
    res.json(result);
  } catch (error) {
    console.error("admin/settings patch error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
