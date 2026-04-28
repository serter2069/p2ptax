import { Router, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";
import { sendNotification } from "../notifications/notification.service";
import { sendNewMessageEmail } from "../lib/email";
import type * as Minio from "minio";
import { minioClient, MINIO_BUCKET } from "../lib/minio";

const router = Router();

const messageRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Слишком много сообщений. Попробуйте через минуту." },
});

// Resolve uploadToken to MinIO object key by listing objects with matching prefix
async function resolveUploadToken(threadId: string, uploadToken: string): Promise<{ key: string; fileUrl: string } | null> {
  const prefix = `chat-files/${threadId}/${uploadToken}_`;
  try {
    return await new Promise((resolve, reject) => {
      const stream = minioClient.listObjects(MINIO_BUCKET, prefix, false);
      let found: Minio.BucketItem | null = null;
      stream.on("data", (obj: Minio.BucketItem) => {
        if (!found) found = obj;
      });
      stream.on("end", () => {
        if (found && found.name) {
          resolve({ key: found.name, fileUrl: `/${MINIO_BUCKET}/${found.name}` });
        } else {
          resolve(null);
        }
      });
      stream.on("error", reject);
    });
  } catch {
    return null;
  }
}

function param(val: string | string[] | undefined): string {
  return Array.isArray(val) ? val[0] : val || "";
}

interface FileInput {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

// GET /api/messages/threads — list threads for current user
router.get("/threads", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
    const offset = Math.max(0, parseInt(req.query.offset as string) || 0);

    const [threads, total] = await Promise.all([
      prisma.thread.findMany({
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
        skip: offset,
        take: limit,
      }),
      prisma.thread.count({
        where: {
          OR: [{ clientId: userId }, { specialistId: userId }],
        },
      }),
    ]);

    const result = threads.map((t) => ({
      id: t.id,
      request: t.request,
      client: t.client,
      specialist: t.specialist,
      lastMessage: t.messages[0] || null,
      lastMessageAt: t.lastMessageAt,
      createdAt: t.createdAt,
    }));

    res.json({ threads: result, total, limit, offset, hasMore: offset + limit < total });
  } catch (error) {
    console.error("list threads error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/messages/:threadId — get messages in thread (with file attachments)
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

    // Attach files for each message
    const messageIds = messages.map((m) => m.id);
    const files = messageIds.length > 0
      ? await prisma.file.findMany({
          where: { entityType: "message", entityId: { in: messageIds } },
          select: { id: true, entityId: true, url: true, filename: true, size: true, mimeType: true },
        })
      : [];

    const filesByMessage: Record<string, typeof files> = {};
    for (const f of files) {
      if (!filesByMessage[f.entityId]) filesByMessage[f.entityId] = [];
      filesByMessage[f.entityId].push(f);
    }

    const result = messages.map((m) => ({
      ...m,
      files: filesByMessage[m.id] || [],
    }));

    res.json({ messages: result });
  } catch (error) {
    console.error("get messages error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/messages/:threadId — send message in thread (with optional file attachments)
// Supports uploadToken (idempotency): if provided, verifies the file exists in MinIO
// Fix #186: text (content) is optional when uploadToken or files are present.
// Validation rule: at least one of (text, files, uploadToken) must be non-empty.
router.post("/:threadId", authMiddleware, messageRateLimiter, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const threadId = param(req.params.threadId);
    // text is intentionally optional — attachment-only messages are valid (#186)
    const { text, files, uploadToken } = req.body as { text?: string; files?: FileInput[]; uploadToken?: string };

    // Validate content type and length
    if (text !== undefined && typeof text !== "string") {
      res.status(400).json({ error: "content must be a string" });
      return;
    }
    const trimmedText = typeof text === "string" ? text.trim() : "";
    if (trimmedText.length > 10000) {
      res.status(400).json({ error: "Message content exceeds maximum length of 10000 characters" });
      return;
    }
    const attachedFiles: FileInput[] = Array.isArray(files) ? files.slice(0, 3) : [];

    // If uploadToken provided, resolve it to a file before any other validation.
    // A message with only an uploadToken (no text) is valid — this resolves #186.
    let tokenFile: { fileUrl: string } | null = null;
    if (uploadToken && typeof uploadToken === "string" && uploadToken.length >= 8) {
      const resolved = await resolveUploadToken(threadId, uploadToken);
      if (!resolved) {
        res.status(422).json({ error: "Файл не найден, загрузите повторно" });
        return;
      }
      tokenFile = resolved;
    }

    // Require at least one of: text, files array, or uploadToken-resolved file
    if (!trimmedText && attachedFiles.length === 0 && !tokenFile) {
      res.status(400).json({ error: "Message text or at least one file is required" });
      return;
    }

    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
      include: { request: { select: { status: true, title: true } } },
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

    const now = new Date();

    const { message, savedFiles } = await prisma.$transaction(async (tx) => {
      const message = await tx.message.create({
        data: {
          threadId,
          senderId: userId,
          text: trimmedText,
        },
        include: {
          sender: {
            select: { id: true, firstName: true, lastName: true, avatarUrl: true },
          },
        },
      });

      // Store file records — combine token-resolved file + legacy files array
      let savedFiles: { id: string; url: string; filename: string; size: number; mimeType: string }[] = [];
      const allFilesToSave: FileInput[] = [...attachedFiles];
      if (tokenFile) {
        const keyParts = tokenFile.fileUrl.split("/");
        const rawName = keyParts[keyParts.length - 1] ?? "file";
        const underscoreIdx = rawName.indexOf("_");
        const resolvedFilename = underscoreIdx >= 0 ? rawName.slice(underscoreIdx + 1) : rawName;
        allFilesToSave.push({
          url: tokenFile.fileUrl,
          filename: resolvedFilename,
          size: 0,
          mimeType: "application/octet-stream",
        });
      }
      if (allFilesToSave.length > 0) {
        const created = await Promise.all(
          allFilesToSave.map((f) =>
            tx.file.create({
              data: {
                entityType: "message",
                entityId: message.id,
                url: f.url,
                filename: f.filename,
                size: f.size,
                mimeType: f.mimeType,
              },
              select: { id: true, url: true, filename: true, size: true, mimeType: true },
            })
          )
        );
        savedFiles = created;
      }

      await tx.thread.update({
        where: { id: threadId },
        data: { lastMessageAt: now },
      });

      return { message, savedFiles };
    });

    // Notify the other participant
    const recipientId = thread.clientId === userId ? thread.specialistId : thread.clientId;
    const senderName = message.sender.firstName || "Пользователь";
    sendNotification({
      userId: recipientId,
      type: "new_message",
      title: `Новое сообщение от ${senderName}`,
      body: trimmedText ? trimmedText.slice(0, 200) : "Вложение",
      entityId: threadId,
    }).catch((err: Error) => console.warn("[notifications] new_message trigger failed:", err.message));

    // Email notification — fire-and-forget
    prisma.user.findUnique({
      where: { id: recipientId },
      select: { email: true, firstName: true, lastName: true },
    }).then((recipient) => {
      if (!recipient) return;
      const toName = [recipient.firstName, recipient.lastName].filter(Boolean).join(" ") || "Пользователь";
      return sendNewMessageEmail({
        toEmail: recipient.email,
        toName,
        fromName: senderName,
        threadId,
        requestTitle: thread.request.title,
      });
    }).catch((err: Error) => console.warn("[email] new_message email failed:", err.message));

    res.json({ message: { ...message, files: savedFiles } });
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
