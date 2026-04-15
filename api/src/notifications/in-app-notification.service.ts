import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType, Prisma } from '@prisma/client';

const PAGE_SIZE = 20;

@Injectable()
export class InAppNotificationService {
  constructor(private prisma: PrismaService) {}

  /** List user notifications, paginated, newest first */
  async list(userId: string, page = 1) {
    const skip = (page - 1) * PAGE_SIZE;
    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: PAGE_SIZE,
      }),
      this.prisma.notification.count({ where: { userId } }),
    ]);
    return { items, total, page, pageSize: PAGE_SIZE };
  }

  /** Get unread count */
  async unreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });
    return { count };
  }

  /** Mark single notification as read */
  async markRead(userId: string, notificationId: string) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  }

  /** Mark all notifications as read */
  async markAllRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  /** Create a notification entry */
  async create(input: {
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    data?: Prisma.InputJsonValue;
  }) {
    return this.prisma.notification.create({ data: input });
  }
}
