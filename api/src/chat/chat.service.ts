import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { RequestStatus, Role } from '@prisma/client';

/** Max new threads a specialist can open per 24h window. SA: "Лимит 20 сообщений в день". */
const SPECIALIST_DAILY_THREAD_LIMIT = 20;

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

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
        participant1: {
          select: {
            id: true, email: true, role: true,
            specialistProfile: { select: { nick: true, displayName: true, avatarUrl: true } },
          },
        },
        participant2: {
          select: {
            id: true, email: true, role: true,
            specialistProfile: { select: { nick: true, displayName: true, avatarUrl: true } },
          },
        },
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

    const withName = (user: typeof threads[0]['participant1']) => {
      const profile = user.specialistProfile;
      return {
        ...user,
        name: profile?.displayName || profile?.nick || user.email.split('@')[0],
      };
    };

    return threads.map((t) => ({
      id: t.id,
      participant1: withName(t.participant1),
      participant2: withName(t.participant2),
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
          attachmentUrl: true,
          attachmentType: true,
          attachmentName: true,
        },
      }),
      this.prisma.message.count({ where: { threadId } }),
    ]);

    // Generate fresh signed URLs for attachments
    // NOTE: existing attachmentUrl in DB are public URLs (pre-migration). After this change, only new uploads use signed URLs.
    const enriched = await Promise.all(
      messages.map(async (msg) => {
        if (!msg.attachmentUrl) return msg;
        // Legacy public URLs start with http — new uploads store only the S3 key
        const isLegacyUrl = msg.attachmentUrl.startsWith('http');
        if (isLegacyUrl) return msg; // keep legacy public URLs as-is
        const signedUrl = await this.storageService.getPresignedUrl(msg.attachmentUrl);
        return { ...msg, signedUrl };
      }),
    );

    return { messages: enriched, total, page, pages: Math.ceil(total / take) };
  }

  /** Upsert thread between two users. Returns { threadId } */
  async startThread(userId: string, otherUserId: string, requestId?: string) {
    if (userId === otherUserId) {
      throw new BadRequestException('Cannot start a thread with yourself');
    }

    // Verify the other user exists
    const other = await this.prisma.user.findUnique({ where: { id: otherUserId } });
    if (!other) throw new NotFoundException('User not found');

    // Verify request exists if provided
    if (requestId) {
      const request = await this.prisma.request.findUnique({ where: { id: requestId } });
      if (!request) throw new NotFoundException('Request not found');
    }

    // Sort IDs to enforce unique constraint invariant: participant1Id < participant2Id
    const [p1, p2] = [userId, otherUserId].sort();

    const thread = await this.prisma.thread.upsert({
      where: { participant1Id_participant2Id: { participant1Id: p1, participant2Id: p2 } },
      create: { participant1Id: p1, participant2Id: p2, ...(requestId && { requestId }) },
      update: { ...(requestId && { requestId }) },
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

  /** Save a message to DB and bump thread's lastMessageAt */
  async createMessage(
    threadId: string,
    senderId: string,
    content: string,
    attachment?: { url: string; type: string; name: string },
  ) {
    const now = new Date();
    const [message] = await this.prisma.$transaction([
      this.prisma.message.create({
        data: {
          threadId,
          senderId,
          content,
          createdAt: now,
          ...(attachment && {
            attachmentUrl: attachment.url,
            attachmentType: attachment.type,
            attachmentName: attachment.name,
          }),
        },
        select: {
          id: true,
          threadId: true,
          senderId: true,
          content: true,
          readAt: true,
          createdAt: true,
          attachmentUrl: true,
          attachmentType: true,
          attachmentName: true,
        },
      }),
      this.prisma.thread.update({
        where: { id: threadId },
        data: { lastMessageAt: now },
        select: { id: true },
      }),
    ]);
    return message;
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
        attachmentUrl: true,
        attachmentType: true,
        attachmentName: true,
      },
    });
  }

  /**
   * POST /api/threads — direct-chat flow (W-1).
   * Atomically creates Thread + first Message. UNIQUE (requestId, specialistId)
   * makes this call idempotent: duplicate invocation returns the existing thread
   * with `created: false` and does NOT insert another first message.
   *
   * Role: SPECIALIST only.
   * Business rules:
   *  - request must exist and not be CLOSED (→ 409)
   *  - message length 10-1000 (DTO validation)
   *  - specialist cannot create >20 new threads in a rolling 24h window (→ 429)
   */
  async createThreadForRequest(
    specialistId: string,
    specialistRole: Role,
    requestId: string,
    firstMessage: string,
  ): Promise<{ thread_id: string; created: boolean }> {
    if (specialistRole !== Role.SPECIALIST) {
      throw new ForbiddenException('Only specialists can initiate threads on requests');
    }

    const trimmed = firstMessage.trim();
    if (trimmed.length < 10 || trimmed.length > 1000) {
      throw new BadRequestException('firstMessage должно быть от 10 до 1000 символов');
    }

    // Load the request with its owner
    const request = await this.prisma.request.findUnique({
      where: { id: requestId },
      select: { id: true, clientId: true, status: true },
    });
    if (!request) throw new NotFoundException('Request not found');

    if (request.clientId === specialistId) {
      throw new BadRequestException('Cannot open a thread on your own request');
    }

    if (request.status === RequestStatus.CLOSED) {
      throw new ConflictException('Заявка закрыта — написать нельзя');
    }

    // Idempotency shortcut: thread already exists for (request, specialist)
    const existing = await this.prisma.thread.findUnique({
      where: { requestId_specialistId: { requestId, specialistId } },
      select: { id: true },
    });
    if (existing) {
      return { thread_id: existing.id, created: false };
    }

    // Rate limit: count threads opened by this specialist in the last 24h
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentCount = await this.prisma.thread.count({
      where: { specialistId, createdAt: { gte: dayAgo } },
    });
    if (recentCount >= SPECIALIST_DAILY_THREAD_LIMIT) {
      throw new HttpException(
        { message: 'Лимит 20 сообщений в день' },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const clientId = request.clientId;
    const [p1, p2] = [specialistId, clientId].sort();
    const now = new Date();

    // Atomic: create Thread + first Message. If a parallel request wins the @@unique
    // race we translate the error into the idempotent branch.
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const thread = await tx.thread.create({
          data: {
            participant1Id: p1,
            participant2Id: p2,
            requestId,
            specialistId,
            lastMessageAt: now,
          },
          select: { id: true },
        });

        await tx.message.create({
          data: {
            threadId: thread.id,
            senderId: specialistId,
            content: trimmed,
            createdAt: now,
          },
        });

        // Bump request.lastActivityAt
        await tx.request.update({
          where: { id: requestId },
          data: { lastActivityAt: now },
        });

        return thread.id;
      });

      return { thread_id: result, created: true };
    } catch (err: unknown) {
      // P2002 = unique constraint violation (raced upsert) → return existing
      if (
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        (err as { code?: string }).code === 'P2002'
      ) {
        const again = await this.prisma.thread.findUnique({
          where: { requestId_specialistId: { requestId, specialistId } },
          select: { id: true },
        });
        if (again) return { thread_id: again.id, created: false };
      }
      throw err;
    }
  }

  /**
   * GET /api/threads?grouped_by=request — client-side grouped view.
   * Returns the caller's threads grouped by the parent request.
   */
  async getThreadsGroupedByRequest(userId: string) {
    const threads = await this.prisma.thread.findMany({
      where: {
        OR: [{ participant1Id: userId }, { participant2Id: userId }],
        requestId: { not: null },
      },
      include: {
        request: {
          select: {
            id: true,
            title: true,
            description: true,
            city: true,
            status: true,
            createdAt: true,
          },
        },
        participant1: {
          select: {
            id: true,
            email: true,
            role: true,
            specialistProfile: {
              select: { nick: true, displayName: true, avatarUrl: true },
            },
          },
        },
        participant2: {
          select: {
            id: true,
            email: true,
            role: true,
            specialistProfile: {
              select: { nick: true, displayName: true, avatarUrl: true },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            content: true,
            senderId: true,
            createdAt: true,
            readAt: true,
          },
        },
      },
    });

    // Group by requestId
    const byRequest = new Map<
      string,
      {
        request: NonNullable<(typeof threads)[number]['request']>;
        threads: Array<{
          id: string;
          participant1: (typeof threads)[number]['participant1'];
          participant2: (typeof threads)[number]['participant2'];
          lastMessage: (typeof threads)[number]['messages'][number] | null;
          lastMessageAt: Date | null;
          createdAt: Date;
        }>;
      }
    >();

    for (const t of threads) {
      if (!t.request) continue;
      const entry = byRequest.get(t.request.id) ?? {
        request: t.request,
        threads: [],
      };
      entry.threads.push({
        id: t.id,
        participant1: t.participant1,
        participant2: t.participant2,
        lastMessage: t.messages[0] ?? null,
        lastMessageAt: t.lastMessageAt,
        createdAt: t.createdAt,
      });
      byRequest.set(t.request.id, entry);
    }

    // Sort threads inside each group by last activity, groups by request.createdAt desc
    const groups = Array.from(byRequest.values()).map((g) => ({
      ...g,
      threads: g.threads.sort((a, b) => {
        const aDate = a.lastMessage?.createdAt ?? a.createdAt;
        const bDate = b.lastMessage?.createdAt ?? b.createdAt;
        return bDate.getTime() - aDate.getTime();
      }),
    }));
    groups.sort(
      (a, b) =>
        new Date(b.request.createdAt).getTime() -
        new Date(a.request.createdAt).getTime(),
    );

    return groups;
  }

  /**
   * PATCH /api/threads/:id/read — read receipt.
   * Updates clientLastReadAt or specialistLastReadAt depending on caller's participant role.
   */
  async markThreadRead(userId: string, threadId: string): Promise<void> {
    const thread = await this.prisma.thread.findUnique({
      where: { id: threadId },
      select: {
        id: true,
        participant1Id: true,
        participant2Id: true,
        specialistId: true,
      },
    });
    if (!thread) throw new NotFoundException('Thread not found');
    if (
      thread.participant1Id !== userId &&
      thread.participant2Id !== userId
    ) {
      throw new ForbiddenException('Not a participant of this thread');
    }

    const now = new Date();
    const isSpecialist = thread.specialistId === userId;
    await this.prisma.thread.update({
      where: { id: threadId },
      data: isSpecialist
        ? { specialistLastReadAt: now }
        : { clientLastReadAt: now },
      select: { id: true },
    });
  }

  /**
   * Specialist portal: list all threads opened by this specialist with request info.
   * Replaces the legacy /specialist/responses endpoint (W-1).
   */
  async findSpecialistThreads(specialistId: string) {
    return this.prisma.thread.findMany({
      where: { specialistId },
      orderBy: [{ lastMessageAt: 'desc' }, { createdAt: 'desc' }],
      include: {
        request: {
          select: {
            id: true,
            title: true,
            description: true,
            city: true,
            status: true,
            createdAt: true,
            clientId: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            content: true,
            senderId: true,
            createdAt: true,
            readAt: true,
          },
        },
      },
    });
  }
}
