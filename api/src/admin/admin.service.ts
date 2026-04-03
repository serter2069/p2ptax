import { Injectable } from '@nestjs/common';
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
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: 'SPECIALIST' } }),
      this.prisma.promotion.count({ where: { expiresAt: { gt: now } } }),
      this.prisma.promotion.count({ where: { createdAt: { gte: firstOfMonth } } }),
    ]);

    return {
      totalUsers,
      totalSpecialists,
      activePromotions,
      // Mock revenue: count of promotions this month (no real payments yet)
      revenueThisMonth: monthPromotions,
    };
  }

  async getUsers(role?: string) {
    const where: any = {};
    if (role === 'CLIENT' || role === 'SPECIALIST') {
      where.role = role;
    }

    return this.prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
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
    });
  }

  async getSpecialists() {
    return this.prisma.specialistProfile.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        user: {
          select: { id: true, email: true, createdAt: true, lastLoginAt: true },
        },
      },
    });
  }

  async blockUser(id: string, isBlocked: boolean) {
    return this.prisma.user.update({
      where: { id },
      data: { isBlocked },
      select: { id: true, email: true, isBlocked: true },
    });
  }

  async getAllRequests() {
    return this.prisma.request.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        client: { select: { id: true, email: true } },
        _count: { select: { responses: true } },
      },
    });
  }
}
