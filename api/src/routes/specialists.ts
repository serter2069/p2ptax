import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { Prisma } from "@prisma/client";

const router = Router();

const specialistListSelect = Prisma.validator<Prisma.UserSelect>()({
  id: true,
  firstName: true,
  lastName: true,
  avatarUrl: true,
  specialistServices: {
    select: {
      service: { select: { id: true, name: true } },
    },
    distinct: ["serviceId"],
  },
  specialistFns: {
    select: {
      fns: {
        select: {
          id: true,
          name: true,
          city: { select: { id: true, name: true } },
        },
      },
    },
  },
});

type SpecialistListItem = Prisma.UserGetPayload<{ select: typeof specialistListSelect }>;

function mapSpecialist(s: SpecialistListItem) {
  const services = s.specialistServices.map((ss) => ss.service);
  const citiesMap = new Map<string, { id: string; name: string }>();
  for (const sf of s.specialistFns) {
    citiesMap.set(sf.fns.city.id, sf.fns.city);
  }
  return {
    id: s.id,
    firstName: s.firstName,
    lastName: s.lastName,
    avatarUrl: s.avatarUrl,
    services,
    cities: [...citiesMap.values()],
  };
}

// GET /api/specialists/featured — top 10 available specialists
router.get("/featured", async (_req: Request, res: Response) => {
  try {
    const specialists = await prisma.user.findMany({
      where: {
        role: "SPECIALIST",
        isAvailable: true,
        isBanned: false,
      },
      take: 10,
      orderBy: { createdAt: "desc" },
      select: specialistListSelect,
    });

    res.json({ items: specialists.map(mapSpecialist) });
  } catch (error) {
    console.error("specialists/featured error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/specialists — catalog with filters
// SECURITY: all user-supplied values (q, city_id, fns_id, services) are passed
// exclusively through Prisma ORM parameterized queries — never interpolated into
// raw SQL strings. Do NOT switch to $queryRaw/$executeRaw with string concatenation.
router.get("/", async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    // Trim and cap search query to prevent abuse; Prisma handles escaping
    const q = ((req.query.q as string) || "").trim().slice(0, 100);
    const cityId = (req.query.city_id as string) || undefined;
    const fnsId = (req.query.fns_id as string) || undefined;
    const servicesParam = (req.query.services as string) || undefined;
    const serviceIds = servicesParam
      ? servicesParam.split(",").filter(Boolean)
      : [];

    // Reject unknown city-related params to catch misuse (e.g. ?city=москва)
    if (req.query.city && !req.query.city_id) {
      res.status(400).json({
        error: "Invalid query parameter: use 'city_id' (UUID) instead of 'city'",
      });
      return;
    }

    // Validate city_id and fns_id are UUID format to prevent DB crashes
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (cityId && !uuidRegex.test(cityId)) {
      res.status(400).json({
        error: "Invalid city_id format: must be a valid UUID",
      });
      return;
    }
    if (fnsId && !uuidRegex.test(fnsId)) {
      res.status(400).json({
        error: "Invalid fns_id format: must be a valid UUID",
      });
      return;
    }

    const where: Prisma.UserWhereInput = {
      role: "SPECIALIST",
      isAvailable: true,
      isBanned: false,
    };

    // Name search — uses Prisma `contains` (parameterized ILIKE under the hood)
    if (q) {
      where.OR = [
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
      ];
    }

    if (cityId || fnsId) {
      where.specialistFns = {
        some: {
          ...(cityId ? { fns: { cityId } } : {}),
          ...(fnsId ? { fnsId } : {}),
        },
      };
    }

    if (serviceIds.length > 0) {
      where.specialistServices = {
        some: { serviceId: { in: serviceIds } },
      };
    }

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: specialistListSelect,
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      items: items.map(mapSpecialist),
      total,
      page,
      limit,
      hasMore: skip + limit < total,
    });
  } catch (error) {
    console.error("specialists list error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/specialists/:id/reviews — public reviews for a specialist
// Security note: only name (first name) and avatarUrl are returned — never email (#179)
router.get("/:id/reviews", async (_req: Request, res: Response) => {
  // Reviews feature is not yet implemented (DB model pending).
  // Endpoint exists to enforce the email-safe contract from day one.
  res.json({ items: [], total: 0 });
});

// GET /api/specialists/:id — full profile
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const specialist = await prisma.user.findFirst({
      where: {
        id,
        role: "SPECIALIST",
        isBanned: false,
      },
      include: {
        specialistProfile: true,
        specialistFns: {
          include: {
            fns: {
              include: { city: true },
            },
          },
        },
        specialistServices: {
          include: {
            service: true,
            fns: {
              include: { city: true },
            },
          },
        },
      },
    });

    if (!specialist) {
      res.status(404).json({ error: "Specialist not found" });
      return;
    }

    // Group services by FNS/city
    const fnsMap = new Map<
      string,
      {
        fns: { id: string; name: string; code: string };
        city: { id: string; name: string };
        services: { id: string; name: string }[];
      }
    >();

    for (const sf of specialist.specialistFns) {
      fnsMap.set(sf.fns.id, {
        fns: { id: sf.fns.id, name: sf.fns.name, code: sf.fns.code },
        city: { id: sf.fns.city.id, name: sf.fns.city.name },
        services: [],
      });
    }

    for (const ss of specialist.specialistServices) {
      const entry = fnsMap.get(ss.fns.id);
      if (entry) {
        entry.services.push({ id: ss.service.id, name: ss.service.name });
      }
    }

    const requestsCount = await prisma.thread.count({ where: { specialistId: id } });

    res.json({
      id: specialist.id,
      firstName: specialist.firstName,
      lastName: specialist.lastName,
      avatarUrl: specialist.avatarUrl,
      isAvailable: specialist.isAvailable,
      createdAt: specialist.createdAt,
      requestsCount,
      profile: specialist.specialistProfile
        ? {
            description: specialist.specialistProfile.description,
            phone: specialist.specialistProfile.phone,
            telegram: specialist.specialistProfile.telegram,
            whatsapp: specialist.specialistProfile.whatsapp,
            officeAddress: specialist.specialistProfile.officeAddress,
            workingHours: specialist.specialistProfile.workingHours,
          }
        : null,
      fnsServices: [...fnsMap.values()],
    });
  } catch (error) {
    console.error("specialist detail error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
