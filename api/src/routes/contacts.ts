import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware, roleGuard } from "../middleware/auth";

const router = Router();

const VALID_TYPES = ["phone", "email", "telegram", "whatsapp", "vk", "website"];
const MAX_CONTACTS = 6;

// GET /api/specialists/:id/contacts — public
router.get("/specialists/:id/contacts", async (req: Request, res: Response) => {
  try {
    const profile = await prisma.specialistProfile.findFirst({
      where: { userId: req.params.id as string },
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
    console.error("contacts public error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// All routes below require SPECIALIST auth
router.use(authMiddleware, roleGuard("SPECIALIST"));

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
