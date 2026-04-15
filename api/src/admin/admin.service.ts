import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers,
      totalSpecialists,
      activePromotions,
      monthPromotions,
      totalRequests,
      pendingComplaints,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: 'SPECIALIST' } }),
      this.prisma.promotion.count({ where: { expiresAt: { gt: now } } }),
      this.prisma.promotion.count({ where: { createdAt: { gte: firstOfMonth } } }),
      this.prisma.request.count(),
      this.prisma.complaint.count({ where: { status: 'PENDING' } }),
    ]);

    return {
      totalUsers,
      totalSpecialists,
      activePromotions,
      // Mock revenue: count of promotions this month (no real payments yet)
      revenueThisMonth: monthPromotions,
      totalRequests,
      pendingComplaints,
    };
  }

  async getUsers(role?: string, page = 1, limit = 50) {
    const where: any = {};
    if (role === 'CLIENT' || role === 'SPECIALIST') {
      where.role = role;
    }

    const take = Math.min(limit, 200);
    const skip = (page - 1) * take;

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        skip,
        select: {
          id: true,
          email: true,
          role: true,
          isBlocked: true,
          createdAt: true,
          lastLoginAt: true,
          specialistProfile: {
            select: { nick: true, cities: true, services: true },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items, total, page, pages: Math.ceil(total / take) };
  }

  async getSpecialists(page = 1, limit = 50) {
    const take = Math.min(limit, 200);
    const skip = (page - 1) * take;

    const [items, total] = await Promise.all([
      this.prisma.specialistProfile.findMany({
        orderBy: { updatedAt: 'desc' },
        take,
        skip,
        include: {
          user: {
            select: { id: true, email: true, createdAt: true, lastLoginAt: true },
          },
        },
      }),
      this.prisma.specialistProfile.count(),
    ]);

    return { items, total, page, pages: Math.ceil(total / take) };
  }

  async blockUser(id: string, isBlocked: boolean) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }

    return this.prisma.user.update({
      where: { id },
      data: { isBlocked },
      select: { id: true, email: true, isBlocked: true },
    });
  }

  async updateSpecialistBadges(specialistProfileId: string, badges: string[]) {
    const profile = await this.prisma.specialistProfile.findUnique({
      where: { userId: specialistProfileId },
    });
    if (!profile) {
      throw new NotFoundException(`Specialist profile ${specialistProfileId} not found`);
    }
    return this.prisma.specialistProfile.update({
      where: { userId: specialistProfileId },
      data: { badges },
    });
  }

  async getPromotions(page = 1, limit = 50) {
    const take = Math.min(limit, 200);
    const skip = (page - 1) * take;

    const [items, total] = await Promise.all([
      this.prisma.promotion.findMany({
        orderBy: { createdAt: 'desc' },
        take,
        skip,
        include: {
          specialist: {
            select: { id: true, email: true, role: true },
          },
        },
      }),
      this.prisma.promotion.count(),
    ]);

    return { items, total, page, pages: Math.ceil(total / take) };
  }

  async getReviews(page = 1, limit = 20) {
    const take = Math.min(limit, 200);
    const skip = (page - 1) * take;

    const [items, total] = await Promise.all([
      this.prisma.review.findMany({
        orderBy: { createdAt: 'desc' },
        take,
        skip,
        include: {
          client: { select: { id: true, email: true } },
          specialist: { select: { id: true, email: true } },
          request: { select: { id: true, description: true } },
        },
      }),
      this.prisma.review.count(),
    ]);

    return { items, total, page, pages: Math.ceil(total / take) };
  }

  async getReview(id: string) {
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, email: true } },
        specialist: { select: { id: true, email: true } },
        request: { select: { id: true, description: true } },
      },
    });
    if (!review) {
      throw new NotFoundException(`Review ${id} not found`);
    }
    return review;
  }

  async deleteReview(id: string) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) {
      throw new NotFoundException(`Review ${id} not found`);
    }
    await this.prisma.review.delete({ where: { id } });
    return { deleted: true, id };
  }

  async getAllRequests(page = 1, limit = 50) {
    const take = Math.min(limit, 200);
    const skip = (page - 1) * take;

    const [items, total] = await Promise.all([
      this.prisma.request.findMany({
        orderBy: { createdAt: 'desc' },
        take,
        skip,
        include: {
          client: { select: { id: true, email: true } },
          _count: { select: { responses: true } },
        },
      }),
      this.prisma.request.count(),
    ]);

    return { items, total, page, pages: Math.ceil(total / take) };
  }

  // ── Settings ──────────────────────────────────────────────────────────

  async getSettings(): Promise<Record<string, string>> {
    const rows = await this.prisma.setting.findMany();
    const map: Record<string, string> = {};
    for (const row of rows) {
      map[row.key] = row.value;
    }
    return map;
  }

  async updateSettings(settings: Record<string, string>): Promise<Record<string, string>> {
    await Promise.all(
      Object.entries(settings).map(([key, value]) =>
        this.prisma.setting.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        }),
      ),
    );
    return this.getSettings();
  }
}
