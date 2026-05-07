/**
 * /api/admin/consultant/* — full audit access to consultant chats.
 * Auth + ADMIN role inherited from /api/admin parent router.
 */
import { Router, Request, Response } from "express";
import { prisma } from "../../lib/prisma";

const router = Router();

router.get("/users", async (_req: Request, res: Response) => {
  const rows = await prisma.consultantThread.groupBy({
    by: ["userId"],
    _count: { id: true },
    _max: { updatedAt: true },
  });
  const users = await prisma.user.findMany({
    where: { id: { in: rows.map((r) => r.userId) } },
    select: { id: true, email: true, firstName: true, lastName: true, role: true },
  });
  const byId = new Map(users.map((u) => [u.id, u]));
  return res.json({
    users: rows
      .map((r) => {
        const u = byId.get(r.userId);
        if (!u) return null;
        return { ...u, threadCount: r._count.id, lastActivity: r._max.updatedAt };
      })
      .filter((x): x is NonNullable<typeof x> => !!x)
      .sort((a, b) => +new Date(b.lastActivity!) - +new Date(a.lastActivity!)),
  });
});

router.get("/users/:userId/threads", async (req: Request, res: Response) => {
  const threads = await prisma.consultantThread.findMany({
    where: { userId: String(req.params.userId) },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true, title: true, createdAt: true, updatedAt: true,
      archivedFromUser: true, contextOverflowedAt: true,
      _count: { select: { messages: true } },
    },
  });
  return res.json({
    threads: threads.map((t) => ({
      id: t.id, title: t.title, createdAt: t.createdAt, updatedAt: t.updatedAt,
      messageCount: t._count.messages,
      archivedFromUser: t.archivedFromUser, contextFull: !!t.contextOverflowedAt,
    })),
  });
});

router.get("/threads/:id/messages", async (req: Request, res: Response) => {
  const thread = await prisma.consultantThread.findUnique({ where: { id: String(req.params.id) } });
  if (!thread) return res.status(404).json({ error: "thread_not_found" });
  const messages = await prisma.consultantMessage.findMany({
    where: { threadId: thread.id },
    orderBy: { createdAt: "asc" },
  });
  return res.json({
    threadId: thread.id, userId: thread.userId, title: thread.title,
    archivedFromUser: thread.archivedFromUser, contextFull: !!thread.contextOverflowedAt,
    messages: messages.map((m) => ({
      id: m.id, role: m.role, content: m.content, createdAt: m.createdAt,
      sources: m.sourcesJson ? JSON.parse(m.sourcesJson) : [],
      usage: m.usageJson ? JSON.parse(m.usageJson) : null,
      debug: m.debugJson ? JSON.parse(m.debugJson) : null,
    })),
  });
});

export default router;
