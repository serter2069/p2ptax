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

    let unreadMessages = 0;
    for (const thread of threads) {
      if (thread.clientLastReadAt) {
        const unread = await prisma.message.count({
          where: {
            threadId: thread.id,
            createdAt: { gt: thread.clientLastReadAt },
            senderId: { not: userId },
          },
        });
        unreadMessages += unread;
      } else {
        // Never read — count all messages from others
        const unread = await prisma.message.count({
          where: {
            threadId: thread.id,
            senderId: { not: userId },
          },
        });
        unreadMessages += unread;
      }
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
