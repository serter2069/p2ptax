import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSpecialistProfileDto } from './dto/create-specialist-profile.dto';
import { UpdateSpecialistProfileDto } from './dto/update-specialist-profile.dto';
import { StorageService } from '../storage/storage.service';

// Specialists cannot self-assign badges — all badges are admin-only
const ALLOWED_BADGES: string[] = [];

@Injectable()
export class SpecialistsService {
  constructor(private prisma: PrismaService) {}

  async createProfile(userId: string, dto: CreateSpecialistProfileDto) {
    const existing = await this.prisma.specialistProfile.findUnique({ where: { userId } });
    if (existing) throw new ConflictException('Profile already exists');

    const nickTaken = await this.prisma.specialistProfile.findUnique({ where: { nick: dto.nick } });
    if (nickTaken) throw new ConflictException('Nick already taken');

    return this.prisma.specialistProfile.create({
      data: {
        userId,
        nick: dto.nick,
        displayName: dto.displayName,
        bio: dto.bio,
        experience: dto.experience,
        cities: dto.cities,
        services: dto.services,
        badges: (dto.badges ?? []).filter((b) => ALLOWED_BADGES.includes(b)),
        contacts: dto.contacts,
      },
    });
  }

  async getMyProfile(userId: string) {
    const profile = await this.prisma.specialistProfile.findUnique({
      where: { userId },
    });
    if (!profile) throw new NotFoundException('Profile not found');

    const activity = await this.computeActivity(userId);
    return { ...profile, activity };
  }

  async updateProfile(userId: string, dto: UpdateSpecialistProfileDto) {
    const profile = await this.prisma.specialistProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Profile not found');

    // Validate badges against allowed list
    const data = { ...dto };
    if (data.badges) {
      data.badges = data.badges.filter((b) => ALLOWED_BADGES.includes(b));
    }

    return this.prisma.specialistProfile.update({
      where: { userId },
      data,
    });
  }

  async getProfile(nick: string, requestingUser: { id: string } | null = null) {
    const profile = await this.prisma.specialistProfile.findUnique({
      where: { nick },
    });
    if (!profile) throw new NotFoundException('Specialist not found');

    const activity = await this.computeActivity(profile.userId);
    // Strip internal IDs from public profile response; contacts only for authenticated users
    const { id: _id, userId: _userId, contacts, ...publicProfile } = profile;
    return {
      ...publicProfile,
      ...(requestingUser ? { contacts } : {}),
      activity,
      rating: activity.avgRating,
      reviewCount: activity.reviewCount,
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

  async getCatalog(city?: string, badge?: string, sort?: string, search?: string, fns?: string, category?: string, page: number = 1, limit: number = 20, offset?: number) {
    // Cap limit to prevent abuse
    if (limit > 50) limit = 50;
    if (limit < 1) limit = 1;
    const now = new Date();
    const profileWhere: any = { displayName: { not: null } };
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
    if (fns) {
      const fnsList = fns.split(',').map((f) => f.trim()).filter(Boolean);
      profileWhere.fnsOffices = fnsList.length === 1 ? { has: fnsList[0] } : { hasSome: fnsList };
    }

    // Category filter: match against services array
    if (category && category.trim()) {
      profileWhere.services = { hasSome: [category.trim()] };
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
    const responseCounts = await this.prisma.response.groupBy({
      by: ['specialistId'],
      where: { specialistId: { in: allUserIds } },
      _count: { id: true },
    });
    const countMap = new Map(responseCounts.map((r) => [r.specialistId, r._count.id]));

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
      // Strip internal IDs, contacts and bio from public catalog response
      const { contacts: _contacts, bio: _bio, id: _id, userId, ...rest } = profile;
      const ratingData = ratingMap.get(userId);
      return {
        ...rest,
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

  async getFeatured(limit = 8) {
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
    const [responseCount, ratingAgg] = await Promise.all([
      this.prisma.response.count({ where: { specialistId: userId } }),
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
