import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../notifications/email.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { RespondRequestDto } from './dto/respond-request.dto';
import { RequestStatus, Prisma } from '@prisma/client';

const PAGE_SIZE = 20;

@Injectable()
export class RequestsService {
  private readonly logger = new Logger(RequestsService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async findRecent(limit = 5) {
    return this.prisma.request.findMany({
      where: { status: RequestStatus.OPEN },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        description: true,
        city: true,
        category: true,
        budget: true,
        createdAt: true,
        _count: { select: { responses: true } },
      },
    });
  }

  async create(clientId: string, dto: CreateRequestDto) {
    // Map aliases: title -> description, serviceType -> category
    const description = dto.description || dto.title;
    const city = dto.city;
    const category = dto.category || dto.serviceType || null;

    if (!description || description.trim().length < 3) {
      throw new BadRequestException('description (or title) is required and must be at least 3 characters');
    }
    if (!city) {
      throw new BadRequestException('city is required');
    }

    const openCount = await this.prisma.request.count({
      where: { clientId, status: RequestStatus.OPEN },
    });
    if (openCount >= 5) {
      throw new BadRequestException('Maximum 5 active requests allowed');
    }

    const created = await this.prisma.request.create({
      data: {
        clientId,
        description,
        city,
        ifnsId: dto.ifnsId ?? null,
        ifnsName: dto.ifnsName ?? null,
        budget: dto.budget ?? null,
        category,
      },
    });

    // Notify specialists in this city — non-blocking, does not delay response
    this.notifySpecialistsAsync(city, created.id, description).catch(() => {});

    return created;
  }

  /** Fire-and-forget: find all specialists covering this city and email them */
  private async notifySpecialistsAsync(
    city: string,
    requestId: string,
    description: string,
  ): Promise<void> {
    // #176: Filter by city at DB level using PostgreSQL lower() + unnest() for case-insensitive
    // array match — avoids full table scan that was done previously with JS filtering
    const cityLower = city.toLowerCase();
    const rows = await this.prisma.$queryRaw<{ email: string }[]>(
      Prisma.sql`
        SELECT u.email
        FROM specialist_profiles sp
        JOIN users u ON u.id = sp."userId"
        WHERE EXISTS (
          SELECT 1 FROM unnest(sp.cities) c WHERE lower(c) = ${cityLower}
        )
        AND u."emailNotifications" = true
      `,
    );

    const emails = rows.map((r) => r.email);

    if (emails.length > 0) {
      this.emailService.notifyNewRequestInCity(emails, city, description);
    }
  }

  async findFeed(city?: string, page = 1, category?: string, maxBudget?: number, ifnsId?: string) {
    // #1855: Sanitize page to prevent negative skip
    const pageNum = Math.max(1, parseInt(page as unknown as string) || 1);

    const where: any = { status: RequestStatus.OPEN };
    // #1849: Case-insensitive city filter
    if (city) where.city = { equals: city, mode: 'insensitive' };
    // #1801: Category filter (case-insensitive contains)
    if (category) where.category = { contains: category, mode: 'insensitive' };
    // #1801: Max budget filter
    if (maxBudget && maxBudget > 0) where.budget = { lte: maxBudget };
    // IFNS filter
    if (ifnsId) where.ifnsId = ifnsId;

    const skip = (pageNum - 1) * PAGE_SIZE;

    const [items, total] = await Promise.all([
      this.prisma.request.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: PAGE_SIZE,
        include: {
          client: { select: { id: true } },
          _count: { select: { responses: true } },
        },
      }),
      this.prisma.request.count({ where }),
    ]);

    return { items, total, page: pageNum, pageSize: PAGE_SIZE };
  }

  async findMy(clientId: string) {
    return this.prisma.request.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { responses: true } },
        responses: {
          include: {
            specialist: {
              select: {
                id: true, email: true,
                specialistProfile: { select: { nick: true, displayName: true, avatarUrl: true } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async findResponses(requestId: string, userId: string) {
    const request = await this.prisma.request.findUnique({
      where: { id: requestId },
      select: { clientId: true },
    });
    if (!request) throw new NotFoundException('Request not found');
    if (request.clientId !== userId) throw new ForbiddenException('Only the request owner can view responses');

    return this.prisma.response.findMany({
      where: { requestId },
      include: {
        specialist: {
          select: {
            id: true, email: true,
            specialistProfile: { select: { nick: true, displayName: true, avatarUrl: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(requestId: string, userId: string | null) {
    const request = await this.prisma.request.findUnique({
      where: { id: requestId },
      include: {
        _count: { select: { responses: true } },
        responses: {
          include: {
            specialist: {
              select: {
                id: true, email: true,
                specialistProfile: { select: { nick: true, displayName: true, avatarUrl: true } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!request) throw new NotFoundException('Request not found');

    // Owner gets full data; everyone else gets public fields only (no clientId, no responses)
    if (userId !== null && userId === request.clientId) {
      return request;
    }

    const { clientId: _omit, responses: _resp, ...publicFields } = request;
    return publicFields;
  }

  async respond(specialistId: string, requestId: string, dto: RespondRequestDto) {
    // Check request exists and is open
    const request = await this.prisma.request.findUnique({
      where: { id: requestId },
      include: { client: { select: { id: true, email: true, emailNotifications: true } } },
    });
    if (!request) throw new NotFoundException('Request not found');
    if (request.status !== RequestStatus.OPEN) {
      throw new BadRequestException('Request is not open for responses');
    }

    // Check specialist's cities cover the request's city
    const specialistProfile = await this.prisma.specialistProfile.findUnique({
      where: { userId: specialistId },
      select: { cities: true },
    });
    if (!specialistProfile) {
      throw new BadRequestException('Specialist profile not found');
    }
    const requestCityLower = request.city.toLowerCase();
    const coversCity = specialistProfile.cities.some(
      (c) => c.toLowerCase() === requestCityLower,
    );
    if (!coversCity) {
      throw new BadRequestException('Ваш профиль не обслуживает город этого запроса');
    }

    // Check specialist hasn't already responded (@@unique will catch too, but better UX)
    const existing = await this.prisma.response.findUnique({
      where: { specialistId_requestId: { specialistId, requestId } },
    });
    if (existing) throw new ConflictException('Already responded to this request');

    // Create response + thread in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const response = await tx.response.create({
        data: {
          specialistId,
          requestId,
          message: dto.message,
        },
      });

      // Create thread: enforce participant1Id < participant2Id
      const [p1, p2] =
        specialistId < request.clientId
          ? [specialistId, request.clientId]
          : [request.clientId, specialistId];

      const thread = await tx.thread.upsert({
        where: { participant1Id_participant2Id: { participant1Id: p1, participant2Id: p2 } },
        create: { participant1Id: p1, participant2Id: p2 },
        update: {},
      });

      return { response, thread };
    });

    // Notify client about new response — fire-and-forget
    if (request.client.emailNotifications) {
      this.emailService.notifyNewResponse(request.client.email, requestId, specialistId);
    }

    return result;
  }

  async findMyResponses(specialistId: string) {
    return this.prisma.response.findMany({
      where: { specialistId },
      orderBy: { createdAt: 'desc' },
      include: {
        request: {
          select: {
            id: true,
            description: true,
            city: true,
            status: true,
            createdAt: true,
            clientId: true,
          },
        },
      },
    });
  }

  /**
   * Create a review for a specialist on a specific request.
   * Convenience endpoint: POST /requests/:id/reviews
   */
  async createReviewForRequest(
    clientId: string,
    requestId: string,
    body: { specialistNick: string; rating: number; comment?: string },
  ) {
    // Resolve specialist by nick
    const specialistProfile = await this.prisma.specialistProfile.findUnique({
      where: { nick: body.specialistNick },
    });
    if (!specialistProfile) throw new NotFoundException('Specialist not found');
    const specialistId = specialistProfile.userId;

    // Validate request belongs to client and is CLOSED
    const request = await this.prisma.request.findUnique({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Request not found');
    if (request.clientId !== clientId) throw new ForbiddenException('This request does not belong to you');
    if (request.status !== RequestStatus.CLOSED) {
      throw new BadRequestException('Request must be CLOSED to leave a review');
    }

    // Validate specialist responded to this request
    const response = await this.prisma.response.findUnique({
      where: { specialistId_requestId: { specialistId, requestId } },
    });
    if (!response) throw new BadRequestException('This specialist did not respond to this request');

    // Check for duplicate
    const existing = await this.prisma.review.findUnique({
      where: { clientId_specialistId_requestId: { clientId, specialistId, requestId } },
    });
    if (existing) throw new ConflictException('You have already reviewed this specialist for this request');

    return this.prisma.review.create({
      data: {
        clientId,
        specialistId,
        requestId,
        rating: body.rating,
        comment: body.comment ?? null,
      },
    });
  }

  /**
   * Delete a request and all related responses/reviews.
   * Only the owner can delete, and only OPEN requests.
   */
  async deleteRequest(clientId: string, requestId: string): Promise<{ deleted: true }> {
    const request = await this.prisma.request.findUnique({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Request not found');
    if (request.clientId !== clientId) throw new ForbiddenException('Not your request');
    if (request.status !== RequestStatus.OPEN) {
      throw new BadRequestException('Can only delete requests with OPEN status');
    }

    await this.prisma.$transaction(async (tx) => {
      // Delete reviews for this request
      await tx.review.deleteMany({ where: { requestId } });
      // Delete responses for this request
      await tx.response.deleteMany({ where: { requestId } });
      // Delete the request itself
      await tx.request.delete({ where: { id: requestId } });
    });

    return { deleted: true };
  }

  async updateFields(
    clientId: string,
    requestId: string,
    dto: { description?: string; city?: string; budget?: number | null; category?: string | null },
  ) {
    const request = await this.prisma.request.findUnique({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Request not found');
    if (request.clientId !== clientId) throw new ForbiddenException('Not your request');
    if (request.status !== RequestStatus.OPEN) {
      throw new BadRequestException('Can only edit requests with OPEN status');
    }

    const data: Record<string, unknown> = {};
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.city !== undefined) data.city = dto.city;
    if (dto.budget !== undefined) data.budget = dto.budget;
    if (dto.category !== undefined) data.category = dto.category;

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('No fields to update');
    }

    return this.prisma.request.update({
      where: { id: requestId },
      data,
    });
  }

  async updateStatus(clientId: string, requestId: string, status: RequestStatus) {
    const request = await this.prisma.request.findUnique({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Request not found');
    if (request.clientId !== clientId) throw new ForbiddenException('Not your request');

    // Guard: reject no-op transitions
    if (request.status === status) {
      throw new BadRequestException(`Request is already in status ${status}`);
    }

    // Transition matrix: defines all valid moves
    const ALLOWED_TRANSITIONS: Partial<Record<RequestStatus, RequestStatus[]>> = {
      [RequestStatus.OPEN]: [RequestStatus.CLOSED, RequestStatus.CANCELLED],
      // CLOSED and CANCELLED are final — no transitions allowed
    };

    const allowed = ALLOWED_TRANSITIONS[request.status] ?? [];
    if (!allowed.includes(status)) {
      throw new BadRequestException(
        `Cannot transition request from ${request.status} to ${status}`,
      );
    }

    return this.prisma.request.update({
      where: { id: requestId },
      data: { status },
    });
  }
}
