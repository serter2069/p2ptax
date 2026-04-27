import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";

const router = Router();

// GET /api/dashboard/stats — client dashboard stats
router.get("/stats", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    // Get request limit from settings (default 5)
    const limitSetting = await prisma.setting.findUnique({
      where: { key: "requests_limit" },
    });
    const requestsLimit = limitSetting ? parseInt(limitSetting.value, 10) : 5;

    // Count user's active requests
    const requestsUsed = await prisma.request.count({
      where: {
        userId,
        status: { in: ["ACTIVE", "CLOSING_SOON"] },
      },
    });

    // Count unread messages across all threads where user is client
    const threads = await prisma.thread.findMany({
      where: { clientId: userId },
      select: {
        id: true,
        clientLastReadAt: true,
        _count: {
          select: { messages: true },
        },
      },
    });

    // Count unread messages across all threads where user is client — batch
    const threadsWithRead = threads.filter(t => t.clientLastReadAt !== null);
    const threadsWithoutRead = threads.filter(t => t.clientLastReadAt === null);

    const readCounts = await Promise.all(
      threadsWithRead.map(t =>
        prisma.message.count({
          where: {
            threadId: t.id,
            createdAt: { gt: t.clientLastReadAt! },
            senderId: { not: userId },
          },
        })
      )
    );

    let unreadMessages = readCounts.reduce((s, c) => s + c, 0);

    if (threadsWithoutRead.length > 0) {
      unreadMessages += await prisma.message.count({
        where: {
          threadId: { in: threadsWithoutRead.map(t => t.id) },
          senderId: { not: userId },
        },
      });
    }

    res.json({
      requestsUsed,
      requestsLimit,
      unreadMessages,
    });
  } catch (error) {
    console.error("dashboard/stats error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
