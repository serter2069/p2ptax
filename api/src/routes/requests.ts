import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { Prisma } from "@prisma/client";

const router = Router();

// GET /api/requests/public — active requests feed
router.get("/public", async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const cityId = (req.query.city_id as string) || undefined;

    const where: Prisma.RequestWhereInput = {
      status: { in: ["ACTIVE", "CLOSING_SOON"] },
    };

    if (cityId) {
      where.cityId = cityId;
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

// GET /api/requests/:id/public — single request detail
router.get("/:id/public", async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const result = await prisma.request.findUnique({
      where: { id },
      include: {
        city: true,
        fns: true,
        user: true,
        _count: { select: { threads: true } },
      },
    });

    if (!result) {
      res.status(404).json({ error: "Request not found" });
      return;
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
    });
  } catch (error) {
    console.error("requests/:id/public error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/requests/public — quick request from landing
router.post("/public", async (req: Request, res: Response) => {
  try {
    const { title, cityId, fnsId, description, userId } = req.body;

    if (!title || !cityId || !fnsId || !description) {
      res.status(400).json({
        error: "Title, city, FNS office, and description are required",
      });
      return;
    }

    if (!userId) {
      res.status(401).json({ error: "Authentication required to create a request" });
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
        title,
        cityId,
        fnsId,
        description,
        userId,
      },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
      },
    });

    res.status(201).json(request);
  } catch (error) {
    console.error("requests/public create error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
