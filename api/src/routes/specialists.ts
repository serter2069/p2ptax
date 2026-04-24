import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { Prisma } from "@prisma/client";
import { verifyAccessToken } from "../lib/jwt";

const router = Router();

/** Optional auth — returns the caller's userId if a valid Bearer token is present. */
function resolveCallerId(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    return verifyAccessToken(authHeader.slice(7)).userId;
  } catch {
    return null;
  }
}

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
        // Iter11: specialist catalog is driven by the flag, not the legacy
        // role enum. Require completed profile so we never surface half-seeded
        // users who are still onboarding.
        isSpecialist: true,
        specialistProfileCompletedAt: { not: null },
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
    const cityIdsParam = (req.query.city_ids as string) || "";
    const fnsIdsParam = (req.query.fns_ids as string) || "";
    const cityIdsList = cityIdsParam
      ? cityIdsParam.split(",").map((s) => s.trim()).filter(Boolean)
      : cityId
      ? [cityId]
      : [];
    const fnsIdsList = fnsIdsParam
      ? fnsIdsParam.split(",").map((s) => s.trim()).filter(Boolean)
      : fnsId
      ? [fnsId]
      : [];
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

    // Validate every city/fns id is UUID to prevent DB crashes
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    for (const id of cityIdsList) {
      if (!uuidRegex.test(id)) {
        res.status(400).json({
          error: "Invalid city_id format: must be a valid UUID",
        });
        return;
      }
    }
    for (const id of fnsIdsList) {
      if (!uuidRegex.test(id)) {
        res.status(400).json({
          error: "Invalid fns_id format: must be a valid UUID",
        });
        return;
      }
    }

    // Iter11: catalog is gated by isSpecialist flag + completed onboarding,
    // not by the retired SPECIALIST role value. Also exclude the caller from
    // their own catalog view — showing yourself as a specialist you could
    // contact is a bug, not a feature.
    const callerId = resolveCallerId(req);
    const where: Prisma.UserWhereInput = {
      isSpecialist: true,
      specialistProfileCompletedAt: { not: null },
      isAvailable: true,
      isBanned: false,
      ...(callerId ? { id: { not: callerId } } : {}),
    };

    // Name search — uses Prisma `contains` (parameterized ILIKE under the hood)
    if (q) {
      where.OR = [
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
      ];
    }

    if (cityIdsList.length > 0 || fnsIdsList.length > 0) {
      where.specialistFns = {
        some: {
          ...(cityIdsList.length > 0
            ? { fns: { cityId: { in: cityIdsList } } }
            : {}),
          ...(fnsIdsList.length > 0
            ? { fnsId: { in: fnsIdsList } }
            : {}),
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

// GET /api/specialists/:id — full profile
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const specialist = await prisma.user.findFirst({
      where: {
        id,
        // Iter11: specialist detail checks the flag, not the legacy role.
        isSpecialist: true,
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

    const [requestsCount, cases] = await Promise.all([
      prisma.thread.count({ where: { specialistId: id } }),
      prisma.specialistCase.findMany({
        where: { specialistId: id },
        orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      }),
    ]);

    const profile = specialist.specialistProfile;

    res.json({
      id: specialist.id,
      firstName: specialist.firstName,
      lastName: specialist.lastName,
      avatarUrl: specialist.avatarUrl,
      isAvailable: specialist.isAvailable,
      createdAt: specialist.createdAt,
      requestsCount,
      profile: profile
        ? {
            description: profile.description,
            phone: profile.phone,
            telegram: profile.telegram,
            whatsapp: profile.whatsapp,
            officeAddress: profile.officeAddress,
            workingHours: profile.workingHours,
            exFnsStartYear: profile.exFnsStartYear,
            exFnsEndYear: profile.exFnsEndYear,
            yearsOfExperience: profile.yearsOfExperience,
            specializations: (profile.specializations as string[] | null) ?? null,
            certifications: (profile.certifications as string[] | null) ?? null,
          }
        : null,
      fnsServices: [...fnsMap.values()],
      cases: cases.map((c) => ({
        id: c.id,
        title: c.title,
        category: c.category,
        amount: c.amount,
        resolvedAmount: c.resolvedAmount,
        days: c.days,
        status: c.status,
        description: c.description,
        year: c.year,
      })),
    });
  } catch (error) {
    console.error("specialist detail error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
