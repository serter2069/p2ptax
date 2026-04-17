import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";

const router = Router();

const VALID_EVENT_TYPES = [
  "new_response",
  "new_message",
  "new_request_in_city",
  "promo_expiring",
] as const;

function param(val: string | string[] | undefined): string {
  return Array.isArray(val) ? val[0] : val || "";
}

function isValidEventType(type: string): boolean {
  return (VALID_EVENT_TYPES as readonly string[]).includes(type);
}

// GET /api/notifications — list user's in-app notifications
router.get("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const page = Math.max(1, parseInt(String(req.query.page || "1")));
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || "20"))));

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notification.count({ where: { userId } }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    res.json({ notifications, total, unreadCount, page, limit });
  } catch (error) {
    console.error("list notifications error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/notifications/:id/read — mark notification as read
router.patch("/:id/read", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const id = param(req.params.id);

    const notification = await prisma.notification.findUnique({ where: { id } });

    if (!notification) {
      res.status(404).json({ error: "Notification not found" });
      return;
    }

    if (notification.userId !== userId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    res.json({ notification: updated });
  } catch (error) {
    console.error("mark notification read error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/notifications/read-all — mark all notifications as read
router.patch("/read-all", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("mark all read error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/notifications/preferences — all preferences for current user
router.get("/preferences", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const saved = await prisma.notificationPreference.findMany({
      where: { userId },
    });

    // Return full list with defaults for missing event types
    const prefsMap: Record<string, { email: boolean; inApp: boolean }> = {};
    for (const p of saved) {
      prefsMap[p.eventType] = { email: p.email, inApp: p.inApp };
    }

    const preferences = VALID_EVENT_TYPES.map((eventType) => ({
      eventType,
      email: prefsMap[eventType]?.email ?? true,
      inApp: prefsMap[eventType]?.inApp ?? true,
    }));

    res.json({ preferences });
  } catch (error) {
    console.error("get preferences error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/notifications/preferences/:eventType — single event type preference
router.get("/preferences/:eventType", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const eventType = param(req.params.eventType);

    if (!isValidEventType(eventType)) {
      res.status(400).json({ error: `Invalid eventType. Valid: ${VALID_EVENT_TYPES.join(", ")}` });
      return;
    }

    const pref = await prisma.notificationPreference.findUnique({
      where: { userId_eventType: { userId, eventType } },
    });

    res.json({
      eventType,
      email: pref?.email ?? true,
      inApp: pref?.inApp ?? true,
    });
  } catch (error) {
    console.error("get preference error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/notifications/preferences/:eventType — upsert preference
router.put("/preferences/:eventType", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const eventType = param(req.params.eventType);
    const { email, inApp } = req.body as { email?: boolean; inApp?: boolean };

    if (!isValidEventType(eventType)) {
      res.status(400).json({ error: `Invalid eventType. Valid: ${VALID_EVENT_TYPES.join(", ")}` });
      return;
    }

    if (email !== undefined && typeof email !== "boolean") {
      res.status(400).json({ error: "email must be a boolean" });
      return;
    }
    if (inApp !== undefined && typeof inApp !== "boolean") {
      res.status(400).json({ error: "inApp must be a boolean" });
      return;
    }

    const updateData: { email?: boolean; inApp?: boolean } = {};
    if (email !== undefined) updateData.email = email;
    if (inApp !== undefined) updateData.inApp = inApp;

    const pref = await prisma.notificationPreference.upsert({
      where: { userId_eventType: { userId, eventType } },
      create: { userId, eventType, ...updateData },
      update: updateData,
    });

    res.json({ preference: pref });
  } catch (error) {
    console.error("update preference error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
