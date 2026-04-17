import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";

const router = Router();

function getParam(param: string | string[]): string {
  return Array.isArray(param) ? param[0] : param;
}

// GET /api/messages — list conversations for current user
router.get("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const conversations = await prisma.conversation.findMany({
      where: {
        participants: { some: { userId } },
      },
      include: {
        participants: {
          include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const result = conversations.map((conv: typeof conversations[number]) => ({
      id: conv.id,
      participants: conv.participants.map((p: typeof conv.participants[number]) => p.user),
      lastMessage: conv.messages[0] || null,
      updatedAt: conv.updatedAt,
    }));

    res.json({ conversations: result });
  } catch (error) {
    console.error("list conversations error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/messages/:conversationId — get messages in conversation
router.get("/:conversationId", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const conversationId = getParam(req.params.conversationId);

    // Verify user is participant
    const participant = await prisma.conversationParticipant.findFirst({
      where: { conversationId, userId },
    });

    if (!participant) {
      res.status(403).json({ error: "Not a participant of this conversation" });
      return;
    }

    const messages = await prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: { select: { id: true, name: true, email: true, avatar: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    res.json({ messages });
  } catch (error) {
    console.error("get messages error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/messages/:conversationId — send message
router.post("/:conversationId", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const conversationId = getParam(req.params.conversationId);
    const { content } = req.body;

    if (!content || typeof content !== "string") {
      res.status(400).json({ error: "Message content is required" });
      return;
    }

    // Verify user is participant
    const participant = await prisma.conversationParticipant.findFirst({
      where: { conversationId, userId },
    });

    if (!participant) {
      res.status(403).json({ error: "Not a participant of this conversation" });
      return;
    }

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        content,
      },
      include: {
        sender: { select: { id: true, name: true, email: true, avatar: true } },
      },
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    res.json({ message });
  } catch (error) {
    console.error("send message error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
