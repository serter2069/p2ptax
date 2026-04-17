import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";

const router = Router();

function param(val: string | string[] | undefined): string {
  return Array.isArray(val) ? val[0] : val || "";
}

// GET /api/messages/threads — list threads for current user
router.get("/threads", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const threads = await prisma.thread.findMany({
      where: {
        OR: [{ clientId: userId }, { specialistId: userId }],
      },
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
      orderBy: { lastMessageAt: "desc" },
    });

    const result = threads.map((t) => ({
      id: t.id,
      request: t.request,
      client: t.client,
      specialist: t.specialist,
      lastMessage: t.messages[0] || null,
      lastMessageAt: t.lastMessageAt,
      createdAt: t.createdAt,
    }));

    res.json({ threads: result });
  } catch (error) {
    console.error("list threads error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/messages/:threadId — get messages in thread
router.get("/:threadId", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const threadId = param(req.params.threadId);

    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
    });

    if (!thread) {
      res.status(404).json({ error: "Thread not found" });
      return;
    }

    if (thread.clientId !== userId && thread.specialistId !== userId) {
      res.status(403).json({ error: "Not a participant of this thread" });
      return;
    }

    const messages = await prisma.message.findMany({
      where: { threadId },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    res.json({ messages });
  } catch (error) {
    console.error("get messages error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/messages/:threadId — send message in thread
router.post("/:threadId", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const threadId = param(req.params.threadId);
    const { text } = req.body;

    if (!text || typeof text !== "string") {
      res.status(400).json({ error: "Message text is required" });
      return;
    }

    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
      include: { request: { select: { status: true } } },
    });

    if (!thread) {
      res.status(404).json({ error: "Thread not found" });
      return;
    }

    if (thread.clientId !== userId && thread.specialistId !== userId) {
      res.status(403).json({ error: "Not a participant of this thread" });
      return;
    }

    if (thread.request.status === "CLOSED") {
      res.status(422).json({ error: "Request is closed. Chat is read-only." });
      return;
    }

    const message = await prisma.message.create({
      data: {
        threadId,
        senderId: userId,
        text,
      },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
      },
    });

    await prisma.thread.update({
      where: { id: threadId },
      data: { lastMessageAt: new Date() },
    });

    res.json({ message });
  } catch (error) {
    console.error("send message error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/messages/:threadId/read — mark thread as read
router.patch("/:threadId/read", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const threadId = param(req.params.threadId);

    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
    });

    if (!thread) {
      res.status(404).json({ error: "Thread not found" });
      return;
    }

    if (thread.clientId !== userId && thread.specialistId !== userId) {
      res.status(403).json({ error: "Not a participant" });
      return;
    }

    const updateData = thread.clientId === userId
      ? { clientLastReadAt: new Date() }
      : { specialistLastReadAt: new Date() };

    await prisma.thread.update({
      where: { id: threadId },
      data: updateData,
    });

    res.json({ success: true });
  } catch (error) {
    console.error("mark read error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
