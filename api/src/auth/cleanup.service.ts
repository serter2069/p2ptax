import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../notifications/email.service';

@Injectable()
export class CleanupService {
  private readonly logger = new Logger(CleanupService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  // Runs every hour at minute 0. All times are UTC.
  @Cron('0 * * * *')
  async cleanupExpiredOtpCodes(): Promise<void> {
    const { count: otpCount } = await this.prisma.otpCode.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });

    this.logger.log(`Deleted ${otpCount} expired OTP codes`);
  }

  // Runs every day at 03:00 UTC.
  @Cron('0 3 * * *')
  async cleanupRevokedRefreshTokens(): Promise<void> {
    const { count: tokenCount } = await this.prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { revoked: true },
          { expiresAt: { lt: new Date() } },
        ],
      },
    });

    this.logger.log(`Deleted ${tokenCount} revoked refresh tokens`);
  }

  // Runs every day at 09:00 UTC. Sends reminder emails for promotions expiring within 3 days.
  @Cron('0 9 * * *')
  async sendPromotionExpiryReminders(): Promise<void> {
    const now = new Date();
    const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const promotions = await this.prisma.promotion.findMany({
      where: {
        reminderSent: false,
        expiresAt: { gt: now, lte: threeDaysLater },
      },
      include: {
        specialist: {
          select: {
            email: true,
            emailNotifications: true,
          },
        },
      },
    });

    const ids = promotions
      .filter((p) => p.specialist.emailNotifications)
      .map((p) => p.id);

    for (const p of promotions) {
      if (p.specialist.emailNotifications) {
        await this.emailService.notifyPromotionExpiringSoon(p.specialist.email, p.city);
      }
    }

    if (ids.length > 0) {
      await this.prisma.promotion.updateMany({
        where: { id: { in: ids }, reminderSent: false },
        data: { reminderSent: true },
      });
    }

    this.logger.log(`Promotion reminders sent: ${ids.length}`);
  }
}
