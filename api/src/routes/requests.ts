import { Router, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import archiver from "archiver";
import { prisma } from "../lib/prisma";
import { Prisma } from "@prisma/client";
import { authMiddleware } from "../middleware/auth";
import { verifyAccessToken } from "../lib/jwt";
import { sendNotification } from "../notifications/notification.service";
import { notSeedRequestWhere } from "../lib/seedFilter";
import { minioClient, MINIO_BUCKET, presignAvatarUrl } from "../lib/minio";

// Strip all HTML tags to prevent XSS
function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, "").trim();
}

const router = Router();

/**
 * Notifies all specialists who cover the request's FNS, regardless of
 * which specific services they offer. This is intentional: when a client
 * picks "Не знаю" for service, we still want their request visible to
 * any qualified specialist at the FNS. Specialists can self-filter via
 * the public-requests feed.
 *
 * Side-effect only — never crashes the request flow.
 */
async function notifyMatchingSpecialists(args: {
  requestId: string;
  fnsId: string;
  title: string;
  clientUserId: string;
}): Promise<number> {
  const { requestId, fnsId, title, clientUserId } = args;
  try {
    const matchingSpecialists = await prisma.user.findMany({
      where: {
        isSpecialist: true,
        specialistProfileCompletedAt: { not: null },
        isAvailable: true,
        isBanned: false,
        // Skip soft-deleted accounts when fanning-out notifications.
        deletedAt: null,
        id: { not: clientUserId },
        specialistFns: { some: { fnsId } },
      },
      select: { id: true },
    });

    await Promise.all(
      matchingSpecialists.map((s) =>
        sendNotification({
          userId: s.id,
          type: "new_request_in_city",
          title: "Новый запрос по вашему отделению ФНС",
          body: title.slice(0, 200),
          entityId: requestId,
        }).catch((err: Error) =>
          console.error("[notifications] new_request_in_city fan-out failed:", err.message)
        )
      )
    );

    return matchingSpecialists.length;
  } catch (err) {
    console.error("[notifications] fan-out query failed:", (err as Error).message);
    return 0;
  }
}

const createRequestRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Слишком много запросов. Попробуйте через минуту." },
});

// GET /api/requests/public — active requests feed
router.get("/public", async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const cityId = (req.query.city_id as string) || undefined;
    const fnsId = (req.query.fns_id as string) || undefined;

    // Optional auth — used to filter the caller's own requests out
    // of the public catalog (no point showing yourself your own
    // request, you have /my-requests for that).
    let callerId: string | null = null;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      try {
        callerId = verifyAccessToken(authHeader.slice(7)).userId;
      } catch {
        // ignore — public endpoint, anon is fine
      }
    }

    const where: Prisma.RequestWhereInput = {
      status: { in: ["ACTIVE", "CLOSING_SOON"] },
      isPublic: true,
    };

    if (cityId) where.cityId = cityId;
    if (fnsId) where.fnsId = fnsId;
    if (callerId) where.userId = { not: callerId };

    // Exclude QA/dev seed rows from the public feed.
    const seedWhere = notSeedRequestWhere();
    if (seedWhere) {
      where.AND = where.AND
        ? Array.isArray(where.AND)
          ? [...where.AND, seedWhere]
          : [where.AND, seedWhere]
        : [seedWhere];
    }

    const [items, total] = await Promise.all([
      prisma.request.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          city: true,
          fns: true,
          user: { select: { firstName: true, lastName: true, avatarUrl: true, createdAt: true } },
          _count: { select: { threads: true, files: true } },
        },
      }),
      prisma.request.count({ where }),
    ]);

    const mapped = await Promise.all(
      items.map(async (r) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        status: r.status,
        isPublic: r.isPublic,
        createdAt: r.createdAt,
        city: { id: r.city.id, name: r.city.name },
        fns: { id: r.fns.id, name: r.fns.name, code: r.fns.code },
        threadsCount: r._count.threads,
        hasFiles: r._count.files > 0,
        filesCount: r._count.files,
        user: {
          firstName: r.user.firstName,
          lastName: r.user.lastName,
          // Presign — the DB stores a storage key like "avatars/uuid.jpg"
          // which the FE can't render as <Image src> without signing.
          avatarUrl: await presignAvatarUrl(r.user.avatarUrl).catch(() => null),
          memberSince: r.user.createdAt.getFullYear(),
        },
      }))
    );

    res.json({
      items: mapped,
      total,
      page,
      limit,
      hasMore: skip + limit < total,
    });
  } catch (error) {
    console.error("requests/public error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/requests/sample — dev helper: first request ID for metromap URL resolver
// SECURITY: dev/tooling helper — returns minimal data (id only), intentionally public for metromap
router.get("/sample", async (_req: Request, res: Response) => {
  try {
    const first = await prisma.request.findFirst({
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
    res.json({ items: first ? [{ id: first.id }] : [] });
  } catch (error) {
    console.error("requests/sample error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/requests/:id/public — single request detail (public, optional auth)
router.get("/:id/public", async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    // Resolve optional caller identity (specialist check for existing thread)
    let callerId: string | null = null;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const payload = verifyAccessToken(authHeader.slice(7));
        callerId = payload.userId;
      } catch {
        // ignore invalid tokens — public route, auth is optional
      }
    }

    const result = await prisma.request.findUnique({
      where: { id },
      include: {
        city: true,
        fns: true,
        user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        files: {
          select: { id: true, url: true, filename: true, size: true, mimeType: true },
        },
        _count: { select: { threads: true } },
      },
    });

    if (!result) {
      res.status(404).json({ error: "Request not found" });
      return;
    }

    // Anon visibility gate: only the request owner sees a non-public
    // request via this route. The /detail endpoint (auth required)
    // covers the owner's own non-public view. Strangers querying a
    // private request through /public get a 404.
    if (!result.isPublic && callerId !== result.userId) {
      res.status(404).json({ error: "Request not found" });
      return;
    }

    // Check if caller already has an existing thread on this request (specialist flow)
    let hasExistingThread = false;
    let existingThreadId: string | null = null;
    if (callerId && callerId !== result.userId) {
      const thread = await prisma.thread.findFirst({
        where: { requestId: id, specialistId: callerId },
        select: { id: true },
      });
      if (thread) {
        hasExistingThread = true;
        existingThreadId = thread.id;
      }
    }

    // Mask the author's last name to a single initial so we don't leak
    // a full name to anonymous viewers. Owner gets the full name back
    // via the /detail endpoint.
    const lastNameInitial = result.user.lastName ? `${result.user.lastName[0]}.` : null;

    res.json({
      id: result.id,
      title: result.title,
      description: result.description,
      status: result.status,
      isPublic: result.isPublic,
      createdAt: result.createdAt,
      lastActivityAt: result.lastActivityAt,
      city: { id: result.city.id, name: result.city.name },
      fns: { id: result.fns.id, name: result.fns.name, code: result.fns.code },
      user: {
        id: result.user.id,
        firstName: result.user.firstName,
        lastName: lastNameInitial,
        // Storage key → presigned URL so <Image> renders directly.
        avatarUrl: await presignAvatarUrl(result.user.avatarUrl).catch(() => null),
      },
      // Presign every attachment URL inline so anon visitors can
      // download without going through /api/upload/signed-url
      // (auth-only). External http(s) URLs (seed data) pass through.
      files: await Promise.all(
        result.files.map(async (f) => {
          let url = f.url;
          if (!/^https?:\/\//i.test(url)) {
            const cleaned = url.replace(/^\/+/, "");
            const prefix = `${MINIO_BUCKET}/`;
            const key = cleaned.startsWith(prefix)
              ? cleaned.slice(prefix.length)
              : cleaned;
            try {
              url = await minioClient.presignedGetObject(MINIO_BUCKET, key, 60 * 60);
            } catch {
              // Fall through to raw stored URL.
            }
          }
          return {
            id: f.id,
            url,
            filename: f.filename,
            size: f.size,
            mimeType: f.mimeType,
          };
        })
      ),
      threadsCount: result._count.threads,
      hasExistingThread,
      existingThreadId,
    });
  } catch (error) {
    console.error("requests/:id/public error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/requests/public — quick request from landing (auth required)
router.post("/public", authMiddleware, createRequestRateLimiter, async (req: Request, res: Response) => {
  try {
    const { title, cityId, fnsId, description, isPublic } = req.body;
    const userId = req.user!.userId;

    if (!title || !cityId || !fnsId || !description) {
      res.status(400).json({
        error: "Title, city, FNS office, and description are required",
      });
      return;
    }

    // Verify city and FNS exist
    const fns = await prisma.fnsOffice.findFirst({
      where: { id: fnsId, cityId },
    });

    if (!fns) {
      res.status(400).json({ error: "Invalid city or FNS office" });
      return;
    }

    const request = await prisma.request.create({
      data: {
        title: stripHtml(title),
        cityId,
        fnsId,
        description: stripHtml(description),
        userId,
        isPublic: typeof isPublic === "boolean" ? isPublic : true,
      },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
      },
    });

    // Fire-and-forget: notify matching specialists. Never blocks the response.
    void notifyMatchingSpecialists({
      requestId: request.id,
      fnsId,
      title: request.title,
      clientUserId: userId,
    });

    res.status(201).json(request);
  } catch (error) {
    console.error("requests/public create error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── AUTHENTICATED CLIENT ROUTES ────────────────────────────────────

// GET /api/requests/my — own requests (auth required)
router.get("/my", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 50));
    const offset = Math.max(0, parseInt(req.query.offset as string) || 0);

    const [items, total] = await Promise.all([
      prisma.request.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
        include: {
          city: true,
          fns: true,
          user: { select: { firstName: true, lastName: true, avatarUrl: true } },
          _count: { select: { threads: true, files: true } },
        },
      }),
      prisma.request.count({ where: { userId } }),
    ]);

    const mapped = items.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      status: r.status,
      createdAt: r.createdAt,
      lastActivityAt: r.lastActivityAt,
      extensionsCount: r.extensionsCount,
      city: { id: r.city.id, name: r.city.name },
      fns: { id: r.fns.id, name: r.fns.name, code: r.fns.code },
      threadsCount: r._count.threads,
      hasFiles: r._count.files > 0,
      filesCount: r._count.files,
      user: {
        firstName: r.user.firstName,
        lastName: r.user.lastName,
      },
    }));

    res.json({ items: mapped, total, limit, offset, hasMore: offset + limit < total });
  } catch (error) {
    console.error("requests/my error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/requests — create request (auth required, client)
router.post("/", authMiddleware, createRequestRateLimiter, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { title, cityId, fnsId, description, fileIds, pendingFileSessionId, isPublic } = req.body;

    // Validate
    if (!title || title.length < 3 || title.length > 100) {
      res.status(400).json({ error: "Title must be 3-100 characters" });
      return;
    }
    if (!cityId || !fnsId) {
      res.status(400).json({ error: "City and FNS office are required" });
      return;
    }
    if (!description || description.length < 10 || description.length > 5000) {
      res.status(400).json({ error: "Description must be 10-5000 characters" });
      return;
    }

    // Check limit
    const limitSetting = await prisma.setting.findUnique({
      where: { key: "requests_limit" },
    });
    // Default raised from 5 → 20. A user can have several open issues
    // legitimately (different ИФНС, different periods); 5 was bumping
    // real flows. Still high enough to cap obvious abuse.
    const requestsLimit = limitSetting ? parseInt(limitSetting.value, 10) : 20;

    const activeCount = await prisma.request.count({
      where: {
        userId,
        status: { in: ["ACTIVE", "CLOSING_SOON"] },
      },
    });

    if (activeCount >= requestsLimit) {
      res.status(400).json({
        error: `У вас уже ${activeCount} активных запросов (лимит ${requestsLimit}). Закройте старые в «Мои запросы», чтобы создать новый.`,
      });
      return;
    }

    // Verify FNS belongs to city
    const fns = await prisma.fnsOffice.findFirst({
      where: { id: fnsId, cityId },
    });
    if (!fns) {
      res.status(400).json({ error: "Invalid city or FNS office" });
      return;
    }

    const request = await prisma.request.create({
      data: {
        title: stripHtml(title),
        cityId,
        fnsId,
        description: stripHtml(description),
        userId,
        isPublic: typeof isPublic === "boolean" ? isPublic : true,
      },
      include: {
        city: true,
        fns: true,
      },
    });

    // Link files if provided (authenticated path: file ids issued by
    // /api/upload/documents).
    if (fileIds && Array.isArray(fileIds) && fileIds.length > 0) {
      await prisma.file.updateMany({
        where: { id: { in: fileIds } },
        data: { requestId: request.id, entityType: "request", entityId: request.id },
      });
    }

    // Claim anonymous-session uploads. Anonymous visitors uploaded files
    // before signing in; now that the OTP completed and they have a userId,
    // bind those files to this request and clear the TTL so the cleanup
    // job no longer deletes them.
    if (typeof pendingFileSessionId === "string" && pendingFileSessionId.length >= 16) {
      await prisma.file.updateMany({
        where: { sessionId: pendingFileSessionId, requestId: null },
        data: {
          requestId: request.id,
          entityType: "request",
          entityId: request.id,
          sessionId: null,
          expiresAt: null,
        },
      });
    }

    // Fire-and-forget: notify matching specialists. Never blocks the response.
    void notifyMatchingSpecialists({
      requestId: request.id,
      fnsId: request.fnsId,
      title: request.title,
      clientUserId: userId,
    });

    res.status(201).json({
      id: request.id,
      title: request.title,
      description: request.description,
      status: request.status,
      isPublic: request.isPublic,
      createdAt: request.createdAt,
      city: { id: request.city.id, name: request.city.name },
      fns: { id: request.fns.id, name: request.fns.name, code: request.fns.code },
    });
  } catch (error) {
    console.error("requests create error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/requests/:id — fetch request by id, then check ownership (404 before 403)
router.get("/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;

    const request = await prisma.request.findUnique({
      where: { id },
      select: { id: true, userId: true, title: true, status: true },
    });

    if (!request) {
      res.status(404).json({ error: "Запрос не найден" });
      return;
    }

    if (request.userId !== userId) {
      res.status(403).json({ error: "Нет доступа" });
      return;
    }

    res.json({ id: request.id, title: request.title, status: request.status });
  } catch (error) {
    console.error("requests/:id error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/requests/:id/detail — request detail (auth required)
// Returns owner view (full data + threads) or specialist view (preview + respond CTA).
// GET /api/requests/:id/files.zip — stream all files attached to a request
// as a single ZIP. Auth required. Available to the request owner and to
// specialists who have an active thread on the request (server checks).
router.get("/:id/files.zip", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const id = String(req.params.id);

    const request = await prisma.request.findUnique({
      where: { id },
      include: {
        files: { select: { id: true, url: true, filename: true } },
      },
    });
    if (!request) {
      res.status(404).json({ error: "Request not found" });
      return;
    }

    // Authorization: owner OR a specialist who's been let into a thread.
    const isOwner = request.userId === userId;
    let allowed = isOwner;
    if (!allowed) {
      const threadCount = await prisma.thread.count({
        where: { requestId: id, specialistId: userId },
      });
      allowed = threadCount > 0;
    }
    if (!allowed) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    if (request.files.length === 0) {
      res.status(404).json({ error: "No files attached" });
      return;
    }

    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="request-${id}-files.zip"`
    );

    const archive = archiver("zip", { zlib: { level: 6 } });
    archive.on("error", (err) => {
      console.error("zip stream error:", err);
      try { res.status(500).end(); } catch { /* already streaming */ }
    });
    archive.pipe(res);

    // Append each file. External URLs (seed data) are skipped — only files
    // stored in MinIO under /<bucket>/... can actually be streamed back.
    for (const f of request.files) {
      try {
        if (/^https?:\/\//.test(f.url)) {
          // External URL — skip (cannot stream remote without extra fetch)
          continue;
        }
        const m = f.url.match(/^\/[^/]+\/(.+)$/);
        const key = m ? m[1] : null;
        if (!key) continue;
        const stream = await minioClient.getObject(MINIO_BUCKET, key);
        archive.append(stream, { name: f.filename || `file-${f.id}` });
      } catch (e) {
        console.warn("zip skip file", f.id, (e as Error).message);
      }
    }

    await archive.finalize();
  } catch (error) {
    console.error("files.zip error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

router.get("/:id/detail", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;

    const request = await prisma.request.findUnique({
      where: { id },
      include: {
        city: true,
        fns: true,
        files: true,
        user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, isSpecialist: true } },
        _count: { select: { threads: true } },
      },
    });

    if (!request) {
      res.status(404).json({ error: "Request not found" });
      return;
    }

    const isOwner = request.userId === userId;

    // Check if caller is a specialist to determine view shape (#P1)
    const callerUser = !isOwner
      ? await prisma.user.findUnique({ where: { id: userId }, select: { isSpecialist: true } })
      : null;
    const isSpecialist = callerUser?.isSpecialist ?? false;

    if (isOwner) {
      // Owner view: full detail + threads list + unread count

      // Count unread messages across threads
      const threads = await prisma.thread.findMany({
        where: { requestId: id, clientId: userId },
        select: {
          id: true,
          clientLastReadAt: true,
        },
      });

      // Batch unread count: one query per group (has lastReadAt vs no lastReadAt)
      let unreadMessages = 0;
      if (threads.length > 0) {
        const threadsWithReadAt = threads.filter((t) => t.clientLastReadAt);
        const threadsWithoutReadAt = threads.filter((t) => !t.clientLastReadAt);

        const counts = await Promise.all([
          // Threads where client has read — count messages after lastReadAt
          ...(threadsWithReadAt.length > 0
            ? threadsWithReadAt.map((t) =>
                prisma.message.count({
                  where: {
                    threadId: t.id,
                    createdAt: { gt: t.clientLastReadAt! },
                    senderId: { not: userId },
                  },
                })
              )
            : []),
          // Threads never read — count all messages from others
          ...(threadsWithoutReadAt.length > 0
            ? [
                prisma.message.count({
                  where: {
                    threadId: { in: threadsWithoutReadAt.map((t) => t.id) },
                    senderId: { not: userId },
                  },
                }),
              ]
            : []),
        ]);

        const withoutIdx = threadsWithReadAt.length;
        unreadMessages = counts.slice(0, withoutIdx).reduce((s, c) => s + c, 0);
        if (threadsWithoutReadAt.length > 0) {
          unreadMessages += counts[withoutIdx];
        }
      }

      // Get max extensions from settings
      const extSetting = await prisma.setting.findUnique({
        where: { key: "max_extensions" },
      });
      const maxExtensions = extSetting ? parseInt(extSetting.value, 10) : 3;

      res.json({
        viewType: "owner" as const,
        id: request.id,
        title: request.title,
        description: request.description,
        status: request.status,
        createdAt: request.createdAt,
        lastActivityAt: request.lastActivityAt,
        extensionsCount: request.extensionsCount,
        maxExtensions,
        city: { id: request.city.id, name: request.city.name },
        fns: { id: request.fns.id, name: request.fns.name, code: request.fns.code },
        service: null,
        files: request.files.map((f) => ({
          id: f.id,
          url: f.url,
          filename: f.filename,
          size: f.size,
          mimeType: f.mimeType,
        })),
        threadsCount: request._count.threads,
        unreadMessages,
        // owner-only fields
        isOwner: true,
        hasExistingThread: false,
        existingThreadId: null,
        client: null,
      });
    } else if (isSpecialist) {
      // Specialist view: check for existing thread with this request
      const existingThread = await prisma.thread.findFirst({
        where: { requestId: id, specialistId: userId },
        select: { id: true },
      });

      // Mask client name: firstName + lastName[0] + "."
      const clientName = [
        request.user.firstName,
        request.user.lastName ? request.user.lastName[0] + "." : null,
      ]
        .filter(Boolean)
        .join(" ") || "Клиент";

      res.json({
        viewType: "specialist" as const,
        id: request.id,
        title: request.title,
        description: request.description,
        status: request.status,
        createdAt: request.createdAt,
        lastActivityAt: request.lastActivityAt,
        extensionsCount: request.extensionsCount,
        maxExtensions: 0,
        city: { id: request.city.id, name: request.city.name },
        fns: { id: request.fns.id, name: request.fns.name, code: request.fns.code },
        service: null,
        files: request.files.map((f) => ({
          id: f.id,
          url: f.url,
          filename: f.filename,
          size: f.size,
          mimeType: f.mimeType,
        })),
        threadsCount: request._count.threads,
        unreadMessages: 0,
        // specialist-only fields
        isOwner: false,
        hasExistingThread: !!existingThread,
        existingThreadId: existingThread?.id ?? null,
        client: {
          id: request.user.id,
          name: clientName,
          avatarUrl: await presignAvatarUrl(request.user.avatarUrl).catch(() => null),
          isSpecialist: request.user.isSpecialist === true,
        },
      });
    } else {
      // Public/client view: authenticated non-owner non-specialist — strip private fields
      // TODO: frontend should check viewType==='public' and render read-only variant
      res.json({
        viewType: "public" as const,
        id: request.id,
        title: request.title,
        description: request.description,
        status: request.status,
        createdAt: request.createdAt,
        city: { id: request.city.id, name: request.city.name },
        fns: { id: request.fns.id, name: request.fns.name, code: request.fns.code },
        isOwner: false,
        hasExistingThread: false,
        existingThreadId: null,
        client: null,
        files: [],
        threadsCount: request._count.threads,
        unreadMessages: 0,
      });
    }
  } catch (error) {
    console.error("requests/:id/detail error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/requests/:id — update own request (auth required)
// Only whitelisted fields: title, description. Unknown fields are rejected.
router.patch("/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;

    // Whitelist: title, description, isPublic are editable
    const ALLOWED_KEYS = ["title", "description", "isPublic"];
    const bodyKeys = Object.keys(req.body);
    const unknownKeys = bodyKeys.filter((k) => !ALLOWED_KEYS.includes(k));
    if (unknownKeys.length > 0) {
      res.status(400).json({ error: `Unknown fields: ${unknownKeys.join(", ")}` });
      return;
    }

    const { title, description, isPublic } = req.body;

    // At least one field must be provided
    if (title === undefined && description === undefined && isPublic === undefined) {
      res.status(400).json({ error: "At least one field (title, description, or isPublic) is required" });
      return;
    }

    // Validate title if provided
    if (title !== undefined) {
      if (typeof title !== "string" || title.length < 3 || title.length > 100) {
        res.status(400).json({ error: "Title must be 3-100 characters" });
        return;
      }
    }

    // Validate description if provided
    if (description !== undefined) {
      if (typeof description !== "string" || description.length < 10 || description.length > 5000) {
        res.status(400).json({ error: "Description must be 10-5000 characters" });
        return;
      }
    }

    // Validate isPublic if provided
    if (isPublic !== undefined && typeof isPublic !== "boolean") {
      res.status(400).json({ error: "isPublic must be a boolean" });
      return;
    }

    const request = await prisma.request.findUnique({ where: { id } });

    if (!request) {
      res.status(404).json({ error: "Request not found" });
      return;
    }

    if (request.userId !== userId) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    if (request.status === "CLOSED") {
      res.status(400).json({ error: "Cannot edit a closed request" });
      return;
    }

    const data: Record<string, unknown> = {};
    if (title !== undefined) data.title = stripHtml(title);
    if (description !== undefined) data.description = stripHtml(description);
    if (isPublic !== undefined) data.isPublic = isPublic;

    const updated = await prisma.request.update({
      where: { id },
      data,
      select: { id: true, title: true, description: true, status: true, isPublic: true },
    });

    res.json(updated);
  } catch (error) {
    console.error("requests/:id patch error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/requests/:id — delete own request (auth required)
router.delete("/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;

    const request = await prisma.request.findUnique({ where: { id } });

    if (!request) {
      res.status(404).json({ error: "Request not found" });
      return;
    }

    if (request.userId !== userId) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    await prisma.request.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error("requests delete error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/requests/:id/status — change own request status (auth required)
// Supports: CLOSED (close), ACTIVE (reopen)
router.patch("/:id/status", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;
    const { status } = req.body;

    const ALLOWED_STATUSES = ["ACTIVE", "CLOSED"];
    if (!ALLOWED_STATUSES.includes(status)) {
      res.status(400).json({ error: "Status must be ACTIVE or CLOSED" });
      return;
    }

    const request = await prisma.request.findUnique({ where: { id } });

    if (!request) {
      res.status(404).json({ error: "Request not found" });
      return;
    }

    if (request.userId !== userId) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    if (request.status === status) {
      res.status(400).json({ error: `Request is already ${status}` });
      return;
    }

    // Reopen: set back to ACTIVE
    const newStatus = status as "ACTIVE" | "CLOSED";

    const updated = await prisma.request.update({
      where: { id },
      data: { status: newStatus },
    });

    res.json({ id: updated.id, status: updated.status });
  } catch (error) {
    console.error("requests status error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/requests/:id/extend — extend request (auth required)
router.post("/:id/extend", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;

    const request = await prisma.request.findUnique({ where: { id } });

    if (!request) {
      res.status(404).json({ error: "Request not found" });
      return;
    }

    if (request.userId !== userId) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    // Get max extensions
    const extSetting = await prisma.setting.findUnique({
      where: { key: "max_extensions" },
    });
    const maxExtensions = extSetting ? parseInt(extSetting.value, 10) : 3;

    if (request.extensionsCount >= maxExtensions) {
      res.status(400).json({ error: "Maximum extensions reached" });
      return;
    }

    if (request.status === "CLOSED") {
      res.status(400).json({ error: "Cannot extend closed request" });
      return;
    }

    const updated = await prisma.request.update({
      where: { id },
      data: {
        extensionsCount: { increment: 1 },
        status: "ACTIVE",
        lastActivityAt: new Date(),
      },
    });

    res.json({
      id: updated.id,
      extensionsCount: updated.extensionsCount,
      status: updated.status,
    });
  } catch (error) {
    console.error("requests extend error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/requests/:id/recommendations — matching specialists (auth required, client owner)
// Filters: matching FNS, available, not banned, NO existing thread with current user
// (for any request — issue #1550 wants to surface only "fresh" specialists).
router.get("/:id/recommendations", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;

    const request = await prisma.request.findUnique({
      where: { id },
      select: { userId: true, fnsId: true, cityId: true },
    });

    if (!request) {
      res.status(404).json({ error: "Request not found" });
      return;
    }

    if (request.userId !== userId) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    // Specialists with whom the current client already has a thread —
    // exclude from recommendations (issue #1550: only surface fresh specialists).
    const existingThreads = await prisma.thread.findMany({
      where: { clientId: userId },
      select: { specialistId: true },
    });
    const excludedSpecialistIds = Array.from(
      new Set(existingThreads.map((t) => t.specialistId))
    );
    // Also exclude self (in case the client is also a specialist).
    excludedSpecialistIds.push(userId);

    // Find available specialists who cover this FNS — filter at DB level
    const specialistFnsList = await prisma.specialistFns.findMany({
      where: {
        fnsId: request.fnsId,
        specialistId: { notIn: excludedSpecialistIds },
        specialist: { isAvailable: true, isBanned: false },
      },
      take: 12,
      include: {
        specialist: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            specialistProfile: {
              select: { description: true },
            },
            specialistServices: {
              where: { fnsId: request.fnsId },
              include: { service: { select: { id: true, name: true } } },
            },
          },
        },
      },
    });

    const specialists = specialistFnsList.map((sf) => ({
      id: sf.specialist.id,
      firstName: sf.specialist.firstName,
      lastName: sf.specialist.lastName,
      avatarUrl: sf.specialist.avatarUrl,
      description: sf.specialist.specialistProfile?.description ?? null,
      services: sf.specialist.specialistServices.map((ss) => ss.service.name),
    }));

    res.json({ items: specialists });
  } catch (error) {
    console.error("requests/:id/recommendations error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
