import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /** Return current user profile (id, email, role, username). */
  async getMe(userId: string): Promise<{ id: string; email: string; role: string; username: string | null }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    return { id: user.id, email: user.email, role: user.role, username: user.username };
  }

  /** Set username for a user. 3-20 chars, alphanumeric + underscore, globally unique. */
  async setUsername(userId: string, username: string): Promise<{ id: string; email: string; role: string; username: string }> {
    if (username.length < 3 || username.length > 20) {
      throw new BadRequestException('Username must be between 3 and 20 characters');
    }
    if (!USERNAME_REGEX.test(username)) {
      throw new BadRequestException('Username can only contain letters, numbers, and underscores');
    }

    const taken = await this.prisma.user.findUnique({ where: { username } });
    if (taken && taken.id !== userId) {
      throw new ConflictException('Username already taken');
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { username },
    });

    return { id: user.id, email: user.email, role: user.role, username: user.username! };
  }

  /**
   * Delete a user and all related records.
   * Order matters: delete dependent records first, then the user.
   * (No ON DELETE CASCADE defined in Prisma schema, so we do it manually.)
   */
  async deleteUser(userId: string): Promise<{ deleted: true }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    await this.prisma.$transaction([
      // Messages sent by user
      this.prisma.message.deleteMany({ where: { senderId: userId } }),

      // Messages in threads where user is a participant (other participant's messages)
      this.prisma.message.deleteMany({
        where: {
          thread: {
            OR: [{ participant1Id: userId }, { participant2Id: userId }],
          },
        },
      }),

      // Threads
      this.prisma.thread.deleteMany({
        where: { OR: [{ participant1Id: userId }, { participant2Id: userId }] },
      }),

      // Responses by user
      this.prisma.response.deleteMany({ where: { specialistId: userId } }),

      // Responses to user's requests
      this.prisma.response.deleteMany({
        where: { request: { clientId: userId } },
      }),

      // Requests
      this.prisma.request.deleteMany({ where: { clientId: userId } }),

      // Promotions
      this.prisma.promotion.deleteMany({ where: { specialistId: userId } }),

      // Specialist profile
      this.prisma.specialistProfile.deleteMany({ where: { userId } }),

      // Legacy chat messages
      this.prisma.chatMessage.deleteMany({ where: { userId } }),

      // Finally, the user
      this.prisma.user.delete({ where: { id: userId } }),
    ]);

    return { deleted: true };
  }
}
