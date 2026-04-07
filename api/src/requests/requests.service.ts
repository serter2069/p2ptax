import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { RespondRequestDto } from './dto/respond-request.dto';
import { RequestStatus } from '@prisma/client';

const PAGE_SIZE = 20;

@Injectable()
export class RequestsService {
  constructor(private prisma: PrismaService) {}

  async create(clientId: string, dto: CreateRequestDto) {
    return this.prisma.request.create({
      data: {
        clientId,
        description: dto.description,
        city: dto.city,
      },
    });
  }

  async findFeed(
    city?: string,
    page = 1,
    status?: string,
    search?: string,
    category?: string,
    budgetMin?: number,
    budgetMax?: number,
  ) {
    // Default to OPEN if no status provided; validate against known statuses
    const allowedStatuses = Object.values(RequestStatus);
    const resolvedStatus =
      status && allowedStatuses.includes(status as RequestStatus)
        ? (status as RequestStatus)
        : RequestStatus.OPEN;
    const where: any = { status: resolvedStatus };
    if (city) where.city = city;
    if (search && search.trim()) {
      where.description = { contains: search.trim(), mode: 'insensitive' };
    }
    if (category) where.category = category;
    if (budgetMin != null) where.budget = { ...(where.budget || {}), gte: budgetMin };
    if (budgetMax != null) where.budget = { ...(where.budget || {}), lte: budgetMax };

    const skip = (page - 1) * PAGE_SIZE;

    const [items, total] = await Promise.all([
      this.prisma.request.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: PAGE_SIZE,
        include: {
          client: { select: { id: true, email: true } },
          _count: { select: { responses: true } },
        },
      }),
      this.prisma.request.count({ where }),
    ]);

    return { items, total, page, pageSize: PAGE_SIZE };
  }

  async findMy(clientId: string) {
    return this.prisma.request.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { responses: true } },
        responses: {
          include: {
            specialist: { select: { id: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async respond(specialistId: string, requestId: string, dto: RespondRequestDto) {
    // Check request exists and is open
    const request = await this.prisma.request.findUnique({
      where: { id: requestId },
      include: { client: { select: { id: true, email: true } } },
    });
    if (!request) throw new NotFoundException('Request not found');
    if (request.status !== RequestStatus.OPEN) {
      throw new BadRequestException('Request is not open for responses');
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

    // Email notification to client (no mail service yet — log + TODO)
    try {
      // TODO: replace with real email service when available
      console.log(
        `[NOTIFY] New response to request ${requestId}. ` +
          `Client: ${request.client.email}, Specialist: ${specialistId}`,
      );
    } catch (err) {
      console.error('[NOTIFY] Failed to send email notification:', err);
    }

    return result;
  }

  async updateStatus(clientId: string, requestId: string, status: RequestStatus) {
    const request = await this.prisma.request.findUnique({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Request not found');
    if (request.clientId !== clientId) throw new ForbiddenException('Not your request');

    return this.prisma.request.update({
      where: { id: requestId },
      data: { status },
    });
  }
}
