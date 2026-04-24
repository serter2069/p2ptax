import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";
import { sendNotification } from "../notifications/notification.service";

const router = Router();

// GET /api/threads/sample — dev helper: first thread ID for metromap URL resolver
router.get("/sample", async (_req: Request, res: Response) => {
  try {
    const first = await prisma.thread.findFirst({
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
    res.json({ items: first ? [{ id: first.id }] : [] });
  } catch (error) {
    console.error("threads/sample error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

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
      select: { isSpecialist: true },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Iter11: specialist-mode view is gated by the opt-in flag, not role.
    const isSpecialist = user.isSpecialist;

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


// GET /api/threads/my — unified inbox.
//
// Iter11 PR 3 — replaces the legacy perspective-split `/api/threads` for
// the UI inbox. Returns threads where the caller is EITHER the client
// (request author) OR the specialist (thread writer), grouped by request
// so a single USER who sent a request AND later became a specialist can
// see both sides of the same request in one list.
router.get("/my", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const threads = await prisma.thread.findMany({
      where: {
        OR: [
          { specialistId: userId },
          { clientId: userId },
        ],
      },
      orderBy: { lastMessageAt: { sort: "desc", nulls: "last" } },
      include: {
        request: { select: { id: true, title: true, status: true, userId: true } },
        client: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        specialist: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { text: true, createdAt: true, senderId: true },
        },
      },
    });

    // Enrich with actual unread counts, tagged with perspective
    // ("as_client" | "as_specialist") so the UI can render two chips on
    // the same request if the USER is on both sides.
    const enriched = await Promise.all(
      threads.map(async (thread) => {
        const asSpecialist = thread.specialistId === userId;
        const lastReadAt = asSpecialist
          ? thread.specialistLastReadAt
          : thread.clientLastReadAt;
        const unreadCount = await prisma.message.count({
          where: {
            threadId: thread.id,
            senderId: { not: userId },
            ...(lastReadAt ? { createdAt: { gt: lastReadAt } } : {}),
          },
        });
        const otherUser = asSpecialist ? thread.client : thread.specialist;
        const lastMessage = thread.messages[0] ?? null;
        return {
          id: thread.id,
          requestId: thread.requestId,
          request: thread.request,
          perspective: asSpecialist ? "as_specialist" : "as_client",
          otherUser: {
            id: otherUser.id,
            firstName: otherUser.firstName,
            lastName: otherUser.lastName,
            avatarUrl: otherUser.avatarUrl,
          },
          lastMessage: lastMessage
            ? { text: lastMessage.text, createdAt: lastMessage.createdAt }
            : null,
          unreadCount,
          createdAt: thread.createdAt,
        };
      })
    );

    // Group by request. Same request seen from both perspectives (client
    // + specialist) lands in the same group — useful for the dual-role
    // case post-iter11.
    type Group = {
      request: typeof enriched[number]["request"];
      threads: typeof enriched;
    };
    const groups = new Map<string, Group>();
    for (const th of enriched) {
      if (!th.requestId) continue;
      const existing = groups.get(th.requestId);
      if (existing) {
        existing.threads.push(th);
      } else {
        groups.set(th.requestId, { request: th.request, threads: [th] });
      }
    }

    res.json({ groups: Array.from(groups.values()) });
  } catch (error) {
    console.error("threads/my error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/threads/:id — get single thread by id (participant only)
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const rawId = req.params.id;
    const threadId = Array.isArray(rawId) ? rawId[0] : rawId;

    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
      include: {
        request: { select: { id: true, title: true, status: true } },
        client: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        specialist: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
    });

    if (!thread) {
      res.status(404).json({ error: "Thread not found" });
      return;
    }

    if (thread.clientId !== userId && thread.specialistId !== userId) {
      res.status(403).json({ error: "Not a participant" });
      return;
    }

    const isClient = thread.clientId === userId;
    const otherUser = isClient ? thread.specialist : thread.client;

    res.json({
      id: thread.id,
      requestId: thread.requestId,
      clientId: thread.clientId,
      specialistId: thread.specialistId,
      request: thread.request,
      client: thread.client,
      specialist: thread.specialist,
      otherUser: {
        id: otherUser.id,
        firstName: otherUser.firstName,
        lastName: otherUser.lastName,
        avatarUrl: otherUser.avatarUrl,
      },
      createdAt: thread.createdAt,
    });
  } catch (error) {
    console.error("threads get error:", error);
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

    if (firstMessage.length < 10 || firstMessage.length > 2000) {
      res.status(400).json({ error: "Message must be 10-2000 characters" });
      return;
    }

    // Verify user has specialist features enabled. Iter11: CLIENT+SPECIALIST
    // unified into USER — writing threads requires isSpecialist=true AND a
    // completed specialist profile (so clients don't get half-filled profiles
    // showing up in their inbox).
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isSpecialist: true, specialistProfileCompletedAt: true },
    });

    if (!user || !user.isSpecialist) {
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

    // Notify client: specialist started a new thread on their request
    // SA: «Специалист X написал по вашей заявке 'TITLE'»
    sendNotification({
      userId: request.userId,
      type: "new_message_from_specialist",
      title: `Новое сообщение от специалиста по заявке «${thread.request.title}»`,
      body: firstMessage.slice(0, 200),
      entityId: thread.id,
    }).catch((err: Error) => console.warn("[notifications] new_message_from_specialist trigger failed:", err.message));

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
