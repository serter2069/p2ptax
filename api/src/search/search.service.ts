import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RequestStatus, Prisma } from '@prisma/client';

const PAGE_SIZE = 20;

export type SearchType = 'all' | 'requests' | 'specialists';

export interface SearchResult {
  requests: { items: any[]; total: number };
  specialists: { items: any[]; total: number };
  total: number;
}

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async search(
    query: string,
    type: SearchType = 'all',
    page = 1,
  ): Promise<SearchResult> {
    const trimmed = query.trim();
    if (!trimmed) {
      return { requests: { items: [], total: 0 }, specialists: { items: [], total: 0 }, total: 0 };
    }

    const pageNum = Math.max(1, page);
    const skip = (pageNum - 1) * PAGE_SIZE;
    const pattern = `%${trimmed}%`;

    const [requestsResult, specialistsResult] = await Promise.all([
      type === 'specialists'
        ? { items: [], total: 0 }
        : this.searchRequests(pattern, skip),
      type === 'requests'
        ? { items: [], total: 0 }
        : this.searchSpecialists(pattern, skip),
    ]);

    return {
      requests: requestsResult,
      specialists: specialistsResult,
      total: requestsResult.total + specialistsResult.total,
    };
  }

  private async searchRequests(pattern: string, skip: number) {
    const where = {
      status: {
        in: [
          RequestStatus.OPEN,
          RequestStatus.IN_PROGRESS,
          RequestStatus.CLOSING_SOON,
        ],
      },
      OR: [
        { title: { contains: pattern.replace(/%/g, ''), mode: 'insensitive' as const } },
        { description: { contains: pattern.replace(/%/g, ''), mode: 'insensitive' as const } },
      ],
    };

    const [items, total] = await Promise.all([
      this.prisma.request.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: PAGE_SIZE,
        select: {
          id: true,
          title: true,
          description: true,
          city: true,
          category: true,
          serviceType: true,
          budget: true,
          status: true,
          createdAt: true,
          _count: { select: { responses: true } },
        },
      }),
      this.prisma.request.count({ where }),
    ]);

    return {
      items: items.map((item) => ({
        ...item,
        _type: 'request' as const,
        description: item.description?.slice(0, 200) ?? null,
        responseCount: item._count.responses,
        _count: undefined,
      })),
      total,
    };
  }

  private async searchSpecialists(pattern: string, skip: number) {
    const term = pattern.replace(/%/g, '');

    // Find specialists whose cities array contains a partial match
    const cityMatchIds = await this.prisma.$queryRaw<{ userId: string }[]>(
      Prisma.sql`SELECT "userId" FROM specialist_profiles WHERE EXISTS (SELECT 1 FROM unnest(cities) AS c WHERE c ILIKE ${pattern})`,
    );
    const cityUserIds = cityMatchIds.map((r) => r.userId);

    const where: any = {
      displayName: { not: null },
      OR: [
        { displayName: { contains: term, mode: 'insensitive' } },
        { bio: { contains: term, mode: 'insensitive' } },
        { nick: { contains: term, mode: 'insensitive' } },
        ...(cityUserIds.length > 0 ? [{ userId: { in: cityUserIds } }] : []),
      ],
    };

    const [items, total] = await Promise.all([
      this.prisma.specialistProfile.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: PAGE_SIZE,
        select: {
          nick: true,
          displayName: true,
          avatarUrl: true,
          cities: true,
          services: true,
          headline: true,
          experience: true,
          createdAt: true,
        },
      }),
      this.prisma.specialistProfile.count({ where }),
    ]);

    return {
      items: items.map((item) => ({
        ...item,
        _type: 'specialist' as const,
      })),
      total,
    };
  }
}
