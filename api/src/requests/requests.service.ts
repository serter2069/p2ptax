import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
  UnprocessableEntityException,
  Logger,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../notifications/email.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { CreateQuickRequestDto } from './dto/create-quick-request.dto';
import { RespondRequestDto } from './dto/respond-request.dto';
import { RequestStatus, ResponseStatus, Prisma } from '@prisma/client';

const PAGE_SIZE = 20;
const DEFAULT_MAX_REQUESTS = 5;
const MAX_EXTENSIONS = 3;
const CLOSING_SOON_DAYS = 27;
const AUTO_CLOSE_DAYS = 30;

@Injectable()
export class RequestsService {
  private readonly logger = new Logger(RequestsService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async findRecent(limit = 5) {
    return this.prisma.request.findMany({
      where: { status: { in: [RequestStatus.OPEN, RequestStatus.CLOSING_SOON] } },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        title: true,
        description: true,
        city: true,
        category: true,
        budget: true,
        createdAt: true,
        _count: { select: { responses: true } },
      },
    });
  }

  async createQuick(dto: CreateQuickRequestDto) {
    return this.prisma.quickRequest.create({
      data: {
        description: dto.description.trim().slice(0, 500),
        serviceType: dto.serviceType,
        city: dto.city ?? null,
        ifnsId: dto.ifnsId ?? null,
        ifnsName: dto.ifnsName ?? null,
      },
      select: { id: true, status: true },
    });
  }

  private async getMaxRequests(): Promise<number> {
    const setting = await this.prisma.setting.findUnique({
      where: { key: 'max_requests_per_client' },
    });
    if (setting) {
      const parsed = parseInt(setting.value, 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    return DEFAULT_MAX_REQUESTS;
  }

  async create(clientId: string, dto: CreateRequestDto) {
    const title = dto.title;
    const description = dto.description;
    const city = dto.city;
    const category = dto.category || dto.serviceType || null;

    if (!title || title.trim().length < 3) {
      throw new BadRequestException('title is required and must be at least 3 characters');
    }
    if (!description || description.trim().length < 10) {
      throw new BadRequestException('description is required and must be at least 10 characters');
    }
    if (!city) {
      throw new BadRequestException('city is required');
    }

    const maxRequests = await this.getMaxRequests();
    const openCount = await this.prisma.request.count({
      where: { clientId, status: { in: [RequestStatus.OPEN, RequestStatus.CLOSING_SOON] } },
    });
    if (openCount >= maxRequests) {
      throw new UnprocessableEntityException(
        `Достигнут лимит заявок (${maxRequests}). Удалите или закройте существующие заявки.`,
      );
    }

    const created = await this.prisma.request.create({
      data: {
        clientId,
        title,
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
    const rows = await this.prisma.$queryRaw<{ email: string; userId: string }[]>(
      Prisma.sql`
        SELECT u.email, u.id as "userId"
        FROM specialist_profiles sp
        JOIN users u ON u.id = sp."userId"
        WHERE EXISTS (
          SELECT 1 FROM unnest(sp.cities) c WHERE lower(c) = ${cityLower}
        )
      `,
    );

    const emails = rows.map((r) => r.email);
    const userIds = rows.map((r) => r.userId);

    if (emails.length > 0) {
      this.emailService.notifyNewRequestInCity(emails, userIds, city, description);
    }
  }

  async findFeed(city?: string, page = 1, category?: string, maxBudget?: number, ifnsId?: string) {
    // #1855: Sanitize page to prevent negative skip
    const pageNum = Math.max(1, parseInt(page as unknown as string) || 1);

    const where: any = { status: { in: [RequestStatus.OPEN, RequestStatus.CLOSING_SOON] } };
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

    return { items, total, page: pageNum, pageSize: PAGE_SIZE, hasMore: skip + items.length < total };
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

  async getDashboardStats(clientId: string) {
    const maxRequests = await this.getMaxRequests();

    const [totalRequests, activeRequests, totalResponses, acceptedResponses] =
      await Promise.all([
        this.prisma.request.count({ where: { clientId } }),
        this.prisma.request.count({ where: { clientId, status: { in: [RequestStatus.OPEN, RequestStatus.CLOSING_SOON] } } }),
        this.prisma.response.count({
          where: { request: { clientId } },
        }),
        this.prisma.response.count({
          where: { request: { clientId }, status: ResponseStatus.accepted },
        }),
      ]);

    return {
      totalRequests,
      maxRequests,
      activeRequests,
      totalResponses,
      acceptedResponses,
    };
  }

  async findResponses(requestId: string, userId: string) {
    const request = await this.prisma.request.findUnique({
      where: { id: requestId },
      select: { clientId: true },
    });
    if (!request) throw new NotFoundException('Request not found');
    if (request.clientId !== userId) throw new ForbiddenException('Only the request owner can view responses');

    // Bulk-update sent → viewed for this request's responses
    await this.prisma.response.updateMany({
      where: { requestId, status: ResponseStatus.sent },
      data: { status: ResponseStatus.viewed, viewedAt: new Date() },
    });

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

  async findPublicById(requestId: string) {
    const request = await this.prisma.request.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        title: true,
        description: true,
        city: true,
        ifnsId: true,
        ifnsName: true,
        budget: true,
        category: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { responses: true } },
      },
    });

    if (!request || request.status === RequestStatus.CLOSED || request.status === RequestStatus.CANCELLED) {
      throw new NotFoundException('Request not found');
    }

    const { _count, ...rest } = request;
    return { ...rest, responseCount: _count.responses };
  }

  async respond(specialistId: string, requestId: string, dto: RespondRequestDto) {
    // Validate deadline is in the future
    const deadlineDate = new Date(dto.deadline);
    if (deadlineDate <= new Date()) {
      throw new BadRequestException('Deadline must be a future date');
    }

    // Check request exists and is open
    const request = await this.prisma.request.findUnique({
      where: { id: requestId },
      include: { client: { select: { id: true, email: true, notifyNewResponses: true } } },
    });
    if (!request) throw new NotFoundException('Request not found');
    if (request.status !== RequestStatus.OPEN && request.status !== RequestStatus.CLOSING_SOON) {
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
          comment: dto.comment,
          price: dto.price,
          deadline: deadlineDate,
        },
      });

      // Update lastActivityAt on the request
      await tx.request.update({
        where: { id: requestId },
        data: { lastActivityAt: new Date() },
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
    if (request.client.notifyNewResponses) {
      this.emailService.notifyNewResponse(request.client.email, requestId, specialistId, request.client.id);
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
            title: true,
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
      [RequestStatus.OPEN]: [RequestStatus.CLOSING_SOON, RequestStatus.CLOSED, RequestStatus.CANCELLED],
      [RequestStatus.CLOSING_SOON]: [RequestStatus.OPEN, RequestStatus.CLOSED, RequestStatus.CANCELLED],
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

  /**
   * Accept a response: changes status to accepted + creates/ensures thread exists.
   * Only the request owner (client) can accept.
   */
  async acceptResponse(responseId: string, clientId: string) {
    const response = await this.prisma.response.findUnique({
      where: { id: responseId },
      include: {
        request: { select: { clientId: true, title: true } },
        specialist: { select: { id: true, email: true, notifyNewResponses: true } },
      },
    });
    if (!response) throw new NotFoundException('Response not found');
    if (response.request.clientId !== clientId) {
      throw new ForbiddenException('Only the request owner can accept responses');
    }
    if (response.status === ResponseStatus.accepted) {
      throw new ConflictException('Response is already accepted');
    }
    if (response.status === ResponseStatus.deactivated) {
      throw new ConflictException('Cannot accept a deactivated response');
    }

    const now = new Date();

    // Update response + ensure thread in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.response.update({
        where: { id: responseId },
        data: { status: ResponseStatus.accepted, acceptedAt: now },
      });

      // Create thread: enforce participant1Id < participant2Id
      const specialistId = response.specialistId;
      const [p1, p2] =
        specialistId < clientId
          ? [specialistId, clientId]
          : [clientId, specialistId];

      const thread = await tx.thread.upsert({
        where: { participant1Id_participant2Id: { participant1Id: p1, participant2Id: p2 } },
        create: { participant1Id: p1, participant2Id: p2 },
        update: {},
      });

      return { response: updated, thread };
    });

    // Notify specialist that their response was accepted — fire-and-forget
    if (response.specialist.notifyNewResponses) {
      const client = await this.prisma.user.findUnique({
        where: { id: clientId },
        select: { email: true, firstName: true, lastName: true },
      });
      const clientName = [client?.firstName, client?.lastName].filter(Boolean).join(' ') || client?.email || 'Клиент';
      this.emailService.notifyResponseAccepted(
        response.specialist.email,
        clientName,
        response.request.title,
        response.specialist.id,
      );
    }

    return result;
  }

  /**
   * Patch a response: specialist can deactivate a sent/viewed response.
   * Deactivating an accepted response returns 409.
   */
  async patchResponse(responseId: string, specialistId: string, status: string) {
    const response = await this.prisma.response.findUnique({
      where: { id: responseId },
    });
    if (!response) throw new NotFoundException('Response not found');
    if (response.specialistId !== specialistId) {
      throw new ForbiddenException('You can only modify your own responses');
    }

    if (status !== 'deactivated') {
      throw new BadRequestException('Only status=deactivated is supported');
    }

    if (response.status === ResponseStatus.accepted) {
      throw new ConflictException('Cannot deactivate an accepted response');
    }

    if (response.status === ResponseStatus.deactivated) {
      throw new ConflictException('Response is already deactivated');
    }

    return this.prisma.response.update({
      where: { id: responseId },
      data: { status: ResponseStatus.deactivated },
    });
  }

  /**
   * Extend a request: resets lastActivityAt and increments extensionsCount.
   * Max 3 extensions allowed. Only the owner can extend.
   */
  async extend(clientId: string, requestId: string) {
    const request = await this.prisma.request.findUnique({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Request not found');
    if (request.clientId !== clientId) throw new ForbiddenException('Not your request');
    if (request.status !== RequestStatus.OPEN && request.status !== RequestStatus.CLOSING_SOON) {
      throw new BadRequestException('Can only extend requests with OPEN or CLOSING_SOON status');
    }
    if (request.extensionsCount >= MAX_EXTENSIONS) {
      throw new BadRequestException(`Maximum number of extensions (${MAX_EXTENSIONS}) reached`);
    }

    return this.prisma.request.update({
      where: { id: requestId },
      data: {
        lastActivityAt: new Date(),
        extensionsCount: { increment: 1 },
        status: RequestStatus.OPEN,
      },
    });
  }

  /**
   * Daily cron: mark OPEN requests with lastActivityAt > 27 days ago as CLOSING_SOON
   * and send warning emails.
   */
  @Cron('0 2 * * *')
  async markClosingSoon(): Promise<void> {
    const cutoff = new Date(Date.now() - CLOSING_SOON_DAYS * 24 * 60 * 60 * 1000);

    const requests = await this.prisma.request.findMany({
      where: {
        status: RequestStatus.OPEN,
        lastActivityAt: { lt: cutoff },
      },
      include: {
        client: { select: { id: true, email: true } },
      },
    });

    if (requests.length === 0) {
      this.logger.log('markClosingSoon: no requests to update');
      return;
    }

    const ids = requests.map((r) => r.id);

    const { count } = await this.prisma.request.updateMany({
      where: { id: { in: ids } },
      data: { status: RequestStatus.CLOSING_SOON },
    });

    // Send warning emails
    for (const request of requests) {
      this.emailService.notifyRequestClosingSoon(
        request.client.email,
        request.id,
        request.client.id,
      );
    }

    this.logger.log(`markClosingSoon: ${count} requests set to CLOSING_SOON, ${requests.length} warning emails sent`);
  }

  /**
   * Daily cron: auto-close OPEN/CLOSING_SOON requests with lastActivityAt > 30 days ago.
   */
  @Cron('0 3 * * *')
  async autoCloseStale(): Promise<void> {
    const cutoff = new Date(Date.now() - AUTO_CLOSE_DAYS * 24 * 60 * 60 * 1000);

    const { count } = await this.prisma.request.updateMany({
      where: {
        status: { in: [RequestStatus.OPEN, RequestStatus.CLOSING_SOON] },
        lastActivityAt: { lt: cutoff },
      },
      data: { status: RequestStatus.CLOSED },
    });

    this.logger.log(`autoCloseStale: ${count} requests auto-closed`);
  }
}
