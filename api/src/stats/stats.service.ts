import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getLandingStats() {
    const [specialistsCount, ifnsCount, requestsCount] = await Promise.all([
      this.prisma.specialistProfile.count({
        where: { displayName: { not: null } },
      }),
      this.prisma.ifns.count(),
      this.prisma.request.count(),
    ]);

    return { specialistsCount, ifnsCount, requestsCount };
  }
}
