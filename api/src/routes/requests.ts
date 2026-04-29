import { Router, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { prisma } from "../lib/prisma";
import { Prisma } from "@prisma/client";
import { authMiddleware } from "../middleware/auth";
import { verifyAccessToken } from "../lib/jwt";
import { sendNotification } from "../notifications/notification.service";

// Strip all HTML tags to prevent XSS
function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, "").trim();
}

const router = Router();

/**
 * Fan-out: notify every specialist whose FNS coverage matches this request's
 * FNS. Side-effect only — never crashes the request flow.
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
          title: "Новая заявка по вашему отделению ФНС",
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

    const where: Prisma.RequestWhereInput = {
      status: { in: ["ACTIVE", "CLOSING_SOON"] },
    };

    if (cityId) where.cityId = cityId;
    if (fnsId) where.fnsId = fnsId;

    const [items, total] = await Promise.all([
      prisma.request.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          city: true,
          fns: true,
          _count: { select: { threads: true } },
        },
      }),
      prisma.request.count({ where }),
    ]);

    const mapped = items.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      status: r.status,
      createdAt: r.createdAt,
      city: { id: r.city.id, name: r.city.name },
      fns: { id: r.fns.id, name: r.fns.name, code: r.fns.code },
      threadsCount: r._count.threads,
    }));

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
        _count: { select: { threads: true } },
      },
    });

    if (!result) {
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

    res.json({
      id: result.id,
      title: result.title,
      description: result.description,
      status: result.status,
      createdAt: result.createdAt,
      lastActivityAt: result.lastActivityAt,
      city: { id: result.city.id, name: result.city.name },
      fns: { id: result.fns.id, name: result.fns.name, code: result.fns.code },
      user: {
        id: result.user.id,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        avatarUrl: result.user.avatarUrl,
      },
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
    const { title, cityId, fnsId, description } = req.body;
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
          _count: { select: { threads: true } },
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
    const { title, cityId, fnsId, description, fileIds } = req.body;

    // Validate
    if (!title || title.length < 3 || title.length > 100) {
      res.status(400).json({ error: "Title must be 3-100 characters" });
      return;
    }
    if (!cityId || !fnsId) {
      res.status(400).json({ error: "City and FNS office are required" });
      return;
    }
    if (!description || description.length < 10 || description.length > 2000) {
      res.status(400).json({ error: "Description must be 10-2000 characters" });
      return;
    }

    // Check limit
    const limitSetting = await prisma.setting.findUnique({
      where: { key: "requests_limit" },
    });
    const requestsLimit = limitSetting ? parseInt(limitSetting.value, 10) : 5;

    const activeCount = await prisma.request.count({
      where: {
        userId,
        status: { in: ["ACTIVE", "CLOSING_SOON"] },
      },
    });

    if (activeCount >= requestsLimit) {
      res.status(400).json({ error: "Request limit reached" });
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
      },
      include: {
        city: true,
        fns: true,
      },
    });

    // Link files if provided
    if (fileIds && Array.isArray(fileIds) && fileIds.length > 0) {
      await prisma.file.updateMany({
        where: { id: { in: fileIds } },
        data: { requestId: request.id, entityType: "request", entityId: request.id },
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
      res.status(404).json({ error: "Заявка не найдена" });
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

// GET /api/requests/:id/detail — own request detail (auth required)
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
        _count: { select: { threads: true } },
      },
    });

    if (!request) {
      res.status(404).json({ error: "Request not found" });
      return;
    }

    if (request.userId !== userId) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

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
    const threadIds = threads.map((t) => t.id);
    if (threadIds.length > 0) {
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
      files: request.files.map((f) => ({
        id: f.id,
        url: f.url,
        filename: f.filename,
        size: f.size,
        mimeType: f.mimeType,
      })),
      threadsCount: request._count.threads,
      unreadMessages,
    });
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

    // Whitelist: only title and description are editable
    const ALLOWED_KEYS = ["title", "description"];
    const bodyKeys = Object.keys(req.body);
    const unknownKeys = bodyKeys.filter((k) => !ALLOWED_KEYS.includes(k));
    if (unknownKeys.length > 0) {
      res.status(400).json({ error: `Unknown fields: ${unknownKeys.join(", ")}` });
      return;
    }

    const { title, description } = req.body;

    // At least one field must be provided
    if (title === undefined && description === undefined) {
      res.status(400).json({ error: "At least one field (title or description) is required" });
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
      if (typeof description !== "string" || description.length < 10 || description.length > 2000) {
        res.status(400).json({ error: "Description must be 10-2000 characters" });
        return;
      }
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

    const updated = await prisma.request.update({
      where: { id },
      data,
      select: { id: true, title: true, description: true, status: true },
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

// PATCH /api/requests/:id/status — close own request (auth required)
router.patch("/:id/status", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;
    const { status } = req.body;

    if (status !== "CLOSED") {
      res.status(400).json({ error: "Can only close requests" });
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
      res.status(400).json({ error: "Request already closed" });
      return;
    }

    const updated = await prisma.request.update({
      where: { id },
      data: { status: "CLOSED" },
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

    // Find available specialists who cover this FNS — filter at DB level
    const specialistFnsList = await prisma.specialistFns.findMany({
      where: {
        fnsId: request.fnsId,
        specialist: { isAvailable: true, isBanned: false },
      },
      take: 3,
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
