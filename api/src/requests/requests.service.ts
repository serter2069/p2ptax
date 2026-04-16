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
import { InAppNotificationService } from '../notifications/in-app-notification.service';
import { StorageService } from '../storage/storage.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { CreateQuickRequestDto } from './dto/create-quick-request.dto';
import { RequestStatus, Prisma } from '@prisma/client';

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
    private inAppNotifService: InAppNotificationService,
    private storageService: StorageService,
  ) {}

  async findRecent(limit = 5) {
    return this.prisma.request.findMany({
      where: { status: { in: [RequestStatus.OPEN, RequestStatus.IN_PROGRESS, RequestStatus.CLOSING_SOON] } },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        title: true,
        description: true,
        city: true,
        category: true,
        serviceType: true,
        budget: true,
        createdAt: true,
        _count: { select: { threads: true } },
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
    const category = dto.category || null;
    const serviceType = dto.serviceType || null;

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
      where: { clientId, status: { in: [RequestStatus.NEW, RequestStatus.OPEN, RequestStatus.IN_PROGRESS, RequestStatus.CLOSING_SOON] } },
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
        serviceType,
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

  async findFeed(city?: string, page = 1, category?: string, maxBudget?: number, ifnsId?: string, serviceType?: string) {
    // #1855: Sanitize page to prevent negative skip
    const pageNum = Math.max(1, parseInt(page as unknown as string) || 1);

    const where: any = { status: { in: [RequestStatus.OPEN, RequestStatus.IN_PROGRESS, RequestStatus.CLOSING_SOON] } };
    // #1849: Case-insensitive city filter
    if (city) where.city = { equals: city, mode: 'insensitive' };
    // #1801: Category filter (case-insensitive contains)
    if (category) where.category = { contains: category, mode: 'insensitive' };
    // #1801: Max budget filter
    if (maxBudget && maxBudget > 0) where.budget = { lte: maxBudget };
    // IFNS filter
    if (ifnsId) where.ifnsId = ifnsId;
    // #909: Service type filter
    if (serviceType) where.serviceType = { equals: serviceType, mode: 'insensitive' };

    const skip = (pageNum - 1) * PAGE_SIZE;

    const [items, total] = await Promise.all([
      this.prisma.request.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: PAGE_SIZE,
        include: {
          client: { select: { id: true } },
          _count: { select: { threads: true } },
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
        _count: { select: { threads: true } },
        threads: {
          include: {
            participant1: {
              select: {
                id: true, email: true,
                specialistProfile: { select: { nick: true, displayName: true, avatarUrl: true } },
              },
            },
            participant2: {
              select: {
                id: true, email: true,
                specialistProfile: { select: { nick: true, displayName: true, avatarUrl: true } },
              },
            },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: { id: true, content: true, senderId: true, createdAt: true, readAt: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async getDashboardStats(clientId: string) {
    const maxRequests = await this.getMaxRequests();

    // Post-migration: "responses" concept replaced by threads. Count threads on client's requests.
    const [totalRequests, activeRequests, totalThreads] =
      await Promise.all([
        this.prisma.request.count({ where: { clientId } }),
        this.prisma.request.count({ where: { clientId, status: { in: [RequestStatus.NEW, RequestStatus.OPEN, RequestStatus.IN_PROGRESS, RequestStatus.CLOSING_SOON] } } }),
        this.prisma.thread.count({
          where: { request: { clientId } },
        }),
      ]);

    return {
      totalRequests,
      maxRequests,
      activeRequests,
      totalResponses: totalThreads,
      acceptedResponses: 0,
    };
  }

  async findById(requestId: string, userId: string | null) {
    const request = await this.prisma.request.findUnique({
      where: { id: requestId },
      include: {
        _count: { select: { threads: true } },
        threads: {
          include: {
            participant1: {
              select: {
                id: true, email: true,
                specialistProfile: { select: { nick: true, displayName: true, avatarUrl: true } },
              },
            },
            participant2: {
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

    // Owner gets full data; everyone else gets public fields only (no clientId, no threads)
    if (userId !== null && userId === request.clientId) {
      return request;
    }

    const { clientId: _omit, threads: _th, ...publicFields } = request;
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
        serviceType: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { threads: true } },
      },
    });

    if (!request || request.status === RequestStatus.CLOSED || request.status === RequestStatus.CANCELLED) {
      throw new NotFoundException('Request not found');
    }

    const { _count, ...rest } = request;
    return { ...rest, responseCount: _count.threads };
  }

  /**
   * Auto-transition request to IN_PROGRESS when a specialist sends the first message.
   * Called from ChatGateway. Only transitions from OPEN or NEW.
   */
  async autoTransitionToInProgress(specialistId: string, threadParticipantIds: [string, string]): Promise<void> {
    const [p1, p2] = threadParticipantIds;
    const otherUserId = p1 === specialistId ? p2 : p1;

    // Direct-chat model: transition any NEW/OPEN requests owned by the other user
    // that have a thread with this specialist
    const threads = await this.prisma.thread.findMany({
      where: {
        specialistId,
        request: {
          clientId: otherUserId,
          status: { in: [RequestStatus.NEW, RequestStatus.OPEN] },
        },
      },
      select: { requestId: true },
    });

    const requestIds = threads.map((t) => t.requestId).filter((id): id is string => id !== null);
    if (requestIds.length === 0) return;

    const { count } = await this.prisma.request.updateMany({
      where: {
        id: { in: requestIds },
        status: { in: [RequestStatus.NEW, RequestStatus.OPEN] },
      },
      data: { status: RequestStatus.IN_PROGRESS },
    });

    if (count > 0) {
      this.logger.log(`Auto-transitioned ${count} request(s) to IN_PROGRESS (specialist: ${specialistId})`);
    }
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

    // Validate specialist participated in a thread on this request
    const thread = await this.prisma.thread.findFirst({
      where: { requestId, specialistId },
      select: { id: true },
    });
    if (!thread) throw new BadRequestException('This specialist did not respond to this request');

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
   * Close a request manually. Owner only. Allowed from NEW/OPEN/IN_PROGRESS/CLOSING_SOON.
   * Returns the updated request with threads so frontend can show review CTAs.
   */
  async closeRequest(clientId: string, requestId: string) {
    const request = await this.prisma.request.findUnique({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Request not found');
    if (request.clientId !== clientId) throw new ForbiddenException('Not your request');

    const closeable = new Set<RequestStatus>([
      RequestStatus.NEW,
      RequestStatus.OPEN,
      RequestStatus.IN_PROGRESS,
      RequestStatus.CLOSING_SOON,
    ]);
    if (!closeable.has(request.status)) {
      throw new BadRequestException(`Cannot close a request with status ${request.status}`);
    }

    return this.prisma.request.update({
      where: { id: requestId },
      data: { status: RequestStatus.CLOSED },
      include: {
        _count: { select: { threads: true } },
        threads: {
          include: {
            participant1: {
              select: {
                id: true, email: true,
                specialistProfile: { select: { nick: true, displayName: true, avatarUrl: true } },
              },
            },
            participant2: {
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

  /**
   * Delete a request and all related responses/reviews.
   * Only the owner can delete, and only OPEN requests.
   */
  async deleteRequest(clientId: string, requestId: string): Promise<{ deleted: true }> {
    const request = await this.prisma.request.findUnique({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Request not found');
    if (request.clientId !== clientId) throw new ForbiddenException('Not your request');
    if (request.status !== RequestStatus.NEW && request.status !== RequestStatus.OPEN) {
      throw new BadRequestException('Can only delete requests with NEW or OPEN status');
    }

    await this.prisma.$transaction(async (tx) => {
      // Delete reviews for this request
      await tx.review.deleteMany({ where: { requestId } });
      // Delete messages in all threads for this request
      await tx.message.deleteMany({ where: { thread: { requestId } } });
      // Delete threads for this request
      await tx.thread.deleteMany({ where: { requestId } });
      // Delete the request itself
      await tx.request.delete({ where: { id: requestId } });
    });

    return { deleted: true };
  }

  async updateFields(
    clientId: string,
    requestId: string,
    dto: { title?: string; description?: string; city?: string; budget?: number | null; category?: string | null; serviceType?: string | null; ifnsId?: string; ifnsName?: string },
  ) {
    const request = await this.prisma.request.findUnique({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Request not found');
    if (request.clientId !== clientId) throw new ForbiddenException('Not your request');
    if (request.status !== RequestStatus.NEW && request.status !== RequestStatus.OPEN) {
      throw new BadRequestException('Can only edit requests with NEW or OPEN status');
    }

    const data: Record<string, unknown> = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.city !== undefined) data.city = dto.city;
    if (dto.budget !== undefined) data.budget = dto.budget;
    if (dto.category !== undefined) data.category = dto.category;
    if (dto.serviceType !== undefined) data.serviceType = dto.serviceType;
    if (dto.ifnsId !== undefined) data.ifnsId = dto.ifnsId;
    if (dto.ifnsName !== undefined) data.ifnsName = dto.ifnsName;

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('No fields to update');
    }

    return this.prisma.request.update({
      where: { id: requestId },
      data,
    });
  }

  async updateStatus(clientId: string, requestId: string, status: RequestStatus) {
    // Validate enum value
    if (!Object.values(RequestStatus).includes(status)) {
      throw new BadRequestException(`Invalid status: ${status}`);
    }

    const request = await this.prisma.request.findUnique({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Request not found');
    if (request.clientId !== clientId) throw new ForbiddenException('Not your request');

    // Guard: reject no-op transitions
    if (request.status === status) {
      throw new BadRequestException(`Request is already in status ${status}`);
    }

    // Transition matrix: defines all valid moves
    const ALLOWED_TRANSITIONS: Partial<Record<RequestStatus, RequestStatus[]>> = {
      [RequestStatus.NEW]: [RequestStatus.OPEN, RequestStatus.CANCELLED],
      [RequestStatus.OPEN]: [RequestStatus.IN_PROGRESS, RequestStatus.CLOSING_SOON, RequestStatus.CLOSED, RequestStatus.CANCELLED],
      [RequestStatus.IN_PROGRESS]: [RequestStatus.CLOSED, RequestStatus.CANCELLED],
      [RequestStatus.CLOSING_SOON]: [RequestStatus.OPEN, RequestStatus.IN_PROGRESS, RequestStatus.CLOSED, RequestStatus.CANCELLED],
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
   * Extend a request: resets lastActivityAt and increments extensionsCount.
   * Max 3 extensions allowed. Only the owner can extend.
   */
  async extend(clientId: string, requestId: string) {
    const request = await this.prisma.request.findUnique({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Request not found');
    if (request.clientId !== clientId) throw new ForbiddenException('Not your request');
    const extendableStatuses = new Set<RequestStatus>([RequestStatus.OPEN, RequestStatus.IN_PROGRESS, RequestStatus.CLOSING_SOON]);
    if (!extendableStatuses.has(request.status)) {
      throw new BadRequestException('Can only extend requests with OPEN, IN_PROGRESS, or CLOSING_SOON status');
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
        status: { in: [RequestStatus.OPEN, RequestStatus.IN_PROGRESS] },
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
        status: { in: [RequestStatus.NEW, RequestStatus.OPEN, RequestStatus.IN_PROGRESS, RequestStatus.CLOSING_SOON] },
        lastActivityAt: { lt: cutoff },
      },
      data: { status: RequestStatus.CLOSED },
    });

    this.logger.log(`autoCloseStale: ${count} requests auto-closed`);
  }

  /**
   * Upload documents to a request. Stores files in S3 and appends metadata to the request's documents JSON field.
   * Only the request owner can upload, and only for NEW or OPEN requests.
   */
  async uploadDocuments(clientId: string, requestId: string, files: Express.Multer.File[]) {
    const request = await this.prisma.request.findUnique({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Request not found');
    if (request.clientId !== clientId) throw new ForbiddenException('Not your request');
    if (request.status !== RequestStatus.NEW && request.status !== RequestStatus.OPEN) {
      throw new BadRequestException('Can only upload documents to requests with NEW or OPEN status');
    }

    const existingDocs = (request.documents as any[]) || [];
    const newDocs: { key: string; name: string; mimeType: string; size: number; uploadedAt: string }[] = [];

    for (const file of files) {
      const key = `requests/${requestId}/${Date.now()}-${file.originalname}`;
      await this.storageService.uploadBuffer(key, file.buffer, file.mimetype);
      newDocs.push({
        key,
        name: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        uploadedAt: new Date().toISOString(),
      });
    }

    const allDocs = [...existingDocs, ...newDocs];

    return this.prisma.request.update({
      where: { id: requestId },
      data: { documents: allDocs },
      select: { id: true, documents: true },
    });
  }
}
