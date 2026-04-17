import { Router, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";

const router = Router();

// Normalize query string: lowercase, strip punctuation, collapse spaces
function normalizeQuery(q: string): string {
  return q
    .toLowerCase()
    .replace(/[.,\-#№]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// GET /api/cities — list all cities (with offices count)
router.get("/cities", async (_req: Request, res: Response) => {
  try {
    const cities = await prisma.city.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { fnsOffices: true } },
      },
    });

    res.json({
      items: cities.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        officesCount: c._count.fnsOffices,
      })),
    });
  } catch (error) {
    console.error("cities error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/cities/:slug/ifns?q= — list IFNS for a city with optional search
router.get("/cities/:slug/ifns", async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug as string;
    const q = normalizeQuery((req.query.q as string) || "");

    const city = await prisma.city.findUnique({ where: { slug } });
    if (!city) {
      res.status(404).json({ error: "City not found" });
      return;
    }

    const where: Prisma.FnsOfficeWhereInput = { cityId: city.id };
    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { code: { contains: q, mode: "insensitive" } },
        { searchAliases: { contains: q, mode: "insensitive" } },
      ];
    }

    const offices = await prisma.fnsOffice.findMany({
      where,
      orderBy: { name: "asc" },
      select: { id: true, name: true, code: true, address: true, cityId: true },
    });

    res.json({ city: { id: city.id, name: city.name, slug: city.slug }, items: offices });
  } catch (error) {
    console.error("cities/:slug/ifns error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/ifns/search?q=&citySlug= — global smart search across all IFNS
// Handles: "ИФНС 25", "7725", "налоговая москва", "ФНС 7"
router.get("/ifns/search", async (req: Request, res: Response) => {
  try {
    const q = normalizeQuery((req.query.q as string) || "");
    const citySlug = (req.query.citySlug as string) || "";

    if (!q) {
      res.json({ items: [] });
      return;
    }

    const where: Record<string, unknown> = {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { code: { contains: q, mode: "insensitive" } },
        { searchAliases: { contains: q, mode: "insensitive" } },
        { city: { name: { contains: q, mode: "insensitive" } } },
      ],
    };

    if (citySlug) {
      where.city = { slug: citySlug };
      // Override OR to keep city filter
      where.AND = [
        { city: { slug: citySlug } },
        {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { code: { contains: q, mode: "insensitive" } },
            { searchAliases: { contains: q, mode: "insensitive" } },
          ],
        },
      ];
      delete where.OR;
      delete where.city;
    }

    const offices = await prisma.fnsOffice.findMany({
      where,
      orderBy: [{ city: { name: "asc" } }, { name: "asc" }],
      take: 30,
      select: {
        id: true,
        name: true,
        code: true,
        address: true,
        cityId: true,
        city: { select: { id: true, name: true, slug: true } },
      },
    });

    res.json({ items: offices });
  } catch (error) {
    console.error("ifns/search error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/fns?city_id=X — legacy endpoint, kept for compatibility
router.get("/fns", async (req: Request, res: Response) => {
  try {
    const cityId = req.query.city_id as string;

    if (!cityId) {
      res.status(400).json({ error: "city_id is required" });
      return;
    }

    const offices = await prisma.fnsOffice.findMany({
      where: { cityId },
      orderBy: { name: "asc" },
      select: { id: true, name: true, code: true, cityId: true, address: true },
    });
    res.json({ offices });
  } catch (error) {
    console.error("fns error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/services — list all services
router.get("/services", async (_req: Request, res: Response) => {
  try {
    const services = await prisma.service.findMany({
      orderBy: { name: "asc" },
    });

    res.json({ items: services });
  } catch (error) {
    console.error("services error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
