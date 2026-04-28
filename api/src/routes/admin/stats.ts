import { Router, Request, Response } from "express";
import { prisma } from "../../lib/prisma";

const router = Router();

// GET /api/admin/stats
router.get("/", async (_req: Request, res: Response) => {
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

    // Top cities by active requests
    const topCities = await prisma.request.groupBy({
      by: ["cityId"],
      where: { status: { in: ["ACTIVE", "CLOSING_SOON"] } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 50,
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

export default router;
