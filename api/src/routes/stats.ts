import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware, roleGuard } from "../middleware/auth";

const router = Router();

/**
 * GET /api/stats/recent-wins
 * Public. Returns the most recent resolved SpecialistCase entries, flattened
 * with specialist + city + ifns context. Consumed by landing page and admin
 * dashboard.
 */
router.get("/recent-wins", async (req: Request, res: Response) => {
  try {
    const limitRaw = Number.parseInt(String(req.query.limit ?? "5"), 10);
    const limit = Number.isFinite(limitRaw)
      ? Math.max(1, Math.min(20, limitRaw))
      : 5;

    const cases = await prisma.specialistCase.findMany({
      where: { status: "resolved" },
      orderBy: [{ year: "desc" }, { createdAt: "desc" }],
      take: limit,
      include: {
        specialist: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            specialistFns: {
              select: {
                fns: {
                  select: {
                    name: true,
                    city: { select: { name: true } },
                  },
                },
              },
              take: 1,
            },
          },
        },
      },
    });

    const items = cases.map((c) => {
      const sp = c.specialist;
      const name =
        [sp.firstName, sp.lastName].filter(Boolean).join(" ") ||
        sp.email.split("@")[0];
      const firstFns = sp.specialistFns[0]?.fns;
      return {
        id: c.id,
        specialistName: name,
        amount: c.amount,
        savedAmount: c.resolvedAmount,
        days: c.days,
        ifnsLabel: firstFns?.name ?? null,
        city: firstFns?.city?.name ?? null,
        category: c.category,
        date: c.year ? String(c.year) : null,
      };
    });

    res.json({ items });
  } catch (error) {
    console.error("stats/recent-wins error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/stats/landing-counts
 * Public. Platform totals + resolved cases count + starting-from price.
 */
router.get("/landing-counts", async (_req: Request, res: Response) => {
  try {
    const [specialistsCount, citiesCount, consultationsCount, resolvedCases] =
      await Promise.all([
        prisma.user.count({ where: { role: "SPECIALIST", isBanned: false } }),
        prisma.city.count(),
        prisma.thread.count(),
        prisma.specialistCase.count({ where: { status: "resolved" } }),
      ]);

    res.json({
      specialistsCount,
      citiesCount,
      consultationsCount,
      resolvedCases,
      priceFrom: 0, // first question free
    });
  } catch (error) {
    console.error("stats/landing-counts error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/stats/client-dashboard
 * Auth. Client-only dashboard stats — aggregates requests, threads, responses.
 */
router.get(
  "/client-dashboard",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId;

      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const [activeRequests, userThreads, requests] = await Promise.all([
        prisma.request.count({
          where: {
            userId,
            status: { in: ["ACTIVE", "CLOSING_SOON"] },
          },
        }),
        prisma.thread.findMany({
          where: { clientId: userId },
          select: {
            id: true,
            specialistId: true,
            lastMessageAt: true,
            clientLastReadAt: true,
            createdAt: true,
          },
        }),
        prisma.request.findMany({
          where: { userId },
          select: { id: true, createdAt: true },
        }),
      ]);

      // Responses in last 24h (new threads created on any of user's requests)
      const requestIds = requests.map((r) => r.id);
      const responsesToday =
        requestIds.length > 0
          ? await prisma.thread.count({
              where: {
                requestId: { in: requestIds },
                createdAt: { gte: dayAgo },
              },
            })
          : 0;

      const specialistIds = new Set(userThreads.map((t) => t.specialistId));

      // Awaiting specialist reply — threads where last message is from client
      let awaitingReplies = 0;
      for (const t of userThreads) {
        const last = await prisma.message.findFirst({
          where: { threadId: t.id },
          orderBy: { createdAt: "desc" },
          select: { senderId: true },
        });
        if (last && last.senderId === userId) awaitingReplies += 1;
      }

      // Recent activity in last week for "trend"
      const trendNewResponses = specialistIds.size > 0 ? 0 : 0;

      res.json({
        activeRequests,
        responsesToday,
        awaitingReplies,
        specialistsWorkingWithYou: specialistIds.size,
        weeklyNewRequests: requests.filter((r) => r.createdAt >= weekAgo).length,
      });
    } catch (error) {
      console.error("stats/client-dashboard error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * GET /api/stats/specialist-dashboard
 * Auth. Specialist-only stats.
 */
router.get(
  "/specialist-dashboard",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId;

      const now = new Date();
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const [activeThreads, threads, resolvedCasesThisMonth] = await Promise.all([
        prisma.thread.count({
          where: {
            specialistId: userId,
            request: { status: { in: ["ACTIVE", "CLOSING_SOON"] } },
          },
        }),
        prisma.thread.findMany({
          where: { specialistId: userId },
          select: {
            id: true,
            specialistLastReadAt: true,
          },
        }),
        prisma.specialistCase.findMany({
          where: {
            specialistId: userId,
            status: "resolved",
            createdAt: { gte: monthAgo },
          },
          select: { resolvedAmount: true },
        }),
      ]);

      // Awaiting-your-reply — threads where last message is not from specialist
      let awaitingMyReply = 0;
      for (const t of threads) {
        const last = await prisma.message.findFirst({
          where: { threadId: t.id },
          orderBy: { createdAt: "desc" },
          select: { senderId: true },
        });
        if (last && last.senderId !== userId) awaitingMyReply += 1;
      }

      // New requests in specialist's regions (last 7 days)
      const specialistFns = await prisma.specialistFns.findMany({
        where: { specialistId: userId },
        select: { fnsId: true },
      });
      const fnsIds = specialistFns.map((f) => f.fnsId);

      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const newRequestsWeek =
        fnsIds.length > 0
          ? await prisma.request.count({
              where: {
                fnsId: { in: fnsIds },
                status: "ACTIVE",
                createdAt: { gte: weekAgo },
              },
            })
          : 0;

      const disputedAmountMonth = resolvedCasesThisMonth.reduce(
        (sum, c) => sum + (c.resolvedAmount ?? 0),
        0
      );

      res.json({
        newRequestsWeek,
        awaitingMyReply,
        activeThreads,
        disputedAmountMonth,
      });
    } catch (error) {
      console.error("stats/specialist-dashboard error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * GET /api/stats/admin-dashboard
 * Auth + ADMIN role. Platform-wide stats.
 */
router.get(
  "/admin-dashboard",
  authMiddleware,
  roleGuard("ADMIN"),
  async (_req: Request, res: Response) => {
    try {
      const now = new Date();
      const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const [
        activeRequests,
        openComplaints,
        onlineSpecialists,
        totalClients,
        totalSpecialists,
        newUsersWeek,
        pendingVerifications,
        threadsMonth,
        threadsWeek,
        resolvedCases,
      ] = await Promise.all([
        prisma.request.count({
          where: { status: { in: ["ACTIVE", "CLOSING_SOON"] } },
        }),
        prisma.complaint.count({ where: { status: "NEW" } }),
        prisma.user.count({
          where: { role: "SPECIALIST", isAvailable: true, isBanned: false },
        }),
        prisma.user.count({ where: { role: "CLIENT" } }),
        prisma.user.count({ where: { role: "SPECIALIST" } }),
        prisma.user.count({
          where: { createdAt: { gte: weekAgo } },
        }),
        prisma.user.count({
          where: {
            role: "SPECIALIST",
            isAvailable: false,
            isBanned: false,
            specialistProfile: { is: { description: null } },
          },
        }),
        prisma.thread.count({
          where: {
            createdAt: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
          },
        }),
        prisma.thread.count({
          where: { createdAt: { gte: weekAgo } },
        }),
        prisma.specialistCase.count({
          where: { status: "resolved" },
        }),
      ]);

      // Satisfaction = % of reviews with rating>=4 (if any reviews)
      const totalReviews = await prisma.specialistReview.count();
      const positiveReviews = await prisma.specialistReview.count({
        where: { rating: { gte: 4 } },
      });
      const satisfaction =
        totalReviews > 0
          ? Math.round((positiveReviews / totalReviews) * 100)
          : 0;

      // SLA response time (h) — rough: average time between request creation
      // and first thread creation for requests with threads.
      const requestsWithThreads = await prisma.request.findMany({
        where: { threads: { some: {} }, createdAt: { gte: weekAgo } },
        select: {
          createdAt: true,
          threads: {
            orderBy: { createdAt: "asc" },
            take: 1,
            select: { createdAt: true },
          },
        },
      });

      let slaSum = 0;
      let slaCount = 0;
      for (const r of requestsWithThreads) {
        const first = r.threads[0];
        if (!first) continue;
        const diffH =
          (first.createdAt.getTime() - r.createdAt.getTime()) / 1000 / 60 / 60;
        if (diffH >= 0) {
          slaSum += diffH;
          slaCount += 1;
        }
      }
      const slaResponseHours = slaCount > 0 ? +(slaSum / slaCount).toFixed(1) : 0;

      const newMessagesDay = await prisma.message.count({
        where: { createdAt: { gte: dayAgo } },
      });

      res.json({
        activeRequests,
        openComplaints,
        satisfaction,
        onlineSpecialists,
        totalClients,
        totalSpecialists,
        newUsersWeek,
        pendingVerifications,
        threadsMonth,
        threadsWeek,
        resolvedCases,
        slaResponseHours,
        newMessagesDay,
      });
    } catch (error) {
      console.error("stats/admin-dashboard error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
