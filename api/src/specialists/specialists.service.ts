import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSpecialistProfileDto } from './dto/create-specialist-profile.dto';
import { UpdateSpecialistProfileDto } from './dto/update-specialist-profile.dto';
import { StorageService } from '../storage/storage.service';

// Specialists cannot self-assign badges — all badges are admin-only
const ALLOWED_BADGES: string[] = [];

/** Set intersection helper for join table filtering */
function intersectSets<T>(a: Set<T>, b: Set<T>): Set<T> {
  const result = new Set<T>();
  for (const item of a) {
    if (b.has(item)) result.add(item);
  }
  return result;
}

@Injectable()
export class SpecialistsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Sync SpecialistFns + SpecialistService join tables from structured fnsServices data.
   * Deletes existing join rows and recreates them (full replace strategy).
   */
  private async syncJoinTables(
    specialistProfileId: string,
    fnsServices: Array<{ fnsId: string; serviceNames: string[] }>,
  ) {
    await this.prisma.specialistService.deleteMany({ where: { specialistId: specialistProfileId } });
    await this.prisma.specialistFns.deleteMany({ where: { specialistId: specialistProfileId } });

    // Batch create FNS links
    const uniqueFnsIds = [...new Set(fnsServices.map((e) => e.fnsId))];
    if (uniqueFnsIds.length > 0) {
      await this.prisma.specialistFns.createMany({
        data: uniqueFnsIds.map((fnsId) => ({ specialistId: specialistProfileId, fnsId })),
        skipDuplicates: true,
      });
    }

    // Collect all unique service names and resolve them in one query
    const allServiceNames = [...new Set(fnsServices.flatMap((e) => e.serviceNames))];
    const serviceRecords = allServiceNames.length > 0
      ? await this.prisma.service.findMany({ where: { name: { in: allServiceNames } } })
      : [];
    const serviceMap = new Map(serviceRecords.map((s) => [s.name, s.id]));

    // Batch create service links
    const serviceLinks: Array<{ specialistId: string; fnsId: string; serviceId: string }> = [];
    for (const entry of fnsServices) {
      for (const svcName of entry.serviceNames) {
        const serviceId = serviceMap.get(svcName);
        if (!serviceId) continue;
        serviceLinks.push({ specialistId: specialistProfileId, fnsId: entry.fnsId, serviceId });
      }
    }
    if (serviceLinks.length > 0) {
      await this.prisma.specialistService.createMany({
        data: serviceLinks,
        skipDuplicates: true,
      });
    }
  }

  async createProfile(userId: string, dto: CreateSpecialistProfileDto) {
    const existing = await this.prisma.specialistProfile.findUnique({ where: { userId } });
    if (existing) throw new ConflictException('Profile already exists');

    const nickTaken = await this.prisma.specialistProfile.findUnique({ where: { nick: dto.nick } });
    if (nickTaken) throw new ConflictException('Nick already taken');

    // Sync fnsOffices from fnsDepartmentsData if provided
    let fnsOffices = dto.fnsOffices;
    let fnsDepartmentsData = dto.fnsDepartmentsData;
    if (fnsDepartmentsData && fnsDepartmentsData.length > 0) {
      fnsOffices = [...new Set(fnsDepartmentsData.map((x) => x.office))];
    }

    const profile = await this.prisma.specialistProfile.create({
      data: {
        userId,
        nick: dto.nick,
        displayName: dto.displayName,
        bio: dto.bio,
        headline: dto.headline,
        experience: dto.experience,
        cities: dto.cities,
        services: dto.services,
        badges: (dto.badges ?? []).filter((b) => ALLOWED_BADGES.includes(b)),
        fnsOffices: fnsOffices ?? [],
        fnsDepartmentsData: fnsDepartmentsData ?? undefined,
        contacts: dto.contacts,
      },
    });

    // Write join tables when fnsServices is provided
    if (dto.fnsServices && dto.fnsServices.length > 0) {
      await this.syncJoinTables(profile.id, dto.fnsServices);
    }

    return profile;
  }

  async getMyProfile(userId: string) {
    const profile = await this.prisma.specialistProfile.findUnique({
      where: { userId },
      include: {
        specialistFns: { include: { fns: { include: { city: true } } } },
        specialistServices: { include: { fns: true, service: true } },
      },
    });
    if (!profile) throw new NotFoundException('Profile not found');

    const activity = await this.computeActivity(userId);
    const fnsGroupedByCity = this.groupFnsByCity(profile.specialistFns, profile.specialistServices);
    return { ...profile, activity, fnsGroupedByCity };
  }

  async updateProfile(userId: string, dto: UpdateSpecialistProfileDto) {
    const profile = await this.prisma.specialistProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Profile not found');

    // Validate badges against allowed list
    const data: any = { ...dto };
    if (data.badges) {
      data.badges = data.badges.filter((b: string) => ALLOWED_BADGES.includes(b));
    }

    // Sync fnsOffices from fnsDepartmentsData if provided
    if (data.fnsDepartmentsData && Array.isArray(data.fnsDepartmentsData) && data.fnsDepartmentsData.length > 0) {
      data.fnsOffices = [...new Set(data.fnsDepartmentsData.map((x: any) => x.office))];
    }

    const updated = await this.prisma.specialistProfile.update({
      where: { userId },
      data,
    });

    // Write join tables when fnsServices is provided
    if (dto.fnsServices && dto.fnsServices.length > 0) {
      await this.syncJoinTables(updated.id, dto.fnsServices);
    }

    return updated;
  }

  /**
   * Group FNS offices by city from join table data.
   * Returns array of { city, offices: [{ fnsId, fnsName, services: [string] }] }
   */
  private groupFnsByCity(
    specialistFns: Array<{ fnsId: string; fns: { id: string; name: string; city: { id: string; name: string } } }>,
    specialistServices: Array<{ fnsId: string; fns: { name: string }; service: { name: string } }>,
  ) {
    const cityMap = new Map<string, { city: string; offices: Map<string, { fnsId: string; fnsName: string; services: string[] }> }>();

    for (const sf of specialistFns) {
      const cityName = sf.fns.city.name;
      if (!cityMap.has(cityName)) {
        cityMap.set(cityName, { city: cityName, offices: new Map() });
      }
      const cityEntry = cityMap.get(cityName)!;
      if (!cityEntry.offices.has(sf.fnsId)) {
        cityEntry.offices.set(sf.fnsId, { fnsId: sf.fnsId, fnsName: sf.fns.name, services: [] });
      }
    }

    for (const ss of specialistServices) {
      // Find the city entry that contains this fnsId
      for (const [, cityEntry] of cityMap) {
        const office = cityEntry.offices.get(ss.fnsId);
        if (office && !office.services.includes(ss.service.name)) {
          office.services.push(ss.service.name);
        }
      }
    }

    return Array.from(cityMap.values()).map(({ city, offices }) => ({
      city,
      offices: Array.from(offices.values()),
    }));
  }

  async getProfile(nick: string, requestingUser: { id: string } | null = null) {
    const profile = await this.prisma.specialistProfile.findUnique({
      where: { nick },
      include: {
        specialistFns: { include: { fns: { include: { city: true } } } },
        specialistServices: { include: { fns: true, service: true } },
      },
    });
    if (!profile) throw new NotFoundException('Specialist not found');

    const activity = await this.computeActivity(profile.userId);
    const fnsGroupedByCity = this.groupFnsByCity(profile.specialistFns, profile.specialistServices);

    // Strip internal profile id; expose userId so clients can open a direct chat thread.
    // userId is non-sensitive (already broadcast in chat presence events).
    const { id: _id, specialistFns: _sf, specialistServices: _ss, ...publicProfile } = profile;
    return {
      ...publicProfile,
      activity,
      rating: activity.avgRating,
      reviewCount: activity.reviewCount,
      fnsGroupedByCity,
    };
  }

  async getAvailableCities(): Promise<string[]> {
    const profiles = await this.prisma.specialistProfile.findMany({
      select: { cities: true },
      take: 5000,
    });
    const citySet = new Set<string>();
    for (const profile of profiles) {
      for (const city of profile.cities) {
        if (city && city.trim()) citySet.add(city.trim());
      }
    }
    return Array.from(citySet).sort((a, b) => a.localeCompare(b, 'ru'));
  }

  async getCatalog(city?: string, badge?: string, sort?: string, search?: string, fns?: string, category?: string, page: number = 1, limit: number = 20, offset?: number, serviceId?: string) {
    // Cap limit to prevent abuse
    if (limit > 50) limit = 50;
    if (limit < 1) limit = 1;
    const now = new Date();
    const profileWhere: any = { displayName: { not: null }, isAvailable: true };
    if (city) {
      // Support comma-separated list of cities (multi-select)
      const cityList = city.split(',').map((c) => c.trim()).filter(Boolean);
      if (cityList.length === 1) {
        profileWhere.cities = { has: cityList[0] };
      } else if (cityList.length > 1) {
        profileWhere.cities = { hasSome: cityList };
      }
    }
    if (badge) profileWhere.badges = { has: badge };

    // --- Join table filters ---
    // Collect specialist profile IDs that match join-table filters, then intersect
    let joinFilteredProfileIds: Set<string> | null = null;

    // FNS filter: query specialist_fns join table by Ifns code/name
    if (fns) {
      const fnsList = fns.split(',').map((f) => f.trim()).filter(Boolean);
      // Try matching by Ifns code or name
      const matchingIfns = await this.prisma.ifns.findMany({
        where: {
          OR: [
            { code: { in: fnsList } },
            { name: { in: fnsList } },
            { id: { in: fnsList } },
          ],
        },
        select: { id: true },
      });
      const ifnsIds = matchingIfns.map((i) => i.id);
      if (ifnsIds.length > 0) {
        const sfRecords = await this.prisma.specialistFns.findMany({
          where: { fnsId: { in: ifnsIds } },
          select: { specialistId: true },
        });
        const ids = new Set(sfRecords.map((r) => r.specialistId));
        joinFilteredProfileIds = joinFilteredProfileIds ? intersectSets(joinFilteredProfileIds, ids) : ids;
      } else {
        // No matching IFNS records — no results possible
        joinFilteredProfileIds = new Set();
      }

      // Also keep legacy String[] filter for backward compat during migration
      profileWhere.fnsOffices = fnsList.length === 1 ? { has: fnsList[0] } : { hasSome: fnsList };
    }

    // Category/service filter: query specialist_services join table
    if (category && category.trim()) {
      const svcName = category.trim();
      // Look up Service record by name
      const svcRecord = await this.prisma.service.findUnique({ where: { name: svcName } });
      if (svcRecord) {
        const ssRecords = await this.prisma.specialistService.findMany({
          where: { serviceId: svcRecord.id },
          select: { specialistId: true },
        });
        const ids = new Set(ssRecords.map((r) => r.specialistId));
        joinFilteredProfileIds = joinFilteredProfileIds ? intersectSets(joinFilteredProfileIds, ids) : ids;
      }

      // Also keep legacy String[] filter for backward compat
      profileWhere.services = { hasSome: [svcName] };
    }

    // ServiceId filter: direct lookup by service ID
    if (serviceId) {
      const ssRecords = await this.prisma.specialistService.findMany({
        where: { serviceId },
        select: { specialistId: true },
      });
      const ids = new Set(ssRecords.map((r) => r.specialistId));
      joinFilteredProfileIds = joinFilteredProfileIds ? intersectSets(joinFilteredProfileIds, ids) : ids;
    }

    // Apply join table filter to profileWhere
    if (joinFilteredProfileIds !== null) {
      if (joinFilteredProfileIds.size === 0) {
        // No matches — return empty result immediately
        return { items: [], total: 0, page, pages: 0 };
      }
      // We need to filter by profile id — fetch profile IDs from userIds
      // Actually joinFilteredProfileIds contains specialistProfile.id values
      profileWhere.id = { in: Array.from(joinFilteredProfileIds) };
    }

    // Search filter: match against displayName, nick, services (partial ILIKE), cities, bio
    if (search && search.trim()) {
      const term = search.trim();

      // Find userIds whose services array contains a partial match via PostgreSQL unnest + ILIKE
      const pattern = `%${term}%`;
      const serviceMatchIds = await this.prisma.$queryRaw<{ userId: string }[]>(
        Prisma.sql`SELECT "userId" FROM specialist_profiles WHERE EXISTS (SELECT 1 FROM unnest(services) AS s WHERE s ILIKE ${pattern})`,
      );
      const serviceUserIds = serviceMatchIds.map((r) => r.userId);

      profileWhere.OR = [
        { displayName: { contains: term, mode: 'insensitive' } },
        { nick: { contains: term, mode: 'insensitive' } },
        { bio: { contains: term, mode: 'insensitive' } },
        ...(serviceUserIds.length > 0 ? [{ userId: { in: serviceUserIds } }] : []),
      ];
    }

    // Determine DB-level orderBy for sorts that map directly to profile columns.
    // Cross-table sorts (rating, responses) and promotion-tier re-ordering are handled in JS
    // after fetching aggregates, but DB pre-sort reduces JS comparison work.
    let dbOrderBy: any;
    if (sort === 'experience') {
      dbOrderBy = [{ experience: 'desc' }, { createdAt: 'desc' }];
    } else {
      // Default and rating/responses: pre-sort by newest; JS will re-rank by aggregates
      dbOrderBy = { createdAt: 'desc' };
    }

    // PASS 1: Fetch all filtered profiles (lightweight — only fields needed for sorting)
    const allProfiles = await this.prisma.specialistProfile.findMany({
      where: profileWhere,
      orderBy: dbOrderBy,
      select: { userId: true, experience: true, createdAt: true },
    });

    // Get active promotions for ALL matching userIds (needed for correct sort order)
    const allUserIds = allProfiles.map((p) => p.userId);
    const promotionWhere: any = { expiresAt: { gt: now }, specialistId: { in: allUserIds } };
    if (city) {
      const cityList = city.split(',').map((c) => c.trim()).filter(Boolean);
      promotionWhere.city = cityList.length === 1 ? cityList[0] : { in: cityList };
    }
    const promoted = await this.prisma.promotion.findMany({
      where: promotionWhere,
      select: { specialistId: true, tier: true },
    });

    // Map specialistId -> highest tier (TOP > FEATURED > BASIC)
    const tierOrder: Record<string, number> = { TOP: 3, FEATURED: 2, BASIC: 1 };
    const promotionMap = new Map<string, number>();
    for (const p of promoted) {
      const current = promotionMap.get(p.specialistId) ?? 0;
      const tierVal = tierOrder[p.tier] ?? 0;
      if (tierVal > current) promotionMap.set(p.specialistId, tierVal);
    }

    // Compute activity aggregates for all profiles in batch (for sort by rating/responses)
    // Post-migration: "responses" replaced by threads owned by the specialist
    const threadCountsRaw = await this.prisma.thread.groupBy({
      by: ['specialistId'],
      where: { specialistId: { in: allUserIds } },
      _count: { id: true },
    });
    const countMap = new Map<string, number>(
      threadCountsRaw
        .filter((r): r is typeof r & { specialistId: string } => r.specialistId !== null)
        .map((r) => [r.specialistId, r._count.id]),
    );

    const ratingAggs = await this.prisma.review.groupBy({
      by: ['specialistId'],
      where: { specialistId: { in: allUserIds } },
      _avg: { rating: true },
      _count: { id: true },
    });
    const ratingMap = new Map(
      ratingAggs.map((r) => [
        r.specialistId,
        { avgRating: r._avg.rating ?? null, reviewCount: r._count.id },
      ]),
    );

    // Re-sort in-memory only when promotions are present (promoted profiles bubble up)
    // or when sort requires cross-table aggregates (rating, responses).
    // For experience/newest with no promotions, DB orderBy already produced the correct order.
    const hasPromotions = promotionMap.size > 0;
    const needsJsSort = hasPromotions || sort === 'rating' || sort === 'responses';
    if (needsJsSort) {
      allProfiles.sort((a, b) => {
        const aTier = promotionMap.get(a.userId) ?? 0;
        const bTier = promotionMap.get(b.userId) ?? 0;
        if (bTier !== aTier) return bTier - aTier;
        if (sort === 'responses') {
          return (countMap.get(b.userId) ?? 0) - (countMap.get(a.userId) ?? 0);
        }
        if (sort === 'experience') return (b.experience ?? 0) - (a.experience ?? 0);
        if (sort === 'rating') {
          const aRating = ratingMap.get(a.userId)?.avgRating ?? 0;
          const bRating = ratingMap.get(b.userId)?.avgRating ?? 0;
          return bRating - aRating;
        }
        // Default: newest first (already sorted by DB, preserve order)
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
    }

    const total = allProfiles.length;
    const pages = Math.ceil(total / limit);
    const skip = offset !== undefined ? offset : (page - 1) * limit;
    const pageUserIds = allProfiles.slice(skip, skip + limit).map((p) => p.userId);

    // PASS 2: Fetch full data only for the current page
    const pageProfiles = await this.prisma.specialistProfile.findMany({
      where: { userId: { in: pageUserIds } },
    });

    // Restore sort order (DB does not guarantee order for IN queries)
    const orderedProfiles = pageUserIds
      .map((id) => pageProfiles.find((p) => p.userId === id))
      .filter((p): p is NonNullable<typeof p> => p !== undefined);

    // Build result with promotion rank and activity
    const items = orderedProfiles.map((profile) => {
      // Strip internal IDs, contacts and full bio from public catalog response
      const { contacts: _contacts, bio, id: _id, userId, ...rest } = profile;
      const ratingData = ratingMap.get(userId);
      const memberSince = new Date(rest.createdAt).getFullYear();
      const headline = rest.headline || (bio ? bio.slice(0, 100) : null);
      return {
        ...rest,
        bio: undefined,
        headline,
        memberSince,
        promoted: promotionMap.has(userId),
        promotionTier: promotionMap.get(userId) ?? 0,
        activity: {
          responseCount: countMap.get(userId) ?? 0,
          avgRating: ratingData?.avgRating ?? null,
          reviewCount: ratingData?.reviewCount ?? 0,
        },
      };
    });

    return { items, total, page, pages };
  }

  /**
   * Replace the specialist's work-area assignments (FNS + services).
   *
   * Request shape: `workAreas: [{ fnsId: "<cityId:ifnsId>" | "<ifnsId>", departments?: string[] }]`.
   * `departments` contains Service names (e.g. "Выездная проверка") which are
   * mapped to Service rows and inserted into SpecialistService.
   *
   * Behaviour:
   * - Full replace: wipes existing SpecialistFns + SpecialistService rows first.
   * - Auto-creates SpecialistProfile on first save (nick = user.username).
   * - Promotes the user to SPECIALIST on successful save.
   * - Throws 400 when workAreas is empty or composite fnsId cannot be parsed.
   */
  async saveWorkAreas(
    userId: string,
    workAreas: Array<{ fnsId: string; departments?: string[] }>,
  ): Promise<{ ok: true; count: number }> {
    if (!Array.isArray(workAreas) || workAreas.length === 0) {
      throw new BadRequestException('Нужно выбрать хотя бы одну ФНС');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (!user.username) {
      throw new BadRequestException('Username must be set before saving work areas');
    }

    // Parse composite "cityId:ifnsId" → take the second segment. If no colon,
    // treat the whole value as a bare ifnsId (legacy flow).
    const parsed = workAreas.map((w) => {
      const raw = String(w.fnsId ?? '').trim();
      if (!raw) throw new BadRequestException('fnsId не может быть пустым');
      const idx = raw.indexOf(':');
      const ifnsId = idx >= 0 ? raw.slice(idx + 1).trim() : raw;
      if (!ifnsId) throw new BadRequestException(`Некорректный fnsId: ${raw}`);
      const departments = Array.isArray(w.departments)
        ? w.departments.map((d) => d.trim()).filter(Boolean)
        : [];
      return { ifnsId, departments };
    });

    // Validate every ifnsId exists in Ifns table so we never persist dangling refs.
    const ifnsIds = [...new Set(parsed.map((p) => p.ifnsId))];
    const foundIfns = await this.prisma.ifns.findMany({
      where: { id: { in: ifnsIds } },
      select: { id: true, name: true, city: { select: { name: true } } },
    });
    const foundSet = new Set(foundIfns.map((f) => f.id));
    const missing = ifnsIds.filter((id) => !foundSet.has(id));
    if (missing.length > 0) {
      throw new BadRequestException(`ФНС не найдены: ${missing.join(', ')}`);
    }

    // Fetch or create SpecialistProfile (auto-create on first save).
    let profile = await this.prisma.specialistProfile.findUnique({ where: { userId } });
    if (!profile) {
      const nickTaken = await this.prisma.specialistProfile.findUnique({
        where: { nick: user.username },
      });
      if (nickTaken) throw new ConflictException('Nick already taken');
      profile = await this.prisma.specialistProfile.create({
        data: {
          userId,
          nick: user.username,
          cities: [],
          services: [],
          fnsOffices: [],
          badges: [],
        },
      });
    }

    // Resolve department names → Service ids (batch lookup).
    const allDeptNames = [...new Set(parsed.flatMap((p) => p.departments))];
    const services = allDeptNames.length > 0
      ? await this.prisma.service.findMany({ where: { name: { in: allDeptNames } } })
      : [];
    const serviceByName = new Map(services.map((s) => [s.name, s.id]));

    // Mirror data for legacy String[] columns so existing catalog filters keep working.
    const mirrorCities = [...new Set(foundIfns.map((f) => f.city.name))];
    const mirrorFnsOffices = [...new Set(foundIfns.map((f) => f.name))];
    const mirrorServices = [...new Set(allDeptNames.filter((n) => serviceByName.has(n)))];

    // Full-replace strategy: wipe then insert.
    await this.prisma.$transaction([
      this.prisma.specialistService.deleteMany({ where: { specialistId: profile.id } }),
      this.prisma.specialistFns.deleteMany({ where: { specialistId: profile.id } }),
    ]);

    // Batch insert SpecialistFns.
    await this.prisma.specialistFns.createMany({
      data: ifnsIds.map((fnsId) => ({ specialistId: profile!.id, fnsId })),
      skipDuplicates: true,
    });

    // Batch insert SpecialistService — only rows where Service name was found.
    const serviceLinks: Array<{ specialistId: string; fnsId: string; serviceId: string }> = [];
    for (const entry of parsed) {
      for (const deptName of entry.departments) {
        const serviceId = serviceByName.get(deptName);
        if (!serviceId) continue;
        serviceLinks.push({ specialistId: profile.id, fnsId: entry.ifnsId, serviceId });
      }
    }
    if (serviceLinks.length > 0) {
      await this.prisma.specialistService.createMany({
        data: serviceLinks,
        skipDuplicates: true,
      });
    }

    // Update profile mirror columns + mark profileComplete + promote role.
    await this.prisma.$transaction([
      this.prisma.specialistProfile.update({
        where: { id: profile.id },
        data: {
          cities: mirrorCities,
          fnsOffices: mirrorFnsOffices,
          services: mirrorServices.length > 0 ? mirrorServices : profile.services,
          profileComplete: true,
        },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { role: Role.SPECIALIST },
      }),
    ]);

    return { ok: true, count: parsed.length };
  }

  async updateAvatarUrl(userId: string, avatarUrl: string) {
    const profile = await this.prisma.specialistProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Profile not found');
    return this.prisma.specialistProfile.update({
      where: { userId },
      data: { avatarUrl },
    });
  }

  async deleteAvatar(userId: string, storageService?: StorageService) {
    const profile = await this.prisma.specialistProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Profile not found');

    // If no avatar, nothing to do
    if (!profile.avatarUrl) return { message: 'No avatar to delete' };

    const avatarUrl = profile.avatarUrl;

    if (storageService?.isS3Enabled && avatarUrl.startsWith('http')) {
      // S3/MinIO avatar — delete from bucket
      const key = storageService.extractKey(avatarUrl);
      await storageService.deleteFile(key);
    } else if (avatarUrl.startsWith('/api/uploads/')) {
      // Local disk avatar — delete the file
      const filename = avatarUrl.split('/').pop();
      if (filename) {
        const filePath = join(__dirname, '..', '..', 'uploads', 'avatars', filename);
        if (existsSync(filePath)) {
          await unlink(filePath).catch(() => {
            // Ignore errors if file already gone — still clear DB
          });
        }
      }
    }

    await this.prisma.specialistProfile.update({
      where: { userId },
      data: { avatarUrl: null },
    });

    return { message: 'Avatar deleted' };
  }

  async adminUpdateBadges(specialistId: string, badges: string[]) {
    const profile = await this.prisma.specialistProfile.findUnique({ where: { userId: specialistId } });
    if (!profile) throw new NotFoundException('Profile not found');
    return this.prisma.specialistProfile.update({
      where: { userId: specialistId },
      data: { badges },
    });
  }

  async getFeatured(limit = 50) {
    const profiles = await this.prisma.specialistProfile.findMany({
      where: { displayName: { not: null } },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        nick: true,
        displayName: true,
        avatarUrl: true,
        cities: true,
        services: true,
        badges: true,
        experience: true,
        headline: true,
        createdAt: true,
      },
    });
    return profiles;
  }

  async getPopularCities(limit = 50) {
    const profiles = await this.prisma.specialistProfile.findMany({
      select: { cities: true },
      take: 5000,
    });
    const cityCount = new Map<string, number>();
    for (const profile of profiles) {
      for (const city of profile.cities) {
        const trimmed = city?.trim();
        if (trimmed) cityCount.set(trimmed, (cityCount.get(trimmed) ?? 0) + 1);
      }
    }
    return Array.from(cityCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([city, count]) => ({ city, count }));
  }

  private async computeActivity(userId: string) {
    // Post-migration: "responseCount" = number of threads specialist opened (direct-chat flow)
    const [responseCount, ratingAgg] = await Promise.all([
      this.prisma.thread.count({ where: { specialistId: userId } }),
      this.prisma.review.aggregate({
        where: { specialistId: userId },
        _avg: { rating: true },
        _count: { id: true },
      }),
    ]);
    return {
      responseCount,
      avgRating: ratingAgg._avg.rating ?? null,
      reviewCount: ratingAgg._count.id,
    };
  }
}
