import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware, requireSpecialistFeatures } from "../middleware/auth";
import { verifyAccessToken } from "../lib/jwt";

const router = Router();

const VALID_TYPES = ["phone", "email", "telegram", "whatsapp", "max", "vk", "website"];
const MAX_CONTACTS = 6;

/** Optional auth — returns the caller's userId if a valid Bearer is present. */
function resolveCallerId(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    return verifyAccessToken(authHeader.slice(7)).userId;
  } catch {
    return null;
  }
}

function clientIp(req: Request): string | null {
  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string" && xff.length > 0) return xff.split(",")[0]!.trim();
  if (Array.isArray(xff) && xff.length > 0) return xff[0]!;
  return req.ip ?? req.socket?.remoteAddress ?? null;
}
function clientUserAgent(req: Request): string | null {
  const ua = req.headers["user-agent"];
  return typeof ua === "string" ? ua.slice(0, 500) : null;
}

async function fetchContactsForOwner(ownerId: string) {
  const profile = await prisma.specialistProfile.findFirst({
    where: { userId: ownerId },
    select: { id: true },
  });
  if (!profile) return [];
  return prisma.contactMethod.findMany({
    where: { profileId: profile.id },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    select: { id: true, type: true, value: true, label: true, order: true },
  });
}

// GET /api/specialists/:id/contacts — public.
// Returns { items, revealed }. Only owners or viewers who already
// clicked 'Показать контакты' (logged in contact_views) get items[]
// inline; everyone else gets revealed:false and an empty list.
router.get("/specialists/:id/contacts", async (req: Request, res: Response) => {
  try {
    const ownerId = req.params.id as string;
    const callerId = resolveCallerId(req);

    if (callerId === ownerId) {
      const items = await fetchContactsForOwner(ownerId);
      res.json({
        items,
        revealed: true,
        types: items.map((c) => c.type),
      });
      return;
    }

    if (callerId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const seen = await (prisma as any).contactView.findFirst({
        where: { ownerId, viewerId: callerId },
        select: { id: true },
      });
      if (seen) {
        const items = await fetchContactsForOwner(ownerId);
        res.json({
          items,
          revealed: true,
          types: items.map((c) => c.type),
        });
        return;
      }
    }

    // Not revealed: still expose the *types* of contacts the specialist
    // has so the visitor can decide whether to click 'Показать
    // контакты'. Values stay hidden.
    const items = await fetchContactsForOwner(ownerId);
    res.json({
      items: [],
      revealed: false,
      types: items.map((c) => c.type),
    });
  } catch (error) {
    console.error("contacts public error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/specialists/:id/contacts/reveal — log click, return contacts.
// Requires a valid token. Idempotent — every reveal creates a fresh log
// row so future analytics can count visits, not just unique viewers.
router.post("/specialists/:id/contacts/reveal", async (req: Request, res: Response) => {
  try {
    const ownerId = req.params.id as string;
    const callerId = resolveCallerId(req);
    if (!callerId) {
      res.status(401).json({ error: "Authentication required to view contacts" });
      return;
    }
    if (callerId === ownerId) {
      const items = await fetchContactsForOwner(ownerId);
      res.json({ items, revealed: true });
      return;
    }

    const owner = await prisma.user.findUnique({
      where: { id: ownerId },
      select: { id: true, isBanned: true, deletedAt: true },
    });
    if (!owner || owner.isBanned || owner.deletedAt) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma as any).contactView.create({
      data: {
        ownerId,
        viewerId: callerId,
        ip: clientIp(req),
        userAgent: clientUserAgent(req),
      },
    });

    const items = await fetchContactsForOwner(ownerId);
    res.json({ items, revealed: true });
  } catch (error) {
    console.error("contacts reveal error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// All routes below require specialist features (Iter11 — flag-based).
router.use(authMiddleware, requireSpecialistFeatures);

// GET /api/profile/contacts — own contacts
router.get("/profile/contacts", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const profile = await prisma.specialistProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!profile) {
      res.json({ items: [] });
      return;
    }

    const contacts = await prisma.contactMethod.findMany({
      where: { profileId: profile.id },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      select: { id: true, type: true, value: true, label: true, order: true },
    });

    res.json({ items: contacts });
  } catch (error) {
    console.error("contacts profile error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/profile/contacts — add contact
router.post("/profile/contacts", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { type, value, label, order } = req.body as {
      type: string;
      value: string;
      label?: string;
      order?: number;
    };

    if (!type || !VALID_TYPES.includes(type)) {
      res.status(400).json({ error: `type must be one of: ${VALID_TYPES.join(", ")}` });
      return;
    }

    if (!value || typeof value !== "string" || !value.trim()) {
      res.status(400).json({ error: "value is required" });
      return;
    }

    // Ensure profile exists
    let profile = await prisma.specialistProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!profile) {
      profile = await prisma.specialistProfile.create({
        data: { userId },
        select: { id: true },
      });
    }

    // Check max 6 contacts
    const count = await prisma.contactMethod.count({ where: { profileId: profile.id } });
    if (count >= MAX_CONTACTS) {
      res.status(400).json({ error: `Max ${MAX_CONTACTS} contacts allowed` });
      return;
    }

    const contact = await prisma.contactMethod.create({
      data: {
        profileId: profile.id,
        type,
        value: value.trim(),
        label: label?.trim() || null,
        order: typeof order === "number" ? order : count,
      },
      select: { id: true, type: true, value: true, label: true, order: true },
    });

    res.status(201).json(contact);
  } catch (error) {
    console.error("contacts create error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/profile/contacts/:id — update value/label/order
router.put("/profile/contacts/:id", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const contactId = req.params.id as string;
    const { value, label, order } = req.body as {
      value?: string;
      label?: string;
      order?: number;
    };

    const profile = await prisma.specialistProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!profile) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }

    const existing = await prisma.contactMethod.findFirst({
      where: { id: contactId, profileId: profile.id },
    });

    if (!existing) {
      res.status(404).json({ error: "Contact not found" });
      return;
    }

    const updated = await prisma.contactMethod.update({
      where: { id: contactId },
      data: {
        ...(value !== undefined ? { value: value.trim() } : {}),
        ...(label !== undefined ? { label: label.trim() || null } : {}),
        ...(order !== undefined ? { order } : {}),
      },
      select: { id: true, type: true, value: true, label: true, order: true },
    });

    res.json(updated);
  } catch (error) {
    console.error("contacts update error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/profile/contacts/:id
router.delete("/profile/contacts/:id", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const contactId = req.params.id as string;

    const profile = await prisma.specialistProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!profile) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }

    const existing = await prisma.contactMethod.findFirst({
      where: { id: contactId, profileId: profile.id },
    });

    if (!existing) {
      res.status(404).json({ error: "Contact not found" });
      return;
    }

    await prisma.contactMethod.delete({ where: { id: contactId } });

    res.json({ success: true });
  } catch (error) {
    console.error("contacts delete error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
