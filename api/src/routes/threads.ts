import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.use(authMiddleware);

// GET /api/threads/rate-limit — today's write count for specialist
router.get("/rate-limit", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const count = await prisma.thread.count({
      where: {
        specialistId: userId,
        createdAt: { gte: todayStart },
      },
    });

    res.json({ writesToday: count, limit: 20 });
  } catch (error) {
    console.error("threads rate-limit error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/threads — threads for current user (specialist or client)
router.get("/", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const isSpecialist = user.role === "SPECIALIST";

    const requestIdFilter = req.query.request_id as string | undefined;

    const threads = await prisma.thread.findMany({
      where: {
        ...(isSpecialist
          ? { specialistId: userId }
          : { clientId: userId }),
        ...(requestIdFilter ? { requestId: requestIdFilter } : {}),
      },
      orderBy: { lastMessageAt: { sort: "desc", nulls: "last" } },
      include: {
        request: {
          select: { id: true, title: true, status: true },
        },
        client: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
        specialist: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { text: true, createdAt: true, senderId: true },
        },
      },
    });

    const mapped = threads.map((t) => {
      const lastReadAt = isSpecialist
        ? t.specialistLastReadAt
        : t.clientLastReadAt;
      const otherUser = isSpecialist ? t.client : t.specialist;
      const lastMessage = t.messages[0] || null;

      // Count unread: messages from other party after lastReadAt
      let unreadCount = 0;
      if (lastMessage && lastMessage.senderId !== userId) {
        if (!lastReadAt || lastMessage.createdAt > lastReadAt) {
          unreadCount = 1; // Simplified — we'll enrich with actual count below
        }
      }

      return {
        id: t.id,
        request: t.request,
        otherUser: {
          id: otherUser.id,
          firstName: otherUser.firstName,
          lastName: otherUser.lastName,
          avatarUrl: otherUser.avatarUrl,
        },
        lastMessage: lastMessage
          ? {
              text: lastMessage.text,
              createdAt: lastMessage.createdAt,
            }
          : null,
        unreadCount,
        createdAt: t.createdAt,
      };
    });

    // Enrich with actual unread counts
    for (const item of mapped) {
      const thread = threads.find((t) => t.id === item.id)!;
      const lastReadAt = isSpecialist
        ? thread.specialistLastReadAt
        : thread.clientLastReadAt;

      item.unreadCount = await prisma.message.count({
        where: {
          threadId: item.id,
          senderId: { not: userId },
          ...(lastReadAt ? { createdAt: { gt: lastReadAt } } : {}),
        },
      });
    }

    res.json({ items: mapped });
  } catch (error) {
    console.error("threads list error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/threads — create thread with first message (specialist only)
router.post("/", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { requestId, firstMessage } = req.body;

    if (!requestId || !firstMessage) {
      res.status(400).json({ error: "requestId and firstMessage are required" });
      return;
    }

    if (firstMessage.length < 10 || firstMessage.length > 1000) {
      res.status(400).json({ error: "Message must be 10-1000 characters" });
      return;
    }

    // Verify user is specialist
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user || user.role !== "SPECIALIST") {
      res.status(403).json({ error: "Only specialists can create threads" });
      return;
    }

    // Verify request exists and is not closed
    const request = await prisma.request.findUnique({
      where: { id: requestId },
      select: { id: true, status: true, userId: true },
    });

    if (!request) {
      res.status(404).json({ error: "Request not found" });
      return;
    }

    if (request.status === "CLOSED") {
      res.status(409).json({ error: "Заявка закрыта" });
      return;
    }

    // Check if thread already exists
    const existing = await prisma.thread.findUnique({
      where: {
        requestId_specialistId: {
          requestId,
          specialistId: userId,
        },
      },
    });

    if (existing) {
      res.status(409).json({
        error: "Thread already exists",
        threadId: existing.id,
      });
      return;
    }

    // Rate limit: 20 threads per day for specialist
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayThreads = await prisma.thread.count({
      where: {
        specialistId: userId,
        createdAt: { gte: todayStart },
      },
    });

    if (todayThreads >= 20) {
      res.status(429).json({ error: "Лимит 20 сообщений в день" });
      return;
    }

    // Create thread + first message in transaction
    const now = new Date();
    const thread = await prisma.thread.create({
      data: {
        requestId,
        clientId: request.userId,
        specialistId: userId,
        lastMessageAt: now,
        specialistLastReadAt: now,
        messages: {
          create: {
            senderId: userId,
            text: firstMessage,
          },
        },
      },
      include: {
        request: { select: { id: true, title: true, status: true } },
      },
    });

    // Update request lastActivityAt
    await prisma.request.update({
      where: { id: requestId },
      data: { lastActivityAt: now },
    });

    res.status(201).json({
      id: thread.id,
      request: thread.request,
    });
  } catch (error) {
    console.error("threads create error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
