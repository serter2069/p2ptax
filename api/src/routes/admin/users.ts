import { Router, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { prisma } from "../../lib/prisma";

const router = Router();

const adminWriteRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Слишком много запросов. Попробуйте через минуту." },
});

// GET /api/admin/users
router.get("/", async (req: Request, res: Response) => {
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

    // Iter11 PR 3 — admin UI filter tokens map onto the unified schema.
    // Tokens are just filter identifiers, NOT DB role enum values.
    //   "CLIENT"     -> role=USER, isSpecialist=false
    //   "SPECIALIST" -> isSpecialist=true
    //   "USER"       -> role=USER (any)
    //   "ADMIN"      -> role=ADMIN
    //   "BANNED"     -> isBanned=true
    const roleFilter: string | undefined = role;
    switch (roleFilter) {
      case "CLIENT":
        where.role = "USER";
        where.isSpecialist = false;
        break;
      case "SPECIALIST":
        where.isSpecialist = true;
        break;
      case "USER":
      case "ADMIN":
        where.role = roleFilter;
        break;
      case "BANNED":
        where.isBanned = true;
        break;
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
          isSpecialist: true,
          specialistProfileCompletedAt: true,
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
router.patch("/:id", async (req: Request, res: Response) => {
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
    // Iter11 PR 3 — admin PATCH accepts legacy UI labels and remaps onto
    // the unified schema. The legacy tokens are UI-only; the DB always
    // stores role=USER|ADMIN with isSpecialist toggled.
    const roleInput: string | undefined = role;
    switch (roleInput) {
      case "CLIENT":
        data.role = "USER";
        data.isSpecialist = false;
        break;
      case "SPECIALIST":
        data.role = "USER";
        data.isSpecialist = true;
        break;
      case "USER":
      case "ADMIN":
        data.role = roleInput;
        break;
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
        isSpecialist: true,
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
  "/:id/close-all-requests",
  adminWriteRateLimiter,
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

// DELETE /api/admin/users/:id — hard delete with proper FK dependency order
router.delete("/:id", adminWriteRateLimiter, async (req: Request, res: Response) => {
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

export default router;
