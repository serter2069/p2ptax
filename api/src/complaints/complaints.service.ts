import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { UpdateComplaintStatusDto } from './dto/update-complaint-status.dto';

const PAGE_SIZE = 20;

@Injectable()
export class ComplaintsService {
  constructor(private prisma: PrismaService) {}

  async create(reporterId: string, dto: CreateComplaintDto) {
    // Cannot report yourself
    if (reporterId === dto.targetId) {
      throw new BadRequestException('You cannot report yourself');
    }

    // One complaint per user per target
    const existing = await this.prisma.complaint.findUnique({
      where: {
        reporterId_targetId: { reporterId, targetId: dto.targetId },
      },
    });
    if (existing) {
      throw new ConflictException('Вы уже подавали жалобу на этого пользователя');
    }

    // Rate limit: max 5 complaints per reporter per 24 hours
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentCount = await this.prisma.complaint.count({
      where: {
        reporterId,
        createdAt: { gte: since },
      },
    });
    if (recentCount >= 5) {
      throw new BadRequestException(
        'Превышен лимит жалоб. Максимум 5 жалоб в сутки.',
      );
    }

    // Verify target user exists
    const target = await this.prisma.user.findUnique({
      where: { id: dto.targetId },
      select: { id: true },
    });
    if (!target) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.complaint.create({
      data: {
        reporterId,
        targetId: dto.targetId,
        reason: dto.reason,
        comment: dto.comment ?? null,
      },
      select: {
        id: true,
        reason: true,
        createdAt: true,
      },
    });
  }

  async adminFindAll(page = 1) {
    const skip = (page - 1) * PAGE_SIZE;
    const [items, total] = await Promise.all([
      this.prisma.complaint.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: PAGE_SIZE,
        include: {
          reporter: { select: { id: true, email: true, username: true } },
          target: {
            select: {
              id: true,
              email: true,
              username: true,
              specialistProfile: { select: { nick: true, displayName: true } },
            },
          },
        },
      }),
      this.prisma.complaint.count(),
    ]);
    return { items, total, page, pageSize: PAGE_SIZE };
  }

  async adminUpdateStatus(id: string, dto: UpdateComplaintStatusDto) {
    const complaint = await this.prisma.complaint.findUnique({
      where: { id },
    });
    if (!complaint) {
      throw new NotFoundException('Complaint not found');
    }

    return this.prisma.complaint.update({
      where: { id },
      data: { status: dto.status },
    });
  }
}
