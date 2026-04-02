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
        budget: dto.budget ?? null,
        category: dto.category ?? null,
      },
    });
  }

  async findFeed(city?: string, page = 1) {
    const where: any = { status: RequestStatus.OPEN };
    if (city) where.city = city;

    const skip = (page - 1) * PAGE_SIZE;

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
          },
        },
      },
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
