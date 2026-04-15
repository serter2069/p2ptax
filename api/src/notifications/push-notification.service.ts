import { Injectable, Logger } from '@nestjs/common';
import Expo, { ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PushNotificationService {
  private readonly logger = new Logger(PushNotificationService.name);
  private readonly expo = new Expo();

  constructor(private prisma: PrismaService) {}

  /** Save or update push token for a user */
  async saveToken(userId: string, token: string, platform: string) {
    if (!Expo.isExpoPushToken(token)) {
      throw new Error('Invalid Expo push token');
    }

    return this.prisma.pushToken.upsert({
      where: { token },
      update: { userId, platform },
      create: { userId, token, platform },
    });
  }

  /** Remove a specific push token */
  async removeToken(token: string) {
    return this.prisma.pushToken.deleteMany({ where: { token } });
  }

  /** Remove all push tokens for a user (e.g. on logout) */
  async removeAllUserTokens(userId: string) {
    return this.prisma.pushToken.deleteMany({ where: { userId } });
  }

  /** Send push notification to a user by userId */
  async sendPush(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ) {
    const tokens = await this.prisma.pushToken.findMany({
      where: { userId },
      select: { token: true },
    });

    if (tokens.length === 0) return;

    const messages: ExpoPushMessage[] = tokens
      .filter((t) => Expo.isExpoPushToken(t.token))
      .map((t) => ({
        to: t.token,
        sound: 'default' as const,
        title,
        body,
        data: data as Record<string, unknown> | undefined,
      }));

    if (messages.length === 0) return;

    const chunks = this.expo.chunkPushNotifications(messages);

    for (const chunk of chunks) {
      try {
        const tickets: ExpoPushTicket[] = await this.expo.sendPushNotificationsAsync(chunk);

        // Clean up invalid tokens
        for (let i = 0; i < tickets.length; i++) {
          const ticket = tickets[i];
          if (ticket.status === 'error' && ticket.details?.error === 'DeviceNotRegistered') {
            const pushToken = chunk[i].to as string;
            this.logger.warn(`Removing invalid token: ${pushToken}`);
            await this.prisma.pushToken.deleteMany({ where: { token: pushToken } });
          }
        }
      } catch (err) {
        this.logger.error('Failed to send push notifications', err);
      }
    }
  }
}
