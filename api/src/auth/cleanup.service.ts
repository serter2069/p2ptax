import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CleanupService {
  private readonly logger = new Logger(CleanupService.name);

  constructor(private readonly prisma: PrismaService) {}

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
}
