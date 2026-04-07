import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSpecialistProfileDto } from './dto/create-specialist-profile.dto';
import { UpdateSpecialistProfileDto } from './dto/update-specialist-profile.dto';

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
        cities: dto.cities,
        services: dto.services,
        badges: dto.badges ?? [],
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

    return this.prisma.specialistProfile.update({
      where: { userId },
      data: dto,
    });
  }

  async getProfile(nick: string) {
    const profile = await this.prisma.specialistProfile.findUnique({
      where: { nick },
    });
    if (!profile) throw new NotFoundException('Specialist not found');

    const activity = await this.computeActivity(profile.userId);
    return { ...profile, activity };
  }

  async getCatalog(city?: string, badge?: string, sort?: string, services?: string) {
    const now = new Date();
    const where: any = {};
    if (city) where.cities = { has: city };
    if (badge) where.badges = { has: badge };
    if (services && services.trim()) {
      where.services = { has: services.trim() };
    }

    const profiles = await this.prisma.specialistProfile.findMany({
      where,
    });

    // Get active promotions to rank promoted specialists first
    const promoted = await this.prisma.promotion.findMany({
      where: { expiresAt: { gt: now } },
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

    // Build result with promotion rank and activity
    const result = profiles.map((profile) => ({
      ...profile,
      promoted: promotionMap.has(profile.userId),
      promotionTier: promotionMap.get(profile.userId) ?? 0,
      activity: { responseCount: countMap.get(profile.userId) ?? 0 },
    }));

    // Sort: promoted first (by tier desc), then by sort param
    result.sort((a, b) => {
      if (b.promotionTier !== a.promotionTier) return b.promotionTier - a.promotionTier;
      if (sort === 'responses') return (b.activity.responseCount) - (a.activity.responseCount);
      // Default: newest first
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    return result;
  }

  private async computeActivity(userId: string) {
    const responseCount = await this.prisma.response.count({
      where: { specialistId: userId },
    });
    return { responseCount };
  }
}
