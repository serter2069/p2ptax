import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { Prisma } from "@prisma/client";
import { verifyAccessToken } from "../lib/jwt";
import { authMiddleware, requireSpecialistFeatures } from "../middleware/auth";
import { notSeedUserWhere } from "../lib/seedFilter";
import { presignAvatarUrl } from "../lib/minio";

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

export const specialistListSelect = Prisma.validator<Prisma.UserSelect>()({
  id: true,
  firstName: true,
  lastName: true,
  avatarUrl: true,
  isAvailable: true,
  createdAt: true,
  specialistProfile: {
    select: {
      description: true,
      yearsOfExperience: true,
      exFnsStartYear: true,
      exFnsEndYear: true,
      exFnsOffice: true,
      verifiedExFns: true,
      cachedAvgResponseMinutes: true,
    },
  },
  specialistFns: {
    select: {
      id: true,
      fnsId: true,
      fns: {
        select: {
          id: true,
          name: true,
          city: { select: { id: true, name: true } },
        },
      },
      services: {
        select: {
          service: { select: { id: true, name: true } },
        },
      },
    },
  },
  specialistServices: {
    select: { service: { select: { id: true, name: true } } },
    distinct: ["serviceId"],
  },
  _count: {
    select: {
      specialistCases: true,
      specialistReviews: true,
    },
  },
});

export type SpecialistListItem = Prisma.UserGetPayload<{ select: typeof specialistListSelect }>;

export function mapSpecialist(s: SpecialistListItem) {
  const citiesMap = new Map<string, { id: string; name: string }>();
  const fnsNamesMap = new Map<string, { id: string; fnsId: string; fnsName: string }>();
  const specialistFns = s.specialistFns.map((sf) => {
    if (sf.fns) {
      citiesMap.set(sf.fns.city.id, sf.fns.city);
      fnsNamesMap.set(sf.fns.id, { id: sf.id, fnsId: sf.fns.id, fnsName: sf.fns.name });
    }
    return {
      fnsId: sf.fns?.id ?? sf.fnsId,
      fnsName: sf.fns?.name ?? "",
      city: sf.fns?.city ?? null,
      services: sf.services.map((sv) => sv.service),
    };
  });

  // Flat deduped services list (for backward compat with horizontal card variant)
  const servicesMap = new Map<string, { id: string; name: string }>();
  for (const sf of specialistFns) {
    for (const svc of sf.services) {
      servicesMap.set(svc.id, svc);
    }
  }

  return {
    id: s.id,
    firstName: s.firstName,
    lastName: s.lastName,
    avatarUrl: s.avatarUrl,
    isAvailable: s.isAvailable,
    createdAt: s.createdAt,
    services: [...servicesMap.values()],
    cities: [...citiesMap.values()],
    fnsNames: [...fnsNamesMap.values()],
    specialistFns,
    description: s.specialistProfile?.description ?? null,
    profile: {
      description: s.specialistProfile?.description ?? null,
      yearsOfExperience: s.specialistProfile?.yearsOfExperience ?? null,
      exFnsStartYear: s.specialistProfile?.exFnsStartYear ?? null,
      exFnsEndYear: s.specialistProfile?.exFnsEndYear ?? null,
      exFnsOffice: s.specialistProfile?.exFnsOffice ?? null,
      verifiedExFns: s.specialistProfile?.verifiedExFns ?? false,
    },
    // Round to nearest 5 (UI-friendly), null when no cache + insufficient data
    avgResponseMinutes: s.specialistProfile?.cachedAvgResponseMinutes != null
      ? Math.max(5, Math.round(s.specialistProfile.cachedAvgResponseMinutes / 5) * 5)
      : null,
    casesCount: s._count.specialistCases,
    reviewsCount: s._count.specialistReviews,
  };
}

// Pinned EMAILS surfaced FIRST in /featured — these are the 4 hand-curated
// landing specialists with AI-generated portraits seeded via
// seed-landing-avatars.ts. Pin by email (not UUID) because UUIDs differ
// between local-dev and freshly-seeded staging DBs; emails are deterministic
// from seed-specialists.ts.
const FEATURED_PINNED_EMAILS = [
  "yulia.zaitseva@p2ptax-seed.ru",     // Юлия Зайцева → Камеральная
  "vladimir.lebedev@p2ptax-seed.ru",   // Владимир Лебедев → ОКК
  "yuriy.kondratyev@p2ptax-seed.ru",   // Юрий Кондратьев → Выездная
  "svetlana.orlova@p2ptax-seed.ru",    // Светлана Орлова → Опер.контроль
];

// GET /api/specialists/featured — top 10 available specialists
router.get("/featured", async (_req: Request, res: Response) => {
  try {
    const seedUserNot = notSeedUserWhere();
    const baseWhere = {
      isSpecialist: true,
      isPublicProfile: true,
      specialistProfileCompletedAt: { not: null },
      isAvailable: true,
      isBanned: false,
      deletedAt: null,
      ...(seedUserNot ?? {}),
    } as const;

    // Resolve pinned emails → IDs (email kept out of the public select).
    const pinnedRefs = await prisma.user.findMany({
      where: { ...baseWhere, email: { in: FEATURED_PINNED_EMAILS } },
      select: { id: true, email: true },
    });
    const pinnedIds = pinnedRefs.map((r) => r.id);

    const pinned = pinnedIds.length === 0
      ? []
      : await prisma.user.findMany({
          where: { ...baseWhere, id: { in: pinnedIds } },
          select: specialistListSelect,
        });

    const remaining = await prisma.user.findMany({
      where: { ...baseWhere, id: { notIn: pinnedIds } },
      take: Math.max(0, 10 - pinned.length),
      orderBy: [
        { avatarUrl: { sort: "desc", nulls: "last" } },
        { createdAt: "desc" },
      ],
      select: specialistListSelect,
    });

    // Re-sort pinned to match FEATURED_PINNED_EMAILS order so HeroBlock layout
    // is deterministic. Use the email→id map from the pinnedRefs query.
    const emailById = new Map(pinnedRefs.map((r) => [r.id, r.email]));
    const pinnedSorted = FEATURED_PINNED_EMAILS
      .map((email) => pinned.find((p) => emailById.get(p.id) === email))
      .filter((s): s is (typeof pinned)[number] => Boolean(s));

    res.json({ items: [...pinnedSorted, ...remaining].map(mapSpecialist) });
  } catch (error) {
    console.error("specialists/featured error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/specialists — catalog with filters
// ?savedOnly=true — returns only specialists saved by the authenticated caller.
//   Same shape as the full catalog (description, profile, casesCount, etc.).
//   Requires a valid Bearer token; returns 401 if not authenticated.
// SECURITY: all user-supplied values (q, city_id, fns_id, services) are passed
// exclusively through Prisma ORM parameterized queries — never interpolated into
// raw SQL strings. Do NOT switch to $queryRaw/$executeRaw with string concatenation.
router.get("/", async (req: Request, res: Response) => {
  try {
    const savedOnly = req.query.savedOnly === "true";

    // savedOnly requires auth — resolve caller from Bearer token
    const callerId = resolveCallerId(req);
    if (savedOnly && !callerId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

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

    // #1658: per-FNS service filter — Record<fnsId, string[]>
    let fnsServices: Record<string, string[]> | null = null;
    const fnsServicesRaw = (req.query.fnsServices as string) || undefined;
    if (fnsServicesRaw) {
      try {
        const parsed = JSON.parse(decodeURIComponent(fnsServicesRaw));
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          fnsServices = parsed as Record<string, string[]>;
          // Validate each key is UUID and each value is an array of strings
          for (const [fnsId, svcIds] of Object.entries(fnsServices)) {
            if (!uuidRegex.test(fnsId) || !Array.isArray(svcIds)) {
              res.status(400).json({ error: "Invalid fnsServices format" });
              return;
            }
          }
        }
      } catch {
        // malformed JSON — ignore, degrade gracefully
        fnsServices = null;
      }
    }

    // Iter11: catalog is gated by isSpecialist flag + completed onboarding,
    // not by the retired SPECIALIST role value. Also exclude the caller from
    // their own catalog view — showing yourself as a specialist you could
    // contact is a bug, not a feature.
    const seedUserNot = notSeedUserWhere();
    const where: Prisma.UserWhereInput = {
      isSpecialist: true,
      // Iter13: only show specialists who opted in to public catalog.
      isPublicProfile: true,
      specialistProfileCompletedAt: { not: null },
      isAvailable: true,
      isBanned: false,
      // Hide soft-deleted accounts from the public catalog.
      deletedAt: null,
      ...(callerId ? { id: { not: callerId } } : {}),
      ...(seedUserNot ?? {}),
      // savedOnly: restrict to specialists saved by the authenticated caller
      ...(savedOnly && callerId
        ? { savedByUsers: { some: { userId: callerId } } }
        : {}),
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

    // #1658: per-FNS services filter — specialist must cover the FNS with matching services
    if (fnsServices && Object.keys(fnsServices).length > 0) {
      where.specialistFns = {
        some: {
          OR: Object.entries(fnsServices).map(([fnsId, svcIds]) => ({
            fnsId,
            ...(svcIds.length > 0
              ? { services: { some: { serviceId: { in: svcIds } } } }
              : {}),
          })),
        },
      };
    }

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        // Catalog ranking: specialists with avatar photos first, then newest.
        // `avatarUrl` desc + nulls:last puts non-null URLs before null ones (Prisma 6.x).
        orderBy: [
          { avatarUrl: { sort: "desc", nulls: "last" } },
          { createdAt: "desc" },
        ],
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

// GET /api/specialists/dashboard — specialist's own dashboard data (auth required)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.get("/dashboard", authMiddleware, requireSpecialistFeatures, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    // Get specialist user info and isAvailable flag
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAvailable: true },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Get all threads for this specialist
    const threads = await prisma.thread.findMany({
      where: { specialistId: userId },
      select: { id: true, requestId: true, specialistLastReadAt: true },
    });

    // Count unread messages (new messages since specialist last read each thread)
    let newMessages = 0;
    for (const thread of threads) {
      const unread = await prisma.message.count({
        where: {
          threadId: thread.id,
          senderId: { not: userId },
          ...(thread.specialistLastReadAt
            ? { createdAt: { gt: thread.specialistLastReadAt } }
            : {}),
        },
      });
      newMessages += unread;
    }

    const threadByRequest = new Map(threads.map((t) => [t.requestId, t.id]));

    // Get specialist's covered FNS/city ids for region matching
    const specialistFns = await prisma.specialistFns.findMany({
      where: { specialistId: userId },
      select: { fnsId: true, fns: { select: { cityId: true } } },
    });

    const fnsIds = specialistFns.map((sf) => sf.fnsId);
    const cityIds = [...new Set(specialistFns.map((sf) => sf.fns.cityId))];

    const requestInclude = {
      city: true,
      fns: true,
    } as const;

    const [myRequests, otherRequests] = await Promise.all([
      fnsIds.length > 0
        ? prisma.request.findMany({
            where: { status: { not: "CLOSED" }, fnsId: { in: fnsIds }, cityId: { in: cityIds } },
            orderBy: { createdAt: "desc" },
            include: requestInclude,
          })
        : Promise.resolve([]),
      prisma.request.findMany({
        where: {
          status: { not: "CLOSED" },
          ...(fnsIds.length > 0
            ? { NOT: { fnsId: { in: fnsIds }, cityId: { in: cityIds } } }
            : {}),
        },
        orderBy: { createdAt: "desc" },
        include: requestInclude,
      }),
    ]);

    const mapRequest = (r: (typeof myRequests)[number], isMyRegion: boolean) => {
      const threadId = threadByRequest.get(r.id) ?? null;
      return {
        id: r.id,
        title: r.title,
        description: r.description,
        status: r.status,
        createdAt: r.createdAt,
        city: { id: r.city.id, name: r.city.name },
        fns: { id: r.fns.id, name: r.fns.name, code: r.fns.code },
        isMyRegion,
        hasThread: threadId !== null,
        threadId,
      };
    };

    const matchingRequests = [
      ...myRequests.map((r) => mapRequest(r, true)),
      ...otherRequests.map((r) => mapRequest(r, false)),
    ];

    res.json({
      isAvailable: user.isAvailable,
      activeThreads: threads.length,
      matchingRequests,
      stats: { threadsTotal: threads.length, newMessages },
    });
  } catch (error) {
    console.error("specialists/dashboard error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/specialists/availability — toggle specialist availability (auth required)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.patch("/availability", authMiddleware, requireSpecialistFeatures, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { isAvailable } = req.body as { isAvailable?: unknown };

    if (typeof isAvailable !== "boolean") {
      res.status(400).json({ error: "isAvailable must be a boolean" });
      return;
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { isAvailable },
      select: { isAvailable: true },
    });

    res.json({ isAvailable: updated.isAvailable });
  } catch (error) {
    console.error("specialists/availability error:", error);
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
    // Drop the isSpecialist gate: clients click 'Посмотреть мой профиль'
    // from settings even when they haven't toggled specialist mode on,
    // and DM senders need to land on a renderable page after creating a
    // direct thread with anyone. We still 404 banned / soft-deleted.
    const specialist = await prisma.user.findFirst({
      where: {
        id,
        isBanned: false,
        deletedAt: null,
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

    // Minimal payload for two cases:
    //   * non-specialist users (haven't toggled 'Я специалист' on)
    //   * specialist with isAvailable=false (hid from catalog)
    // In both cases the FE renders the 'Профиль закрыт' card with first
    // name + last initial only — никаких аватаров, контактов, рабочей
    // зоны или описания. Это даёт владельцу профиля честное preview
    // того, как его видят другие, не вскрывая приватных полей.
    if (!specialist.isSpecialist || !specialist.isAvailable) {
      const lastNameInitial =
        specialist.lastName ? specialist.lastName[0] + "." : null;
      res.json({
        id: specialist.id,
        firstName: specialist.firstName,
        lastNameInitial,
        avatarUrl: null,
        isAvailable: false,
      });
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

    // Security: strip contact fields for anonymous callers (#P0)
    const callerId = resolveCallerId(req);
    const isAnon = callerId === null;

    res.json({
      id: specialist.id,
      firstName: specialist.firstName,
      lastName: specialist.lastName,
      // Presign so <Image> can fetch directly. Storing the bare key in
      // user.avatarUrl ('avatars/uuid.jpg') means the FE can't render it
      // without going through the presign endpoint — was rendering as a
      // broken <img> on the public detail page (user feedback).
      avatarUrl: await presignAvatarUrl(specialist.avatarUrl).catch(() => null),
      isAvailable: specialist.isAvailable,
      createdAt: specialist.createdAt,
      requestsCount,
      profile: profile
        ? {
            description: profile.description,
            phone: isAnon ? null : profile.phone,
            telegram: isAnon ? null : profile.telegram,
            whatsapp: isAnon ? null : profile.whatsapp,
            officeAddress: isAnon ? null : profile.officeAddress,
            workingHours: profile.workingHours,
            exFnsStartYear: profile.exFnsStartYear,
            exFnsEndYear: profile.exFnsEndYear,
            yearsOfExperience: profile.yearsOfExperience,
            specializations: (profile.specializations as string[] | null) ?? null,
            certifications: (profile.certifications as string[] | null) ?? null,
            // Wave 5/6: long-form free-text editable from /profile?tab=specialist.
            experienceText: profile.experienceText,
            specializationText: profile.specializationText,
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
