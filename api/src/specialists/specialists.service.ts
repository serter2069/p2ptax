import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSpecialistProfileDto } from './dto/create-specialist-profile.dto';
import { UpdateSpecialistProfileDto } from './dto/update-specialist-profile.dto';

// Badges users can self-assign; 'familiar' and 'fns_insider' require admin
const ALLOWED_BADGES = ['verified'];

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

    if (dto.nick && dto.nick !== profile.nick) {
      const nickTaken = await this.prisma.specialistProfile.findUnique({ where: { nick: dto.nick } });
      if (nickTaken) throw new ConflictException('Nick already taken');
    }

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

  async getProfile(nick: string) {
    const profile = await this.prisma.specialistProfile.findUnique({
      where: { nick },
    });
    if (!profile) throw new NotFoundException('Specialist not found');

    const activity = await this.computeActivity(profile.userId);
    return {
      ...profile,
      activity,
      rating: activity.avgRating,
      reviewCount: activity.reviewCount,
    };
  }

  async getAvailableCities(): Promise<string[]> {
    const profiles = await this.prisma.specialistProfile.findMany({
      select: { cities: true },
      take: 500,
    });
    const citySet = new Set<string>();
    for (const profile of profiles) {
      for (const city of profile.cities) {
        if (city && city.trim()) citySet.add(city.trim());
      }
    }
    return Array.from(citySet).sort((a, b) => a.localeCompare(b, 'ru'));
  }

  async getCatalog(city?: string, badge?: string, sort?: string, search?: string, fns?: string, category?: string) {
    const now = new Date();
    const where: any = { displayName: { not: null } };
    if (city) {
      // Support comma-separated list of cities (multi-select)
      const cityList = city.split(',').map((c) => c.trim()).filter(Boolean);
      if (cityList.length === 1) {
        where.cities = { has: cityList[0] };
      } else if (cityList.length > 1) {
        where.cities = { hasSome: cityList };
      }
    }
    if (badge) where.badges = { has: badge };
    if (fns) {
      const fnsList = fns.split(',').map((f) => f.trim()).filter(Boolean);
      where.fnsOffices = fnsList.length === 1 ? { has: fnsList[0] } : { hasSome: fnsList };
    }

    // Category filter: match against services array
    if (category && category.trim()) {
      where.services = { hasSome: [category.trim()] };
    }

    // Search filter: match against displayName, nick, services, cities, bio
    if (search && search.trim()) {
      const term = search.trim();
      where.OR = [
        { displayName: { contains: term, mode: 'insensitive' } },
        { nick: { contains: term, mode: 'insensitive' } },
        { bio: { contains: term, mode: 'insensitive' } },
        { services: { hasSome: [term] } },
      ];
    }

    const profiles = await this.prisma.specialistProfile.findMany({
      where,
    });

    // Get active promotions to rank promoted specialists first
    // When city filter is active, only show promoted badge for that city
    const promotionWhere: any = { expiresAt: { gt: now } };
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

    // Compute activity for all profiles
    const userIds = profiles.map((p) => p.userId);
    const responseCounts = await this.prisma.response.groupBy({
      by: ['specialistId'],
      where: { specialistId: { in: userIds } },
      _count: { id: true },
    });
    const countMap = new Map(responseCounts.map((r) => [r.specialistId, r._count.id]));

    // Compute rating aggregates for all profiles in one query
    const ratingAggs = await this.prisma.review.groupBy({
      by: ['specialistId'],
      where: { specialistId: { in: userIds } },
      _avg: { rating: true },
      _count: { id: true },
    });
    const ratingMap = new Map(
      ratingAggs.map((r) => [
        r.specialistId,
        { avgRating: r._avg.rating ?? null, reviewCount: r._count.id },
      ]),
    );

    // Build result with promotion rank and activity
    const result = profiles.map((profile) => {
      // contacts and bio excluded from public list response
      const { contacts: _contacts, bio: _bio, ...rest } = profile;
      const ratingData = ratingMap.get(rest.userId);
      return {
        ...rest,
        promoted: promotionMap.has(rest.userId),
        promotionTier: promotionMap.get(rest.userId) ?? 0,
        activity: {
          responseCount: countMap.get(rest.userId) ?? 0,
          avgRating: ratingData?.avgRating ?? null,
          reviewCount: ratingData?.reviewCount ?? 0,
        },
      };
    });

    // Sort: promoted first (by tier desc), then by sort param
    result.sort((a, b) => {
      if (b.promotionTier !== a.promotionTier) return b.promotionTier - a.promotionTier;
      if (sort === 'responses') return (b.activity.responseCount) - (a.activity.responseCount);
      if (sort === 'experience') return (b.experience ?? 0) - (a.experience ?? 0);
      if (sort === 'rating') {
        const aRating = a.activity.avgRating ?? 0;
        const bRating = b.activity.avgRating ?? 0;
        return bRating - aRating;
      }
      // Default: newest first
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    return result;
  }

  async adminUpdateBadges(specialistId: string, badges: string[]) {
    const profile = await this.prisma.specialistProfile.findUnique({ where: { userId: specialistId } });
    if (!profile) throw new NotFoundException('Profile not found');
    return this.prisma.specialistProfile.update({
      where: { userId: specialistId },
      data: { badges },
    });
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
