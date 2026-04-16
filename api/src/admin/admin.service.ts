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
          _count: { select: { threads: true } },
        },
      }),
      this.prisma.request.count(),
    ]);

    return { items, total, page, pages: Math.ceil(total / take) };
  }

  // ── Weekly stats (last 7 days) ─────────────────────────────────────────

  async getWeeklyStats() {
    // Build 7 day buckets ending today (inclusive), start-of-day in local time
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const from = new Date(startOfToday);
    from.setDate(from.getDate() - 6); // 7 buckets: from..today

    const [users, specialists, requests, responses] = await Promise.all([
      this.prisma.user.findMany({
        where: { createdAt: { gte: from } },
        select: { createdAt: true, role: true },
      }),
      this.prisma.specialistProfile.findMany({
        where: { createdAt: { gte: from } },
        select: { createdAt: true },
      }),
      this.prisma.request.findMany({
        where: { createdAt: { gte: from } },
        select: { createdAt: true },
      }),
      // "responses" = threads opened (specialist responded to a request)
      this.prisma.thread.findMany({
        where: { createdAt: { gte: from } },
        select: { createdAt: true },
      }),
    ]);

    const dayKey = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    const buckets: Array<{
      date: string;
      signups: number;
      newSpecialists: number;
      newRequests: number;
      newResponses: number;
    }> = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(from);
      d.setDate(from.getDate() + i);
      buckets.push({
        date: dayKey(d),
        signups: 0,
        newSpecialists: 0,
        newRequests: 0,
        newResponses: 0,
      });
    }

    const indexByDate = new Map(buckets.map((b, i) => [b.date, i]));

    for (const u of users) {
      const idx = indexByDate.get(dayKey(new Date(u.createdAt)));
      if (idx !== undefined) buckets[idx].signups += 1;
    }
    for (const sp of specialists) {
      const idx = indexByDate.get(dayKey(new Date(sp.createdAt)));
      if (idx !== undefined) buckets[idx].newSpecialists += 1;
    }
    for (const r of requests) {
      const idx = indexByDate.get(dayKey(new Date(r.createdAt)));
      if (idx !== undefined) buckets[idx].newRequests += 1;
    }
    for (const t of responses) {
      const idx = indexByDate.get(dayKey(new Date(t.createdAt)));
      if (idx !== undefined) buckets[idx].newResponses += 1;
    }

    return buckets;
  }

  // ── Recent platform activity ───────────────────────────────────────────

  async getActivity(limit = 20) {
    const take = Math.min(Math.max(limit, 1), 100);
    const since = new Date();
    since.setHours(since.getHours() - 24 * 7); // look back up to 7 days

    type Row = {
      type: string;
      actorName: string;
      targetName: string;
      action: string;
      createdAt: Date;
    };

    const displayName = (u: {
      firstName?: string | null;
      lastName?: string | null;
      username?: string | null;
      email?: string | null;
    } | null) => {
      if (!u) return '—';
      const full = `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim();
      return full || u.username || u.email || '—';
    };

    const [newUsers, newSpecialists, newRequests, blockedUsers] = await Promise.all([
      this.prisma.user.findMany({
        where: { createdAt: { gte: since } },
        orderBy: { createdAt: 'desc' },
        take,
        select: {
          createdAt: true,
          email: true,
          firstName: true,
          lastName: true,
          username: true,
          role: true,
        },
      }),
      this.prisma.specialistProfile.findMany({
        where: { createdAt: { gte: since } },
        orderBy: { createdAt: 'desc' },
        take,
        select: {
          createdAt: true,
          nick: true,
          displayName: true,
          user: {
            select: { email: true, firstName: true, lastName: true, username: true },
          },
        },
      }),
      this.prisma.request.findMany({
        where: { createdAt: { gte: since } },
        orderBy: { createdAt: 'desc' },
        take,
        select: {
          createdAt: true,
          title: true,
          client: {
            select: { email: true, firstName: true, lastName: true, username: true },
          },
        },
      }),
      this.prisma.user.findMany({
        where: { isBlocked: true },
        orderBy: { createdAt: 'desc' },
        take,
        select: {
          createdAt: true,
          email: true,
          firstName: true,
          lastName: true,
          username: true,
        },
      }),
    ]);

    const rows: Row[] = [];

    for (const u of newUsers) {
      rows.push({
        type: u.role === 'SPECIALIST' ? 'user.specialist_signup' : 'user.signup',
        actorName: displayName(u),
        targetName: '',
        action: u.role === 'SPECIALIST' ? 'Регистрация специалиста' : 'Регистрация пользователя',
        createdAt: u.createdAt,
      });
    }
    for (const sp of newSpecialists) {
      rows.push({
        type: 'specialist.profile_created',
        actorName: sp.displayName || sp.nick || displayName(sp.user),
        targetName: '',
        action: 'Новый профиль специалиста',
        createdAt: sp.createdAt,
      });
    }
    for (const r of newRequests) {
      rows.push({
        type: 'request.created',
        actorName: displayName(r.client),
        targetName: r.title,
        action: 'Новая заявка',
        createdAt: r.createdAt,
      });
    }
    for (const u of blockedUsers) {
      rows.push({
        type: 'user.blocked',
        actorName: 'Администратор',
        targetName: displayName(u),
        action: 'Пользователь заблокирован',
        createdAt: u.createdAt,
      });
    }

    rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return rows.slice(0, take);
  }

  // ── Close-all-requests (admin action on blocked/deleted user) ──────────

  async closeAllUserRequests(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }

    // Active states: anything not already CLOSED (enum is ACTIVE|CLOSING_SOON|CLOSED).
    const result = await this.prisma.request.updateMany({
      where: {
        clientId: id,
        status: { notIn: ['CLOSED'] },
      },
      data: { status: 'CLOSED' },
    });

    return { closed: result.count };
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
