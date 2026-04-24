import { Router, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";
import { roleGuard } from "../middleware/auth";
import { normalizeSlug } from "../lib/slug";

const router = Router();

// All admin routes require auth + ADMIN role
router.use(authMiddleware);
router.use(roleGuard("ADMIN"));

// GET /api/admin/stats
router.get("/stats", async (_req: Request, res: Response) => {
  try {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Active requests count
    const activeRequests = await prisma.request.count({
      where: { status: { in: ["ACTIVE", "CLOSING_SOON"] } },
    });

    // New users week/month
    const newUsersWeek = await prisma.user.count({
      where: { createdAt: { gte: weekAgo } },
    });
    const newUsersMonth = await prisma.user.count({
      where: { createdAt: { gte: monthAgo } },
    });

    // Threads (dialogs) week/month
    const threadsWeek = await prisma.thread.count({
      where: { createdAt: { gte: weekAgo } },
    });
    const threadsMonth = await prisma.thread.count({
      where: { createdAt: { gte: monthAgo } },
    });

    // Conversion: requests with at least one thread / total requests
    const totalRequests = await prisma.request.count();
    const requestsWithThreads = await prisma.request.count({
      where: { threads: { some: {} } },
    });
    const conversion =
      totalRequests > 0
        ? Math.round((requestsWithThreads / totalRequests) * 100)
        : 0;

    // Top cities by active requests
    const topCities = await prisma.request.groupBy({
      by: ["cityId"],
      where: { status: { in: ["ACTIVE", "CLOSING_SOON"] } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 50,
    });

    const cityIds = topCities.map((c) => c.cityId);
    const cities = await prisma.city.findMany({
      where: { id: { in: cityIds } },
      select: { id: true, name: true },
    });
    const cityMap = new Map(cities.map((c) => [c.id, c.name]));

    const topCitiesResult = topCities.map((c) => ({
      name: cityMap.get(c.cityId) || "Unknown",
      count: c._count.id,
    }));

    // Top 5 specialists by thread count
    const topSpecialists = await prisma.thread.groupBy({
      by: ["specialistId"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    });

    const specIds = topSpecialists.map((s) => s.specialistId);
    const specs = await prisma.user.findMany({
      where: { id: { in: specIds } },
      select: { id: true, firstName: true, lastName: true, email: true },
    });
    const specMap = new Map(specs.map((s) => [s.id, s]));

    const topSpecialistsResult = topSpecialists.map((s) => {
      const spec = specMap.get(s.specialistId);
      const name = spec
        ? [spec.firstName, spec.lastName].filter(Boolean).join(" ") ||
          spec.email
        : "Unknown";
      return { name, count: s._count.id };
    });

    res.json({
      activeRequests,
      newUsersWeek,
      newUsersMonth,
      threadsWeek,
      threadsMonth,
      conversion,
      topCities: topCitiesResult,
      topSpecialists: topSpecialistsResult,
    });
  } catch (error) {
    console.error("admin/stats error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/admin/users
router.get("/users", async (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string) || "";
    const role = req.query.role as string | undefined;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (q) {
      where.OR = [
        { email: { contains: q, mode: "insensitive" } },
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
      ];
    }

    if (role === "CLIENT" || role === "SPECIALIST" || role === "ADMIN") {
      where.role = role;
    } else if (role === "BANNED") {
      where.isBanned = true;
    }

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isBanned: true,
          createdAt: true,
          avatarUrl: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      items,
      total,
      page,
      limit,
      hasMore: skip + items.length < total,
    });
  } catch (error) {
    console.error("admin/users error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/admin/users/:id
router.patch("/users/:id", async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { isBanned, firstName, lastName, role } = req.body;

    // Self-block protection: admin cannot block their own account
    if (isBanned === true && req.user?.userId === id) {
      res.status(400).json({ error: "Нельзя заблокировать собственный аккаунт" });
      return;
    }

    // Validate isBanned type if provided
    if ("isBanned" in req.body && typeof isBanned !== "boolean") {
      res.status(400).json({ error: "isBanned must be a boolean" });
      return;
    }

    // Check user exists before update to avoid leaking P2025
    const existing = await prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const data: Record<string, unknown> = {};
    if (typeof isBanned === "boolean") data.isBanned = isBanned;
    if (typeof firstName === "string") data.firstName = firstName;
    if (typeof lastName === "string") data.lastName = lastName;
    if (role === "CLIENT" || role === "SPECIALIST" || role === "ADMIN") {
      data.role = role;
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isBanned: true,
        createdAt: true,
        avatarUrl: true,
      },
    });

    res.json(user);
  } catch (error) {
    console.error("admin/users/:id patch error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/admin/users/:id/close-all-requests
router.post(
  "/users/:id/close-all-requests",
  async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;

      const result = await prisma.request.updateMany({
        where: {
          userId: id,
          status: { in: ["ACTIVE", "CLOSING_SOON"] },
        },
        data: { status: "CLOSED" },
      });

      res.json({ closed: result.count });
    } catch (error) {
      console.error("admin/users/:id/close-all-requests error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// ─── Cities CRUD ────────────────────────────────────────────────────────────

// GET /api/admin/cities
router.get("/cities", async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.city.findMany({
        orderBy: { name: "asc" },
        skip,
        take: limit,
        include: { _count: { select: { fnsOffices: true } } },
      }),
      prisma.city.count(),
    ]);

    res.json({
      items: items.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        officesCount: c._count.fnsOffices,
      })),
      total,
      page,
      limit,
      hasMore: skip + items.length < total,
    });
  } catch (error) {
    console.error("admin/cities error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/admin/cities
router.post("/cities", async (req: Request, res: Response) => {
  try {
    const { name, slug } = req.body as { name?: string; slug?: string };
    if (!name || !slug) {
      res.status(400).json({ error: "name and slug are required" });
      return;
    }
    const normalizedSlug = normalizeSlug(slug);
    if (!normalizedSlug) {
      res.status(400).json({ error: "slug is invalid after normalization" });
      return;
    }
    const city = await prisma.city.create({ data: { name, slug: normalizedSlug } });
    res.status(201).json(city);
  } catch (error: unknown) {
    const e = error as { code?: string };
    if (e.code === "P2002") {
      res.status(409).json({ error: "City with this slug already exists" });
      return;
    }
    console.error("admin/cities POST error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/admin/cities/:id
router.patch("/cities/:id", async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { name, slug } = req.body as { name?: string; slug?: string };
    const data: Prisma.CityUpdateInput = {};
    if (name) data.name = name;
    if (slug) {
      const normalizedSlug = normalizeSlug(slug);
      if (!normalizedSlug) {
        res.status(400).json({ error: "slug is invalid after normalization" });
        return;
      }
      data.slug = normalizedSlug;
    }

    const city = await prisma.city.update({ where: { id }, data });
    res.json(city);
  } catch (error: unknown) {
    const e = error as { code?: string };
    if (e.code === "P2025") {
      res.status(404).json({ error: "City not found" });
      return;
    }
    if (e.code === "P2002") {
      res.status(409).json({ error: "Slug already in use" });
      return;
    }
    console.error("admin/cities/:id PATCH error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/admin/cities/:id — guard: no IFNS offices attached
router.delete("/cities/:id", async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const officesCount = await prisma.fnsOffice.count({ where: { cityId: id } });
    if (officesCount > 0) {
      res.status(409).json({
        error: `Cannot delete city: ${officesCount} IFNS office(s) attached`,
      });
      return;
    }
    await prisma.city.delete({ where: { id } });
    res.json({ ok: true });
  } catch (error: unknown) {
    const e = error as { code?: string };
    if (e.code === "P2025") {
      res.status(404).json({ error: "City not found" });
      return;
    }
    console.error("admin/cities/:id DELETE error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── IFNS CRUD ───────────────────────────────────────────────────────────────

// GET /api/admin/ifns
router.get("/ifns", async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;
    const cityId = req.query.cityId as string | undefined;
    const q = req.query.q as string | undefined;

    const where: Prisma.FnsOfficeWhereInput = {};
    if (cityId) where.cityId = cityId;
    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { code: { contains: q, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.fnsOffice.findMany({
        where,
        orderBy: [{ city: { name: "asc" } }, { name: "asc" }],
        skip,
        take: limit,
        include: { city: { select: { id: true, name: true, slug: true } } },
      }),
      prisma.fnsOffice.count({ where }),
    ]);

    res.json({ items, total, page, limit, hasMore: skip + items.length < total });
  } catch (error) {
    console.error("admin/ifns error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/admin/ifns
router.post("/ifns", async (req: Request, res: Response) => {
  try {
    const { name, code, cityId, address, searchAliases } = req.body as {
      name?: string;
      code?: string;
      cityId?: string;
      address?: string;
      searchAliases?: string;
    };
    if (!name || !code || !cityId) {
      res.status(400).json({ error: "name, code, and cityId are required" });
      return;
    }
    const office = await prisma.fnsOffice.create({
      data: {
        name,
        code,
        cityId,
        address: address ?? null,
        searchAliases: searchAliases ?? null,
      },
      include: { city: { select: { id: true, name: true, slug: true } } },
    });
    res.status(201).json(office);
  } catch (error: unknown) {
    const e = error as { code?: string };
    if (e.code === "P2002") {
      res.status(409).json({ error: "IFNS with this code already exists" });
      return;
    }
    if (e.code === "P2025") {
      res.status(404).json({ error: "City not found" });
      return;
    }
    console.error("admin/ifns POST error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/admin/ifns/:id
router.patch("/ifns/:id", async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { name, code, cityId, address, searchAliases } = req.body as {
      name?: string;
      code?: string;
      cityId?: string;
      address?: string;
      searchAliases?: string;
    };
    const data: Prisma.FnsOfficeUpdateInput = {};
    if (name !== undefined) data.name = name;
    if (code !== undefined) data.code = code;
    if (cityId !== undefined) data.city = { connect: { id: cityId } };
    if (address !== undefined) data.address = address;
    if (searchAliases !== undefined) data.searchAliases = searchAliases;

    const office = await prisma.fnsOffice.update({
      where: { id },
      data,
      include: { city: { select: { id: true, name: true, slug: true } } },
    });
    res.json(office);
  } catch (error: unknown) {
    const e = error as { code?: string };
    if (e.code === "P2025") {
      res.status(404).json({ error: "IFNS office not found" });
      return;
    }
    if (e.code === "P2002") {
      res.status(409).json({ error: "Code already in use" });
      return;
    }
    console.error("admin/ifns/:id PATCH error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/admin/ifns/:id
router.delete("/ifns/:id", async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const [specialistCount, requestCount] = await Promise.all([
      prisma.specialistFns.count({ where: { fnsId: id } }),
      prisma.request.count({ where: { fnsId: id } }),
    ]);
    if (specialistCount > 0 || requestCount > 0) {
      res.status(409).json({
        error: `Cannot delete IFNS: referenced by ${specialistCount} specialist(s) and ${requestCount} request(s)`,
      });
      return;
    }
    await prisma.fnsOffice.delete({ where: { id } });
    res.json({ ok: true });
  } catch (error: unknown) {
    const e = error as { code?: string };
    if (e.code === "P2025") {
      res.status(404).json({ error: "IFNS office not found" });
      return;
    }
    console.error("admin/ifns/:id DELETE error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/admin/ifns/import — bulk JSON import [{code, name, citySlug, address, searchAliases}]
router.post("/ifns/import", async (req: Request, res: Response) => {
  try {
    const items = req.body as {
      code: string;
      name: string;
      citySlug: string;
      address?: string;
      searchAliases?: string;
    }[];

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: "Body must be a non-empty array" });
      return;
    }

    const slugs = [...new Set(items.map((i) => i.citySlug))];
    const cities = await prisma.city.findMany({ where: { slug: { in: slugs } } });
    const cityMap = new Map(cities.map((c) => [c.slug, c.id]));

    const unknownSlugs = slugs.filter((s) => !cityMap.has(s));
    if (unknownSlugs.length > 0) {
      res.status(400).json({ error: `Unknown city slugs: ${unknownSlugs.join(", ")}` });
      return;
    }

    let created = 0;
    let updated = 0;
    const errors: string[] = [];

    for (const item of items) {
      const cityId = cityMap.get(item.citySlug);
      if (!cityId) continue;
      try {
        const existing = await prisma.fnsOffice.findUnique({ where: { code: item.code } });
        if (existing) {
          await prisma.fnsOffice.update({
            where: { code: item.code },
            data: {
              name: item.name,
              cityId,
              address: item.address ?? null,
              searchAliases: item.searchAliases ?? null,
            },
          });
          updated++;
        } else {
          await prisma.fnsOffice.create({
            data: {
              name: item.name,
              code: item.code,
              cityId,
              address: item.address ?? null,
              searchAliases: item.searchAliases ?? null,
            },
          });
          created++;
        }
      } catch {
        errors.push(`Failed to import code ${item.code}`);
      }
    }

    res.json({ created, updated, errors });
  } catch (error) {
    console.error("admin/ifns/import error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Requests (admin view) ───────────────────────────────────────────────────

// GET /api/admin/requests?status=ACTIVE|CLOSING_SOON|CLOSED&page=1&limit=50
router.get("/requests", async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    const q = (req.query.q as string) || "";
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
    const skip = (page - 1) * limit;

    const where: Prisma.RequestWhereInput = {};
    if (status === "ACTIVE" || status === "CLOSING_SOON" || status === "CLOSED") {
      where.status = status;
    }
    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.request.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
          lastActivityAt: true,
          extensionsCount: true,
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
          city: { select: { id: true, name: true } },
          fns: { select: { id: true, name: true, code: true } },
          _count: { select: { threads: true } },
        },
      }),
      prisma.request.count({ where }),
    ]);

    res.json({ items, total, page, limit, hasMore: skip + items.length < total });
  } catch (error) {
    console.error("admin/requests GET error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Specialists (admin view) ─────────────────────────────────────────────────

// GET /api/admin/specialists?q=&page=1&limit=50
router.get("/specialists", async (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string) || "";
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = { role: "SPECIALIST" };
    if (q) {
      where.OR = [
        { email: { contains: q, mode: "insensitive" } },
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          isAvailable: true,
          isBanned: true,
          createdAt: true,
          _count: { select: { specialistFns: true, specialistServices: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ items, total, page, limit, hasMore: skip + items.length < total });
  } catch (error) {
    console.error("admin/specialists GET error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/admin/moderation/queue
router.get("/moderation/queue", async (_req: Request, res: Response) => {
  // MVP: always return empty array
  res.json({ items: [] });
});

// ─── Complaints ──────────────────────────────────────────────────────────────

// GET /api/admin/complaints?status=NEW|REVIEWED&page=1&limit=20
router.get("/complaints", async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status === "NEW" || status === "REVIEWED") {
      where.status = status;
    }

    const [items, total] = await Promise.all([
      prisma.complaint.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          reporter: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
          targetUser: {
            select: { id: true, email: true, firstName: true, lastName: true, role: true },
          },
        },
      }),
      prisma.complaint.count({ where }),
    ]);

    res.json({ items, total, page, limit, hasMore: skip + items.length < total });
  } catch (error) {
    console.error("admin/complaints GET error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/admin/complaints/:id/resolve — mark complaint as resolved by moderator
router.patch("/complaints/:id/resolve", async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const complaint = await prisma.complaint.update({
      where: { id },
      data: { status: "REVIEWED", reviewedAt: new Date() },
      include: {
        reporter: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        targetUser: {
          select: { id: true, email: true, firstName: true, lastName: true, role: true },
        },
      },
    });
    res.json(complaint);
  } catch (error: unknown) {
    const e = error as { code?: string };
    if (e.code === "P2025") {
      res.status(404).json({ error: "Complaint not found" });
      return;
    }
    console.error("admin/complaints/:id/resolve PATCH error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/admin/users/:id — hard delete with proper FK dependency order
router.delete("/users/:id", async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    // Prevent self-deletion
    if (req.user?.userId === id) {
      res.status(400).json({ error: "Нельзя удалить собственный аккаунт" });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    await prisma.$transaction(async (tx) => {
      // 1. Collect IDs needed for cascading file deletion
      const userMessages = await tx.message.findMany({
        where: { senderId: id },
        select: { id: true },
      });
      const messageIds = userMessages.map((m) => m.id);

      const userRequests = await tx.request.findMany({
        where: { userId: id },
        select: { id: true },
      });
      const requestIds = userRequests.map((r) => r.id);

      // 2. Delete files attached to user's messages and requests
      if (messageIds.length > 0) {
        await tx.file.deleteMany({ where: { entityType: "message", entityId: { in: messageIds } } });
      }
      if (requestIds.length > 0) {
        await tx.file.deleteMany({ where: { entityType: "request", entityId: { in: requestIds } } });
      }

      // 3. Delete messages sent by user (Message.sender has no cascade)
      await tx.message.deleteMany({ where: { senderId: id } });

      // 4. Delete threads where user is client or specialist (Thread → User has no cascade)
      await tx.thread.deleteMany({ where: { OR: [{ clientId: id }, { specialistId: id }] } });

      // 5. Delete user record — remaining relations cascade automatically:
      //    notifications, notificationPreferences, refreshTokens, complaints,
      //    requests (→ threads that cascade from request), specialistFns,
      //    specialistServices, specialistProfile (→ contactMethods)
      await tx.user.delete({ where: { id } });
    });

    res.json({ ok: true });
  } catch (error: unknown) {
    const e = error as { code?: string };
    if (e.code === "P2025") {
      res.status(404).json({ error: "User not found" });
      return;
    }
    console.error("admin/users/:id DELETE error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/admin/settings
router.get("/settings", async (_req: Request, res: Response) => {
  try {
    const settings = await prisma.setting.findMany();
    const result: Record<string, string> = {};
    for (const s of settings) {
      result[s.key] = s.value;
    }
    res.json(result);
  } catch (error) {
    console.error("admin/settings error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/admin/settings
router.patch("/settings", async (req: Request, res: Response) => {
  try {
    const updates = req.body as Record<string, string>;

    for (const [key, value] of Object.entries(updates)) {
      await prisma.setting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      });
    }

    // Return updated settings
    const settings = await prisma.setting.findMany();
    const result: Record<string, string> = {};
    for (const s of settings) {
      result[s.key] = s.value;
    }
    res.json(result);
  } catch (error) {
    console.error("admin/settings patch error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
