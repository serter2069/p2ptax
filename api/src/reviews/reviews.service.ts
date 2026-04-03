import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { RequestStatus } from '@prisma/client';

const PAGE_SIZE = 20;

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(clientId: string, dto: CreateReviewDto) {
    // Resolve specialist by nick
    const specialistProfile = await this.prisma.specialistProfile.findUnique({
      where: { nick: dto.specialistNick },
    });
    if (!specialistProfile) {
      throw new NotFoundException('Specialist not found');
    }
    const specialistId = specialistProfile.userId;

    // Validate request belongs to client and is CLOSED
    const request = await this.prisma.request.findUnique({
      where: { id: dto.requestId },
    });
    if (!request) {
      throw new NotFoundException('Request not found');
    }
    if (request.clientId !== clientId) {
      throw new ForbiddenException('This request does not belong to you');
    }
    if (request.status !== RequestStatus.CLOSED) {
      throw new BadRequestException('Request must be CLOSED to leave a review');
    }

    // Validate specialist responded to this request
    const response = await this.prisma.response.findUnique({
      where: {
        specialistId_requestId: {
          specialistId,
          requestId: dto.requestId,
        },
      },
    });
    if (!response) {
      throw new BadRequestException('This specialist did not respond to this request');
    }

    // Check for duplicate
    const existing = await this.prisma.review.findUnique({
      where: {
        clientId_specialistId_requestId: {
          clientId,
          specialistId,
          requestId: dto.requestId,
        },
      },
    });
    if (existing) {
      throw new ConflictException('You have already reviewed this specialist for this request');
    }

    return this.prisma.review.create({
      data: {
        clientId,
        specialistId,
        requestId: dto.requestId,
        rating: dto.rating,
        comment: dto.comment ?? null,
      },
    });
  }

  async listByClient(clientId: string) {
    return this.prisma.review.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
      include: {
        specialist: {
          select: {
            id: true,
            email: true,
            specialistProfile: {
              select: { nick: true, displayName: true, avatarUrl: true },
            },
          },
        },
      },
    });
  }

  async listBySpecialist(nick: string, page = 1) {
    const specialistProfile = await this.prisma.specialistProfile.findUnique({
      where: { nick },
    });
    if (!specialistProfile) {
      throw new NotFoundException('Specialist not found');
    }
    const specialistId = specialistProfile.userId;

    const skip = (page - 1) * PAGE_SIZE;
    const [items, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { specialistId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: PAGE_SIZE,
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          client: { select: { id: true, username: true, email: true } },
        },
      }),
      this.prisma.review.count({ where: { specialistId } }),
    ]);

    return { items, total, page, pageSize: PAGE_SIZE };
  }

  /**
   * Check if a client can review a specialist:
   * - has a CLOSED request that the specialist responded to
   * - hasn't already reviewed that request
   * Returns { canReview: boolean, eligibleRequestId: string | null }
   */
  async checkEligibility(clientId: string, nick: string) {
    const specialistProfile = await this.prisma.specialistProfile.findUnique({
      where: { nick },
    });
    if (!specialistProfile) {
      return { canReview: false, eligibleRequestId: null };
    }
    const specialistId = specialistProfile.userId;

    // Find a closed request from this client that this specialist responded to
    const closedRequest = await this.prisma.request.findFirst({
      where: {
        clientId,
        status: RequestStatus.CLOSED,
        responses: {
          some: { specialistId },
        },
      },
      select: { id: true },
    });

    if (!closedRequest) {
      return { canReview: false, eligibleRequestId: null };
    }

    // Check if already reviewed
    const alreadyReviewed = await this.prisma.review.findUnique({
      where: {
        clientId_specialistId_requestId: {
          clientId,
          specialistId,
          requestId: closedRequest.id,
        },
      },
    });

    if (alreadyReviewed) {
      return { canReview: false, eligibleRequestId: null };
    }

    return { canReview: true, eligibleRequestId: closedRequest.id };
  }
}
