import { Router, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";
import { sendNotification } from "../notifications/notification.service";
import { sendNewMessageEmail } from "../lib/email";
import { firstNameInGenitive } from "../lib/ru";
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

// Look up a single object by exact prefix in MinIO. Returns the first match.
async function findObjectByPrefix(prefix: string): Promise<Minio.BucketItem | null> {
  try {
    return await new Promise((resolve, reject) => {
      const stream = minioClient.listObjects(MINIO_BUCKET, prefix, false);
      let found: Minio.BucketItem | null = null;
      stream.on("data", (obj: Minio.BucketItem) => {
        if (!found) found = obj;
      });
      stream.on("end", () => resolve(found));
      stream.on("error", reject);
    });
  } catch {
    return null;
  }
}

// Best-effort MinIO stat → returns size + content-type. Falls back gracefully
// when the metadata is missing so we never block the message send on stat errors.
async function statObject(
  key: string
): Promise<{ size: number; contentType: string } | null> {
  try {
    const stat = await minioClient.statObject(MINIO_BUCKET, key);
    const meta = (stat.metaData ?? {}) as Record<string, string>;
    const contentType =
      meta["content-type"] ?? meta["Content-Type"] ?? "application/octet-stream";
    return { size: stat.size ?? 0, contentType };
  } catch {
    return null;
  }
}

/**
 * Resolve a chat-file uploadToken to a MinIO object key.
 *
 * Files are uploaded BEFORE the message is sent. Two namespaces are checked
 * because the upload route stores chat files under either:
 *   - `chat-files/<threadId>/<token>_<name>`  (uploaded with threadId in body)
 *   - `chat-files/_pending/<token>_<name>`    (uploaded without threadId — default)
 *
 * The chat composer (ChatComposer/FileUploadZone) uploads WITHOUT threadId, so
 * the file always lives in `_pending` initially. Without the fallback below,
 * `POST /api/messages/:threadId` returns 422 "Файл не найден, загрузите повторно".
 *
 * Returned `fileUrl` always points to wherever the object currently lives —
 * we don't move it, the URL is a stable bucket-relative path.
 */
async function resolveUploadToken(
  threadId: string,
  uploadToken: string
): Promise<{ key: string; fileUrl: string } | null> {
  // Try the thread-scoped namespace first (covers future uploads that include threadId).
  const threadPrefix = `chat-files/${threadId}/${uploadToken}_`;
  const threadHit = await findObjectByPrefix(threadPrefix);
  if (threadHit && threadHit.name) {
    return { key: threadHit.name, fileUrl: `/${MINIO_BUCKET}/${threadHit.name}` };
  }
  // Fall back to the pending namespace (where ChatComposer actually puts files).
  const pendingPrefix = `chat-files/_pending/${uploadToken}_`;
  const pendingHit = await findObjectByPrefix(pendingPrefix);
  if (pendingHit && pendingHit.name) {
    return { key: pendingHit.name, fileUrl: `/${MINIO_BUCKET}/${pendingHit.name}` };
  }
  return null;
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

// GET /api/messages/unread-count — count of threads with unread messages
router.get("/unread-count", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const threads = await prisma.thread.findMany({
      where: {
        OR: [{ clientId: userId }, { specialistId: userId }],
      },
      select: {
        id: true,
        clientId: true,
        specialistId: true,
        clientLastReadAt: true,
        specialistLastReadAt: true,
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { senderId: true, createdAt: true },
        },
      },
    });

    let count = 0;
    for (const t of threads) {
      const isClient = t.clientId === userId;
      const lastReadAt = isClient ? t.clientLastReadAt : t.specialistLastReadAt;
      const lastMsg = t.messages[0];
      if (!lastMsg) continue;
      if (lastMsg.senderId === userId) continue;
      if (!lastReadAt || lastMsg.createdAt > lastReadAt) {
        count++;
      }
    }

    res.json({ count });
  } catch (error) {
    console.error("unread-count error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

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
//
// Pagination (cursor-based, opt-in):
//   ?limit=50          → return latest 50 messages (ASC for display)
//   ?limit=50&before=X → return 50 messages older than message id X (ASC for display)
//
// Backward compatibility: if `limit` is NOT provided, returns ALL messages
// (legacy behavior) so older clients continue to work.
//
// Response shape (paginated): { messages, hasMore, nextCursor }
//   nextCursor = id of the OLDEST message in the returned page (use as `before` for next page)
//   hasMore    = whether more older messages likely exist (page filled exactly to limit)
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

    // Parse pagination params. `limit` presence = paginated mode.
    const limitRaw = param(req.query.limit as string | string[] | undefined);
    const beforeRaw = param(req.query.before as string | string[] | undefined);
    const paginated = limitRaw !== "";
    let limit = 50;
    if (paginated) {
      const parsed = parseInt(limitRaw, 10);
      if (Number.isFinite(parsed) && parsed > 0) {
        limit = Math.min(parsed, 100);
      }
    }

    type MessageRow = Awaited<ReturnType<typeof prisma.message.findMany>>[number];
    let messages: MessageRow[];

    if (!paginated) {
      // Legacy: return ALL messages, ASC order.
      messages = await prisma.message.findMany({
        where: { threadId },
        include: {
          sender: {
            select: { id: true, firstName: true, lastName: true, avatarUrl: true },
          },
        },
        orderBy: { createdAt: "asc" },
      });
    } else if (beforeRaw) {
      // Older page: messages older than `before` cursor.
      // Strategy: order DESC by createdAt, use cursor on the `before` id, skip 1, take limit.
      // Then reverse client-side response so frontend gets ASC.
      const olderDesc = await prisma.message.findMany({
        where: { threadId },
        include: {
          sender: {
            select: { id: true, firstName: true, lastName: true, avatarUrl: true },
          },
        },
        orderBy: { createdAt: "desc" },
        cursor: { id: beforeRaw },
        skip: 1,
        take: limit,
      });
      messages = olderDesc.reverse();
    } else {
      // First page: latest `limit` messages, returned ASC for display.
      const latestDesc = await prisma.message.findMany({
        where: { threadId },
        include: {
          sender: {
            select: { id: true, firstName: true, lastName: true, avatarUrl: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      });
      messages = latestDesc.reverse();
    }

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

    if (!paginated) {
      res.json({ messages: result });
      return;
    }

    res.json({
      messages: result,
      hasMore: result.length === limit,
      nextCursor: result.length > 0 ? result[0].id : null,
    });
  } catch (error) {
    console.error("get messages error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Hard cap for attachments per message — must match the frontend ChatComposer
// `maxFiles` default. Bumped from 3 → 10 (#bug 3).
const MAX_FILES_PER_MESSAGE = 10;

// POST /api/messages/:threadId — send message in thread (with optional file attachments)
// Supports uploadToken / uploadTokens (idempotency): if provided, verifies each
// file exists in MinIO via resolveUploadToken (which checks both thread-scoped
// and `_pending` namespaces).
// Fix #186: text (content) is optional when tokens or files are present.
// Validation rule: at least one of (text, files, uploadToken/uploadTokens) must be non-empty.
router.post("/:threadId", authMiddleware, messageRateLimiter, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const threadId = param(req.params.threadId);
    // text is intentionally optional — attachment-only messages are valid (#186)
    const { text, files, uploadToken, uploadTokens } = req.body as {
      text?: string;
      files?: FileInput[];
      uploadToken?: string;
      uploadTokens?: string[];
    };

    // Validate content type and length
    if (text !== undefined && typeof text !== "string") {
      res.status(400).json({ error: "content must be a string" });
      return;
    }
    // Trim → strip raw HTML tags → re-trim. We don't run a full HTML
    // sanitizer (no library dep) — messages are rendered as plain text by
    // the React Native <Text> component, but the regex below removes
    // anything that looks like a tag in case downstream surfaces (email
    // notification body, future webhooks) ever inject the value into HTML.
    const rawText = typeof text === "string" ? text : "";
    const stripped = rawText.replace(/<\/?[a-z][^>]*>/gi, "");
    const trimmedText = stripped.trim();
    const MAX_TEXT_LEN = 5000;
    if (trimmedText.length > MAX_TEXT_LEN) {
      res.status(400).json({ error: `Сообщение превышает ${MAX_TEXT_LEN} символов` });
      return;
    }
    const attachedFiles: FileInput[] = Array.isArray(files)
      ? files.slice(0, MAX_FILES_PER_MESSAGE)
      : [];

    // Normalize uploadToken (legacy single string) + uploadTokens (array) into
    // a single deduped list. Each token is a UUID-ish opaque string written by
    // the upload route — minimum length sanity-check is 8 chars.
    const tokensRaw: string[] = [];
    if (typeof uploadToken === "string") tokensRaw.push(uploadToken);
    if (Array.isArray(uploadTokens)) {
      for (const t of uploadTokens) {
        if (typeof t === "string") tokensRaw.push(t);
      }
    }
    const tokens = Array.from(
      new Set(tokensRaw.filter((t) => t.length >= 8))
    ).slice(0, MAX_FILES_PER_MESSAGE);

    // Resolve every token before any DB writes. If ANY token cannot be
    // resolved we 422 — the client already showed the file as "uploaded",
    // so silently dropping it would lose data. Stat the object to capture
    // real size + mime so the rendered chip shows accurate metadata.
    const resolvedTokenFiles: {
      fileUrl: string;
      size: number;
      mimeType: string;
    }[] = [];
    for (const t of tokens) {
      const resolved = await resolveUploadToken(threadId, t);
      if (!resolved) {
        res.status(422).json({ error: "Файл не найден, загрузите повторно" });
        return;
      }
      const stat = await statObject(resolved.key);
      resolvedTokenFiles.push({
        fileUrl: resolved.fileUrl,
        size: stat?.size ?? 0,
        mimeType: stat?.contentType ?? "application/octet-stream",
      });
    }

    // Require at least one of: text, files array, or token-resolved file(s)
    if (!trimmedText && attachedFiles.length === 0 && resolvedTokenFiles.length === 0) {
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

      // Store file records — combine token-resolved file(s) + legacy files array.
      // Multiple uploadTokens are now supported (each chip in the chat composer
      // becomes a separate file row). Size + mimeType come from the MinIO stat
      // call above when available, so the rendered chip is accurate.
      let savedFiles: { id: string; url: string; filename: string; size: number; mimeType: string }[] = [];
      const allFilesToSave: FileInput[] = [...attachedFiles];
      for (const tokenFile of resolvedTokenFiles) {
        const keyParts = tokenFile.fileUrl.split("/");
        const rawName = keyParts[keyParts.length - 1] ?? "file";
        const underscoreIdx = rawName.indexOf("_");
        const resolvedFilename = underscoreIdx >= 0 ? rawName.slice(underscoreIdx + 1) : rawName;
        allFilesToSave.push({
          url: tokenFile.fileUrl,
          filename: resolvedFilename,
          size: tokenFile.size,
          mimeType: tokenFile.mimeType,
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
      title: `Новое сообщение от ${firstNameInGenitive(senderName)}`,
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
        recipientId,
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

// DELETE /api/messages/:threadId/clear — delete all messages in thread, keep thread intact
router.delete("/:threadId/clear", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const threadId = param(req.params.threadId);

    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
      select: { id: true, clientId: true, specialistId: true },
    });

    if (!thread) {
      res.status(404).json({ error: "Thread not found" });
      return;
    }

    if (thread.clientId !== userId && thread.specialistId !== userId) {
      res.status(403).json({ error: "Not a participant" });
      return;
    }

    // Collect message ids + attached files
    const messages = await prisma.message.findMany({
      where: { threadId },
      select: { id: true },
    });
    const messageIds = messages.map((m) => m.id);

    if (messageIds.length > 0) {
      // Clean up MinIO objects for attached files
      const files = await prisma.file.findMany({
        where: { entityType: "message", entityId: { in: messageIds } },
        select: { id: true, url: true },
      });

      if (files.length > 0) {
        const objectKeys = files
          .map((f) => {
            const prefix = `/${MINIO_BUCKET}/`;
            if (f.url.startsWith(prefix)) return f.url.slice(prefix.length);
            return f.url.replace(/^\//, "");
          })
          .filter(Boolean);

        await Promise.allSettled(
          objectKeys.map((key) =>
            minioClient.removeObject(MINIO_BUCKET, key).catch((err: Error) =>
              console.warn(`[messages/clear] MinIO delete failed for key "${key}":`, err.message)
            )
          )
        );

        await prisma.file.deleteMany({ where: { id: { in: files.map((f) => f.id) } } });
      }

      await prisma.message.deleteMany({ where: { threadId } });
    }

    res.json({ ok: true });
  } catch (error) {
    console.error("messages clear error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
