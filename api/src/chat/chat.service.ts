import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  /** List threads where user is participant, sorted by last message */
  async getThreads(userId: string) {
    const threads = await this.prisma.thread.findMany({
      where: {
        OR: [
          { participant1Id: userId },
          { participant2Id: userId },
        ],
      },
      include: {
        participant1: { select: { id: true, email: true, role: true } },
        participant2: { select: { id: true, email: true, role: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { id: true, content: true, senderId: true, createdAt: true, readAt: true },
        },
      },
    });

    // Sort by last message date (threads with messages first, then by createdAt)
    threads.sort((a, b) => {
      const aDate = a.messages[0]?.createdAt ?? a.createdAt;
      const bDate = b.messages[0]?.createdAt ?? b.createdAt;
      return bDate.getTime() - aDate.getTime();
    });

    return threads.map((t) => ({
      id: t.id,
      participant1: t.participant1,
      participant2: t.participant2,
      lastMessage: t.messages[0] ?? null,
      createdAt: t.createdAt,
    }));
  }

  /** Get paginated messages for a thread (oldest first) */
  async getMessages(userId: string, threadId: string, page: number) {
    const thread = await this.prisma.thread.findUnique({ where: { id: threadId } });
    if (!thread) throw new NotFoundException('Thread not found');
    if (thread.participant1Id !== userId && thread.participant2Id !== userId) {
      throw new ForbiddenException('Not a participant of this thread');
    }

    const take = 50;
    const skip = (page - 1) * take;

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { threadId },
        orderBy: { createdAt: 'asc' },
        skip,
        take,
        select: {
          id: true,
          threadId: true,
          senderId: true,
          content: true,
          readAt: true,
          createdAt: true,
        },
      }),
      this.prisma.message.count({ where: { threadId } }),
    ]);

    return { messages, total, page, pages: Math.ceil(total / take) };
  }

  /** Upsert thread between two users. Returns { threadId } */
  async startThread(userId: string, otherUserId: string) {
    if (userId === otherUserId) {
      throw new BadRequestException('Cannot start a thread with yourself');
    }

    // Verify the other user exists
    const other = await this.prisma.user.findUnique({ where: { id: otherUserId } });
    if (!other) throw new NotFoundException('User not found');

    // Sort IDs to enforce unique constraint invariant: participant1Id < participant2Id
    const [p1, p2] = [userId, otherUserId].sort();

    const thread = await this.prisma.thread.upsert({
      where: { participant1Id_participant2Id: { participant1Id: p1, participant2Id: p2 } },
      create: { participant1Id: p1, participant2Id: p2 },
      update: {},
      select: { id: true },
    });

    return { threadId: thread.id };
  }

  /** Verify user is participant of thread */
  async verifyParticipant(userId: string, threadId: string) {
    const thread = await this.prisma.thread.findUnique({ where: { id: threadId } });
    if (!thread) return null;
    if (thread.participant1Id !== userId && thread.participant2Id !== userId) return null;
    return thread;
  }

  /** Save a message to DB */
  async createMessage(threadId: string, senderId: string, content: string) {
    return this.prisma.message.create({
      data: { threadId, senderId, content },
      select: {
        id: true,
        threadId: true,
        senderId: true,
        content: true,
        readAt: true,
        createdAt: true,
      },
    });
  }

  /** Mark message as read */
  async markRead(userId: string, messageId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: { thread: true },
    });
    if (!message) return null;

    // Only the recipient (not the sender) can mark as read
    const thread = message.thread;
    if (thread.participant1Id !== userId && thread.participant2Id !== userId) return null;
    if (message.senderId === userId) return message; // sender can't mark own message as read

    return this.prisma.message.update({
      where: { id: messageId },
      data: { readAt: new Date() },
      select: {
        id: true,
        threadId: true,
        senderId: true,
        content: true,
        readAt: true,
        createdAt: true,
      },
    });
  }
}
