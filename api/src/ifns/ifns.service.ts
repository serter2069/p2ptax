import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class IfnsService {
  constructor(private readonly prisma: PrismaService) {}

  async search(query: string) {
    const where = query
      ? {
          OR: [
            { name: { contains: query, mode: 'insensitive' as const } },
            { code: { contains: query, mode: 'insensitive' as const } },
            { searchAliases: { contains: query, mode: 'insensitive' as const } },
          ],
        }
      : {};

    return this.prisma.ifns.findMany({
      where,
      include: { city: true },
      take: 20,
      orderBy: { name: 'asc' },
    });
  }
}
