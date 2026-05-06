import { Router, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { formatKladrAddress } from "../lib/kladrAddress";
import { authMiddleware } from "../middleware/auth";

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
// Cap=1000: Россия ≈85 субъектов + крупные города → текущая база 209,
// клиенту нужен полный список для дропдаунов фильтра/биллинга.
router.get("/cities", async (req: Request, res: Response) => {
  try {
    const limit = Math.min(1000, Math.max(1, parseInt(req.query.limit as string) || 1000));
    const offset = Math.max(0, parseInt(req.query.offset as string) || 0);

    const [cities, total] = await Promise.all([
      prisma.city.findMany({
        orderBy: { name: "asc" },
        skip: offset,
        take: limit,
        include: {
          _count: { select: { fnsOffices: true } },
        },
      }),
      prisma.city.count(),
    ]);

    res.json({
      items: cities.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        officesCount: c._count.fnsOffices,
      })),
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
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

    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 100));
    const offset = Math.max(0, parseInt(req.query.offset as string) || 0);

    const [offices, total] = await Promise.all([
      prisma.fnsOffice.findMany({
        where,
        orderBy: { name: "asc" },
        skip: offset,
        take: limit,
        select: { id: true, name: true, code: true, address: true, cityId: true },
      }),
      prisma.fnsOffice.count({ where }),
    ]);

    res.json({ city: { id: city.id, name: city.name, slug: city.slug }, items: offices, total, limit, offset, hasMore: offset + limit < total });
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
        _count: {
          select: {
            specialistFns: true,
            requests: {
              where: { status: { in: ["ACTIVE", "CLOSING_SOON"] }, isPublic: true },
            },
          },
        },
      },
    });

    res.json({
      items: offices.map((o) => ({
        id: o.id,
        name: o.name,
        code: o.code,
        address: o.address,
        cityId: o.cityId,
        city: o.city,
        specialistCount: o._count.specialistFns,
        activeRequestCount: o._count.requests,
      })),
    });
  } catch (error) {
    console.error("ifns/search error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/fns/list?q=&cityId=&limit=&offset= — paginated public
// catalog used by /fns landing page. Returns one page of FNS rows
// with counts for cards (specialist count, active+public requests).
router.get("/fns/list", async (req: Request, res: Response) => {
  try {
    const q = normalizeQuery((req.query.q as string) || "");
    const cityId = (req.query.cityId as string) || "";
    const limit = Math.min(60, Math.max(1, parseInt(req.query.limit as string) || 30));
    const offset = Math.max(0, parseInt(req.query.offset as string) || 0);

    const where: Prisma.FnsOfficeWhereInput = {};
    if (cityId) where.cityId = cityId;
    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { code: { contains: q, mode: "insensitive" } },
        { searchAliases: { contains: q, mode: "insensitive" } },
        { city: { name: { contains: q, mode: "insensitive" } } },
      ];
    }

    const [offices, total] = await Promise.all([
      prisma.fnsOffice.findMany({
        where,
        orderBy: [{ city: { name: "asc" } }, { name: "asc" }],
        take: limit,
        skip: offset,
        select: {
          id: true,
          name: true,
          code: true,
          address: true,
          yandexRating: true,
          yandexReviewsCount: true,
          city: { select: { id: true, name: true, slug: true } },
          _count: {
            select: {
              specialistFns: true,
              requests: {
                where: { status: { in: ["ACTIVE", "CLOSING_SOON"] }, isPublic: true },
              },
            },
          },
        },
      }),
      prisma.fnsOffice.count({ where }),
    ]);

    res.json({
      items: offices.map((o) => {
        const addr = formatKladrAddress(o.address);
        return {
          id: o.id,
          name: o.name,
          code: o.code,
          address: addr?.primary ?? o.address,
          addressSecondary: addr?.secondary ?? null,
          city: o.city,
          yandexRating: o.yandexRating,
          yandexReviewsCount: o.yandexReviewsCount,
          specialistCount: o._count.specialistFns,
          activeRequestCount: o._count.requests,
        };
      }),
      total,
      hasMore: offset + offices.length < total,
    });
  } catch (error) {
    console.error("fns/list error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/fns-staff/:id/reviews — добавить отзыв (требует auth).
router.post(
  "/fns-staff/:id/reviews",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const userId = (req as any).user?.userId as string | undefined;
      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      const id = req.params.id as string;
      const { rating, text } = req.body as { rating?: number; text?: string };
      if (typeof rating !== "number" || rating < 1 || rating > 5) {
        res.status(400).json({ error: "rating must be 1..5" });
        return;
      }
      if (!text || typeof text !== "string" || text.trim().length < 10) {
        res.status(400).json({ error: "text must be at least 10 characters" });
        return;
      }
      const trimmed = text.trim().slice(0, 4000);

      const staff = await prisma.fnsStaff.findUnique({ where: { id } });
      if (!staff) {
        res.status(404).json({ error: "staff not found" });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { firstName: true, lastName: true },
      });
      const authorName = [user?.firstName ?? "", user?.lastName ? `${user.lastName[0]}.` : ""]
        .filter(Boolean)
        .join(" ") || "Пользователь";

      const review = await prisma.fnsStaffReview.create({
        data: {
          staffId: id,
          userId,
          authorName,
          rating: Math.round(rating),
          text: trimmed,
          source: "user",
        },
        select: { id: true, authorName: true, rating: true, text: true, source: true, createdAt: true },
      });

      // Перепишем кэшированные агрегаты.
      const agg = await prisma.fnsStaffReview.aggregate({
        where: { staffId: id },
        _avg: { rating: true },
        _count: true,
      });
      await prisma.fnsStaff.update({
        where: { id },
        data: {
          cachedAvgRating: agg._avg.rating ?? null,
          cachedReviewsCount: agg._count,
        },
      });

      res.json(review);
    } catch (error) {
      console.error("POST fns-staff/:id/reviews error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// GET /api/fns-staff/:id/reviews — отзывы про сотрудника.
router.get("/fns-staff/:id/reviews", async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const reviews = await prisma.fnsStaffReview.findMany({
      where: { staffId: id },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        authorName: true,
        rating: true,
        text: true,
        source: true,
        createdAt: true,
      },
    });
    res.json({ items: reviews });
  } catch (error) {
    console.error("fns-staff/:id/reviews error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/fns-staff/:id — публичный профиль одного сотрудника.
router.get("/fns-staff/:id", async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const staff = await prisma.fnsStaff.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        middleName: true,
        position: true,
        department: true,
        phone: true,
        email: true,
        photoUrl: true,
        cachedAvgRating: true,
        cachedReviewsCount: true,
        fns: {
          select: {
            id: true,
            name: true,
            code: true,
            workingHours: true,
            officialPhone: true,
            city: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    });
    if (!staff) {
      res.status(404).json({ error: "Staff member not found" });
      return;
    }

    // Коллеги по тому же отделу — для секции «В отделе работают».
    const colleagues = await prisma.fnsStaff.findMany({
      where: {
        fnsId: staff.fns.id,
        department: staff.department,
        id: { not: staff.id },
      },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        middleName: true,
        position: true,
        photoUrl: true,
      },
    });

    res.json({ ...staff, colleagues });
  } catch (error) {
    console.error("fns-staff/:id error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/fns/:id/staff — сотрудники ИФНС.
router.get("/fns/:id/staff", async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const staff = await prisma.fnsStaff.findMany({
      where: { fnsId: id },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      take: limit,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        middleName: true,
        position: true,
        department: true,
        phone: true,
        email: true,
        photoUrl: true,
        cachedAvgRating: true,
        cachedReviewsCount: true,
      },
    });
    res.json({ items: staff });
  } catch (error) {
    console.error("fns/:id/staff error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/fns/:id/reviews — отзывы по ИФНС. Сейчас отдаёт сид
// «как с Я.Карт», когда подключим реальный источник — он же
// продолжит работать, фильтр по source убран.
router.get("/fns/:id/reviews", async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
    const reviews = await prisma.fnsReview.findMany({
      where: { fnsId: id },
      orderBy: { reviewDate: "desc" },
      take: limit,
      select: {
        id: true,
        authorName: true,
        rating: true,
        text: true,
        source: true,
        reviewDate: true,
      },
    });
    res.json({ items: reviews });
  } catch (error) {
    console.error("fns/:id/reviews error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/fns/:id — single FNS detail (public). Powers the /fns/[id]
// landing page. Returns name + address + description + city + counts
// of specialists and active requests so the page can render at a glance.
router.get("/fns/:id", async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const fns = await prisma.fnsOffice.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        code: true,
        address: true,
        description: true,
        latitude: true,
        longitude: true,
        yandexRating: true,
        yandexReviewsCount: true,
        yandexOrgUrl: true,
        inn: true,
        kpp: true,
        oktmo: true,
        officialPhone: true,
        officialEmail: true,
        officialWebsite: true,
        workingHours: true,
        photoUrls: true,
        nalogGovUrl: true,
        city: { select: { id: true, name: true, slug: true } },
        _count: {
          select: {
            specialistFns: true,
            requests: { where: { status: { in: ["ACTIVE", "CLOSING_SOON"] }, isPublic: true } },
          },
        },
      },
    });
    if (!fns) {
      res.status(404).json({ error: "FNS not found" });
      return;
    }
    const addr = formatKladrAddress(fns.address);
    res.json({
      id: fns.id,
      name: fns.name,
      code: fns.code,
      address: addr?.primary ?? fns.address,
      addressSecondary: addr?.secondary ?? null,
      description: fns.description,
      city: fns.city,
      latitude: fns.latitude,
      longitude: fns.longitude,
      yandexRating: fns.yandexRating,
      yandexReviewsCount: fns.yandexReviewsCount,
      yandexOrgUrl: fns.yandexOrgUrl,
      inn: fns.inn,
      kpp: fns.kpp,
      oktmo: fns.oktmo,
      officialPhone: fns.officialPhone,
      officialEmail: fns.officialEmail,
      officialWebsite: fns.officialWebsite,
      workingHours: fns.workingHours,
      photoUrls: fns.photoUrls,
      nalogGovUrl: fns.nalogGovUrl,
      specialistCount: fns._count.specialistFns,
      activeRequestCount: fns._count.requests,
    });
  } catch (error) {
    console.error("fns/:id error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/fns?city_id=X or ?city_ids=X,Y — offices for one or many cities
router.get("/fns", async (req: Request, res: Response) => {
  try {
    const cityId = (req.query.city_id as string) || "";
    const cityIdsParam = (req.query.city_ids as string) || "";

    const ids = cityIdsParam
      ? cityIdsParam.split(",").map((s) => s.trim()).filter(Boolean)
      : cityId
      ? [cityId]
      : [];

    if (ids.length === 0) {
      res.status(400).json({ error: "city_id or city_ids is required" });
      return;
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    for (const id of ids) {
      if (!uuidRegex.test(id)) {
        res.status(400).json({ error: "Invalid city id format: must be a valid UUID" });
        return;
      }
    }

    const offices = await prisma.fnsOffice.findMany({
      where: { cityId: { in: ids } },
      orderBy: [{ city: { name: "asc" } }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        code: true,
        cityId: true,
        address: true,
        city: { select: { id: true, name: true } },
      },
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

// In-memory cache for public landing counts (60s TTL).
// Avoids running 3 COUNT queries on every public landing hit.
let cachedLandingCounts: {
  data: { specialistsCount: number; citiesCount: number; consultationsCount: number };
  expiresAt: number;
} | null = null;
const LANDING_TTL_MS = 60_000;

// GET /api/stats — public platform statistics
router.get("/stats", async (_req: Request, res: Response) => {
  try {
    const now = Date.now();
    if (cachedLandingCounts && cachedLandingCounts.expiresAt > now) {
      res.json(cachedLandingCounts.data);
      return;
    }

    const [specialistsCount, citiesCount, consultationsCount] = await Promise.all([
      // Iter11: specialists counted by flag, not retired role value.
      prisma.user.count({ where: { isSpecialist: true, isBanned: false } }),
      prisma.city.count(),
      prisma.thread.count(),
    ]);

    const data = { specialistsCount, citiesCount, consultationsCount };
    cachedLandingCounts = { data, expiresAt: now + LANDING_TTL_MS };
    res.json(data);
  } catch (error) {
    console.error("stats error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
