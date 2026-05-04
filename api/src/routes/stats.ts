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

    // Fetch a wider pool, then dedupe by specialist so the landing's
    // 3-card row always shows three distinct authors. Without this the
    // top-N can cluster on whichever specialist has the most recent
    // year-tagged cases (one specialist owning all 3 cards reads as a
    // seed artifact even when the data is real).
    const pool = await prisma.specialistCase.findMany({
      where: { status: "resolved" },
      orderBy: [{ year: "desc" }, { createdAt: "desc" }],
      take: Math.max(limit * 6, 30),
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

    const seenSpecialists = new Set<string>();
    const cases: typeof pool = [];
    for (const c of pool) {
      if (seenSpecialists.has(c.specialistId)) continue;
      seenSpecialists.add(c.specialistId);
      cases.push(c);
      if (cases.length >= limit) break;
    }
    // Fallback: if we filtered out too aggressively (very few specialists
    // have cases), top up from the original pool to satisfy the limit.
    if (cases.length < limit) {
      for (const c of pool) {
        if (cases.includes(c)) continue;
        cases.push(c);
        if (cases.length >= limit) break;
      }
    }

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
        // Iter11: specialists counted by flag, not retired role value.
        prisma.user.count({ where: { isSpecialist: true, isBanned: false } }),
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
 * Auth. Client-only dashboard stats — aggregates requests and threads.
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

      // New threads created on any of user's requests in last 24h
      const requestIds = requests.map((r) => r.id);
      const threadsToday =
        requestIds.length > 0
          ? await prisma.thread.count({
              where: {
                requestId: { in: requestIds },
                createdAt: { gte: dayAgo },
              },
            })
          : 0;

      const specialistIds = new Set(userThreads.map((t) => t.specialistId));

      // Awaiting specialist reply — threads where last message is from client.
      // Batch: single groupBy query to find the latest message sender per thread.
      const awaitingReplies = await (async () => {
        if (userThreads.length === 0) return 0;
        // Get latest message per thread using a subquery approach:
        // Find the max createdAt per thread, then join to get senderId.
        // Since Prisma doesn't support window functions directly, use groupBy
        // with _max and then fetch senders — but simpler: just fetch all
        // latest messages in one go using raw-ish approach.
        //
        // Alternative: fetch all messages for these threads, ordered by
        // threadId + createdAt desc, then deduplicate by threadId in JS.
        const latestMessages = await prisma.message.findMany({
          where: { threadId: { in: userThreads.map(t => t.id) } },
          orderBy: { createdAt: "desc" },
          select: { threadId: true, senderId: true },
        });
        // Deduplicate: keep only the first (latest) message per thread
        const seen = new Set<string>();
        let count = 0;
        for (const m of latestMessages) {
          if (seen.has(m.threadId)) continue;
          seen.add(m.threadId);
          if (m.senderId === userId) count++;
        }
        return count;
      })();

      res.json({
        activeRequests,
        threadsToday,
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

      // Awaiting-your-reply — threads where last message is not from specialist.
      // Batch: fetch all latest messages in one query.
      const awaitingMyReply = await (async () => {
        if (threads.length === 0) return 0;
        const latestMessages = await prisma.message.findMany({
          where: { threadId: { in: threads.map(t => t.id) } },
          orderBy: { createdAt: "desc" },
          select: { threadId: true, senderId: true },
        });
        const seen = new Set<string>();
        let count = 0;
        for (const m of latestMessages) {
          if (seen.has(m.threadId)) continue;
          seen.add(m.threadId);
          if (m.senderId !== userId) count++;
        }
        return count;
      })();

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
        // Iter11: specialist counts now driven by isSpecialist flag. Admin
        // dashboard distinguishes "clients" (USER non-specialist) from
        // "specialists" (USER isSpecialist) to keep the familiar two-number
        // breakdown on screen.
        prisma.user.count({
          where: { isSpecialist: true, isAvailable: true, isBanned: false },
        }),
        prisma.user.count({ where: { role: "USER", isSpecialist: false } }),
        prisma.user.count({ where: { isSpecialist: true } }),
        prisma.user.count({
          where: { createdAt: { gte: weekAgo } },
        }),
        prisma.user.count({
          where: {
            isSpecialist: true,
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

      // SLA reply time (h) — rough: average time between request creation
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
      const slaReplyHours = slaCount > 0 ? +(slaSum / slaCount).toFixed(1) : 0;

      const newMessagesDay = await prisma.message.count({
        where: { createdAt: { gte: dayAgo } },
      });

      res.json({
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
        slaReplyHours,
        newMessagesDay,
      });
    } catch (error) {
      console.error("stats/admin-dashboard error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
