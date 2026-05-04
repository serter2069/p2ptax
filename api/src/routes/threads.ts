import { Router, Request, Response } from "express";
import * as Minio from "minio";
import { prisma } from "../lib/prisma";
import { minioClient, MINIO_BUCKET } from "../lib/minio";
import { authMiddleware } from "../middleware/auth";
import { sendNotification } from "../notifications/notification.service";

const router = Router();

const BUCKET = process.env.MINIO_BUCKET || "p2ptax";

const ONLINE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes
function computeIsOnline(lastSeenAt: Date | null | undefined): boolean {
  if (!lastSeenAt) return false;
  return Date.now() - lastSeenAt.getTime() < ONLINE_THRESHOLD_MS;
}

/**
 * Privacy mask for the other party's display fields. When a specialist
 * has closed their public profile (isSpecialist && !isAvailable), strip
 * avatar and replace lastName with first-letter-only — same rule the
 * /api/specialists/:id detail page applies. Clients (isSpecialist=false)
 * are unaffected; their isAvailable flag is meaningless.
 */
type ThreadPartyRow = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  isAvailable?: boolean;
  isSpecialist?: boolean;
};
function maskClosedParty(u: ThreadPartyRow) {
  const closed = u.isSpecialist === true && u.isAvailable === false;
  return {
    firstName: u.firstName,
    lastName: closed
      ? u.lastName
        ? u.lastName.charAt(0) + "."
        : null
      : u.lastName,
    avatarUrl: closed ? null : u.avatarUrl,
    isClosed: closed,
  };
}

// 1-hour presigned URL so the <Image> component can load without auth headers.
async function presignAttachmentUrl(storedUrl: string): Promise<string> {
  // storedUrl is like "/<bucket>/<key>" or already an http URL.
  if (storedUrl.startsWith("http")) return storedUrl;
  const withoutLeadingSlash = storedUrl.replace(/^\/+/, "");
  const prefix = `${MINIO_BUCKET}/`;
  const key = withoutLeadingSlash.startsWith(prefix)
    ? withoutLeadingSlash.slice(prefix.length)
    : withoutLeadingSlash;
  try {
    return await minioClient.presignedGetObject(MINIO_BUCKET, key, 60 * 60);
  } catch {
    return storedUrl; // fallback to raw path — better than broken
  }
}

function getMinioClient(): Minio.Client {
  return new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT || "localhost",
    port: parseInt(process.env.MINIO_PORT || "9000", 10),
    useSSL: process.env.MINIO_USE_SSL === "true",
    accessKey: process.env.MINIO_ACCESS_KEY || "minioadmin",
    secretKey: process.env.MINIO_SECRET_KEY || "minioadmin",
  });
}

// Resolve a pending uploadToken (uploaded before the thread existed) to its MinIO object key.
// Returns null if not found.
async function resolvePendingUpload(
  uploadToken: string
): Promise<{ key: string; filename: string } | null> {
  const client = getMinioClient();
  const prefix = `chat-files/_pending/${uploadToken}_`;
  try {
    return await new Promise((resolve, reject) => {
      const stream = client.listObjects(BUCKET, prefix, false);
      let found: Minio.BucketItem | null = null;
      stream.on("data", (obj: Minio.BucketItem) => {
        if (!found) found = obj;
      });
      stream.on("end", () => {
        if (found && found.name) {
          const rawName = found.name.split("/").pop() ?? "file";
          const underscoreIdx = rawName.indexOf("_");
          const filename = underscoreIdx >= 0 ? rawName.slice(underscoreIdx + 1) : rawName;
          resolve({ key: found.name, filename });
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

// GET /api/threads/sample — dev helper: first thread ID for metromap URL resolver
// SECURITY: dev/tooling helper — returns minimal data (id only), intentionally public for metromap
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
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
    const offset = Math.max(0, parseInt(req.query.offset as string) || 0);

    const [threads, total] = await Promise.all([
      prisma.thread.findMany({
        where: {
          ...(isSpecialist
            ? { specialistId: userId }
            : { clientId: userId }),
          ...(requestIdFilter ? { requestId: requestIdFilter } : {}),
        },
        orderBy: { lastMessageAt: { sort: "desc", nulls: "last" } },
        skip: offset,
        take: limit,
        include: {
          request: {
            select: { id: true, title: true, status: true },
          },
          client: {
            select: { id: true, firstName: true, lastName: true, avatarUrl: true, deletedAt: true, lastSeenAt: true, isAvailable: true, isSpecialist: true },
          },
          specialist: {
            select: { id: true, firstName: true, lastName: true, avatarUrl: true, deletedAt: true, lastSeenAt: true, isAvailable: true, isSpecialist: true },
          },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { id: true, text: true, createdAt: true, senderId: true },
          },
        },
      }),
      prisma.thread.count({
        where: {
          ...(isSpecialist
            ? { specialistId: userId }
            : { clientId: userId }),
          ...(requestIdFilter ? { requestId: requestIdFilter } : {}),
        },
      }),
    ]);

    // Fetch files for last messages
    const lastMessageIds = threads
      .map((t) => t.messages[0]?.id)
      .filter((id): id is string => Boolean(id));
    const lastMessageFiles = lastMessageIds.length > 0
      ? await prisma.file.findMany({
          where: { entityType: "message", entityId: { in: lastMessageIds } },
          select: { id: true, entityId: true, url: true, filename: true, mimeType: true },
        })
      : [];
    const filesByLastMessageId = new Map<string, typeof lastMessageFiles>();
    for (const f of lastMessageFiles) {
      const arr = filesByLastMessageId.get(f.entityId) ?? [];
      arr.push(f);
      filesByLastMessageId.set(f.entityId, arr);
    }

    const mapped = await Promise.all(threads.map(async (t) => {
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

      const rawAttachments = filesByLastMessageId.get(lastMessage?.id ?? "") ?? [];
      const attachments = await Promise.all(
        rawAttachments.map(async (f) => ({
          id: f.id,
          url: await presignAttachmentUrl(f.url),
          filename: f.filename,
          mimeType: f.mimeType,
        }))
      );

      const masked = maskClosedParty(otherUser);
      return {
        id: t.id,
        request: t.request,
        otherUser: {
          id: otherUser.id,
          firstName: masked.firstName,
          lastName: masked.lastName,
          avatarUrl: masked.avatarUrl,
          isClosed: masked.isClosed,
          isDeleted: otherUser.deletedAt !== null,
          isOnline: computeIsOnline(otherUser.lastSeenAt),
        },
        lastMessage: lastMessage
          ? {
              text: lastMessage.text,
              createdAt: lastMessage.createdAt,
              attachments,
            }
          : null,
        unreadCount,
        createdAt: t.createdAt,
      };
    }));

    // Enrich with actual unread counts — batch into parallel queries
    // Threads with lastReadAt need per-thread counts; threads without can be batched.
    const threadsWithRead = threads.filter(t => {
      const lastReadAt = isSpecialist ? t.specialistLastReadAt : t.clientLastReadAt;
      return lastReadAt !== null;
    });
    const threadsWithoutRead = threads.filter(t => {
      const lastReadAt = isSpecialist ? t.specialistLastReadAt : t.clientLastReadAt;
      return lastReadAt === null;
    });

    const readCounts = await Promise.all(
      threadsWithRead.map(async (thread) => {
        const lastReadAt = isSpecialist
          ? thread.specialistLastReadAt
          : thread.clientLastReadAt;
        return prisma.message.count({
          where: {
            threadId: thread.id,
            senderId: { not: userId },
            ...(lastReadAt ? { createdAt: { gt: lastReadAt } } : {}),
          },
        });
      })
    );

    // Build a map from thread id to unread count
    const unreadMap = new Map<string, number>();
    threadsWithRead.forEach((t, i) => unreadMap.set(t.id, readCounts[i]));

    // Use groupBy for the threadsWithoutRead to get per-thread counts in one query
    if (threadsWithoutRead.length > 0) {
      const groupCounts = await prisma.message.groupBy({
        by: ['threadId'],
        _count: { id: true },
        where: {
          threadId: { in: threadsWithoutRead.map(t => t.id) },
          senderId: { not: userId },
        },
      });
      groupCounts.forEach(g => unreadMap.set(g.threadId, g._count.id));
    }

    // Map counts back to items
    const itemThreadMap = new Map(mapped.map((item, i) => [threads[i].id, item]));
    threads.forEach((t, i) => {
      itemThreadMap.get(t.id)!.unreadCount = unreadMap.get(t.id) ?? 0;
    });

    res.json({ items: mapped, total, limit, offset, hasMore: offset + limit < total });
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
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
    const offset = Math.max(0, parseInt(req.query.offset as string) || 0);

    const [threads, total] = await Promise.all([
      prisma.thread.findMany({
        where: {
          OR: [
            { specialistId: userId },
            { clientId: userId },
          ],
        },
        orderBy: { lastMessageAt: { sort: "desc", nulls: "last" } },
        skip: offset,
        take: limit,
        include: {
          request: { select: { id: true, title: true, status: true, userId: true } },
          client: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, deletedAt: true, lastSeenAt: true, isAvailable: true, isSpecialist: true } },
          specialist: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, deletedAt: true, lastSeenAt: true, isAvailable: true, isSpecialist: true } },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { id: true, text: true, createdAt: true, senderId: true },
          },
        },
      }),
      prisma.thread.count({
        where: {
          OR: [
            { specialistId: userId },
            { clientId: userId },
          ],
        },
      }),
    ]);

    // Fetch files for last messages (my inbox)
    const myLastMessageIds = threads
      .map((t) => t.messages[0]?.id)
      .filter((id): id is string => Boolean(id));
    const myLastMessageFiles = myLastMessageIds.length > 0
      ? await prisma.file.findMany({
          where: { entityType: "message", entityId: { in: myLastMessageIds } },
          select: { id: true, entityId: true, url: true, filename: true, mimeType: true },
        })
      : [];
    const myFilesByLastMessageId = new Map<string, typeof myLastMessageFiles>();
    for (const f of myLastMessageFiles) {
      const arr = myFilesByLastMessageId.get(f.entityId) ?? [];
      arr.push(f);
      myFilesByLastMessageId.set(f.entityId, arr);
    }

    // Enrich with actual unread counts — batch with groupBy for threads
    // that share the same lastReadAt pattern. Each thread has its own
    // lastReadAt so we still need per-thread queries, but we parallelize
    // them in a single Promise.all (no sequential for-await).
    const threadsWithRead = threads.filter(t => {
      const asSpecialist = t.specialistId === userId;
      const lastReadAt = asSpecialist ? t.specialistLastReadAt : t.clientLastReadAt;
      return lastReadAt !== null;
    });
    const threadsWithoutRead = threads.filter(t => {
      const asSpecialist = t.specialistId === userId;
      const lastReadAt = asSpecialist ? t.specialistLastReadAt : t.clientLastReadAt;
      return lastReadAt === null;
    });

    const readCounts = await Promise.all(
      threadsWithRead.map(async (thread) => {
        const asSpecialist = thread.specialistId === userId;
        const lastReadAt = asSpecialist
          ? thread.specialistLastReadAt!
          : thread.clientLastReadAt!;
        return prisma.message.count({
          where: {
            threadId: thread.id,
            senderId: { not: userId },
            createdAt: { gt: lastReadAt },
          },
        });
      })
    );

    // Build per-thread unread map
    const unreadMap = new Map<string, number>();
    threadsWithRead.forEach((t, i) => unreadMap.set(t.id, readCounts[i]));

    // For threads never read, use groupBy to get per-thread counts in one query
    if (threadsWithoutRead.length > 0) {
      const groupCounts = await prisma.message.groupBy({
        by: ['threadId'],
        _count: { id: true },
        where: {
          threadId: { in: threadsWithoutRead.map(t => t.id) },
          senderId: { not: userId },
        },
      });
      groupCounts.forEach(g => unreadMap.set(g.threadId, g._count.id));
    }

    // Build enriched results with correct unread counts
    const enriched = await Promise.all(threads.map(async (thread) => {
      const asSpecialist = thread.specialistId === userId;
      const otherUser = asSpecialist ? thread.client : thread.specialist;
      const lastMessage = thread.messages[0] ?? null;

      const rawAttachments = myFilesByLastMessageId.get(lastMessage?.id ?? "") ?? [];
      const attachments = await Promise.all(
        rawAttachments.map(async (f) => ({
          id: f.id,
          url: await presignAttachmentUrl(f.url),
          filename: f.filename,
          mimeType: f.mimeType,
        }))
      );

      const masked = maskClosedParty(otherUser);
      return {
        id: thread.id,
        requestId: thread.requestId,
        request: thread.request,
        perspective: asSpecialist ? "as_specialist" : "as_client",
        otherUser: {
          id: otherUser.id,
          firstName: masked.firstName,
          lastName: masked.lastName,
          avatarUrl: masked.avatarUrl,
          isClosed: masked.isClosed,
          isDeleted: otherUser.deletedAt !== null,
          isOnline: computeIsOnline(otherUser.lastSeenAt),
        },
        lastMessage: lastMessage
          ? {
              text: lastMessage.text,
              createdAt: lastMessage.createdAt,
              attachments,
            }
          : null,
        unreadCount: unreadMap.get(thread.id) ?? 0,
        createdAt: thread.createdAt,
      };
    }));

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

    res.json({ groups: Array.from(groups.values()), total, limit, offset, hasMore: offset + limit < total });
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
        client: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, deletedAt: true, isAvailable: true, isSpecialist: true } },
        specialist: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, deletedAt: true, isAvailable: true, isSpecialist: true } },
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

    // Strip the raw `deletedAt` Date and apply the closed-profile mask
    // (avatarUrl/lastName) so frontends can render minimal display data
    // for specialists who hid themselves.
    const stripAndMask = <T extends ThreadPartyRow & { deletedAt: Date | null }>(u: T) => {
      const masked = maskClosedParty(u);
      return {
        id: u.id,
        firstName: masked.firstName,
        lastName: masked.lastName,
        avatarUrl: masked.avatarUrl,
        isClosed: masked.isClosed,
        isDeleted: u.deletedAt !== null,
      };
    };

    res.json({
      id: thread.id,
      requestId: thread.requestId,
      clientId: thread.clientId,
      specialistId: thread.specialistId,
      request: thread.request,
      client: stripAndMask(thread.client),
      specialist: stripAndMask(thread.specialist),
      otherUser: stripAndMask(otherUser),
      createdAt: thread.createdAt,
    });
  } catch (error) {
    console.error("threads get error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/threads/:id — soft delete thread (participant only)
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const rawId = req.params.id;
    const threadId = Array.isArray(rawId) ? rawId[0] : rawId;

    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
      select: { id: true, clientId: true, specialistId: true, deletedAt: true },
    });

    if (!thread) {
      res.status(404).json({ error: "Thread not found" });
      return;
    }

    if (thread.clientId !== userId && thread.specialistId !== userId) {
      res.status(403).json({ error: "Not a participant" });
      return;
    }

    if (thread.deletedAt) {
      res.json({ ok: true });
      return;
    }

    await prisma.thread.update({
      where: { id: threadId },
      data: { deletedAt: new Date(), deletedBy: userId },
    });

    // Delete associated files from MinIO and DB
    try {
      // Collect all message IDs for this thread
      const messages = await prisma.message.findMany({
        where: { threadId },
        select: { id: true },
      });
      const messageIds = messages.map((m) => m.id);

      if (messageIds.length > 0) {
        // Find all File records attached to these messages
        const files = await prisma.file.findMany({
          where: {
            entityType: "message",
            entityId: { in: messageIds },
          },
          select: { id: true, url: true },
        });

        if (files.length > 0) {
          // Extract MinIO object key from url: "/<bucket>/<key>" or "/<key>"
          const objectKeys = files
            .map((f) => {
              // url stored as "/<bucket>/<key...>" — strip leading "/<bucket>/"
              const prefix = `/${MINIO_BUCKET}/`;
              if (f.url.startsWith(prefix)) {
                return f.url.slice(prefix.length);
              }
              // fallback: strip leading slash
              return f.url.replace(/^\//, "");
            })
            .filter(Boolean);

          // Delete from MinIO (errors are non-fatal — thread already soft-deleted)
          await Promise.allSettled(
            objectKeys.map((key) =>
              minioClient.removeObject(MINIO_BUCKET, key).catch((err: Error) =>
                console.warn(`[threads] MinIO delete failed for key "${key}":`, err.message)
              )
            )
          );

          // Delete File records from DB
          await prisma.file.deleteMany({
            where: { id: { in: files.map((f) => f.id) } },
          });
        }
      }
    } catch (cleanupErr) {
      // Non-fatal: log but don't fail — thread is already soft-deleted
      console.warn("[threads] file cleanup error after soft-delete:", cleanupErr);
    }

    res.json({ ok: true });
  } catch (error) {
    console.error("threads delete error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/threads/direct — get or create a direct thread between caller and a specialist
// Used by the catalog "Написать" button: no requestId, no firstMessage required.
router.post("/direct", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    // Accept either {targetUserId} (new, role-agnostic) or {specialistId}
    // (legacy; old clients still in cache). Treat them as the same field.
    const body = req.body as { targetUserId?: string; specialistId?: string };
    const targetUserId = body.targetUserId ?? body.specialistId;

    if (!targetUserId || typeof targetUserId !== "string") {
      res.status(400).json({ error: "targetUserId is required" });
      return;
    }

    if (userId === targetUserId) {
      res.status(400).json({ error: "Cannot start a thread with yourself" });
      return;
    }

    const target = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, isBanned: true, deletedAt: true },
    });

    if (!target || target.isBanned || target.deletedAt) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // DM is symmetric: A → B and B → A share one thread. The Thread schema
    // labels columns clientId/specialistId for historical reasons, but for
    // request-less DMs the labels are arbitrary — we just look up by either
    // ordering and reuse whichever exists.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing = await (prisma.thread as any).findFirst({
      where: {
        requestId: null,
        OR: [
          { clientId: userId, specialistId: targetUserId },
          { clientId: targetUserId, specialistId: userId },
        ],
      },
    }) as { id: string } | null;

    if (existing) {
      res.json({ threadId: existing.id, created: false });
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const thread = await (prisma.thread as any).create({
      data: { requestId: null, clientId: userId, specialistId: targetUserId },
    }) as { id: string };

    res.status(201).json({ threadId: thread.id, created: true });
  } catch (error) {
    console.error("threads/direct error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/threads — create thread with first message (specialist only)
router.post("/", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { requestId, firstMessage, uploadToken } = req.body as {
      requestId?: string;
      firstMessage?: string;
      uploadToken?: string;
    };

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
      res.status(409).json({ error: "Запрос закрыт" });
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

    // Create thread + first message + update request in a single transaction
    const now = new Date();
    const result = await prisma.$transaction(async (tx) => {
      const thread = await tx.thread.create({
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
          messages: { select: { id: true }, take: 1 },
        },
      });

      await tx.request.update({
        where: { id: requestId },
        data: { lastActivityAt: now },
      });

      return thread;
    });

    const thread = result;

    // If specialist attached a pending file (uploaded before the thread existed),
    // link it to the first message. Failures are silent — the thread+message must succeed
    // even if the upload step has trouble.
    if (uploadToken && typeof uploadToken === "string" && uploadToken.length >= 8) {
      try {
        const resolved = await resolvePendingUpload(uploadToken);
        const firstMessageId = thread.messages[0]?.id;
        if (resolved && firstMessageId) {
          await prisma.file.create({
            data: {
              entityType: "message",
              entityId: firstMessageId,
              url: `/${BUCKET}/${resolved.key}`,
              filename: resolved.filename,
              size: 0,
              mimeType: "application/octet-stream",
            },
          });
        }
      } catch (linkErr) {
        console.warn("[threads] failed to link uploadToken file:", linkErr);
      }
    }

    // Notify client: specialist started a new thread on their request
    // SA: «Специалист X написал по вашему запросу 'TITLE'»
    sendNotification({
      userId: request.userId,
      type: "new_message_from_specialist",
      title: `Новое сообщение от специалиста по запросу «${thread.request?.title ?? ""}»`,
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
