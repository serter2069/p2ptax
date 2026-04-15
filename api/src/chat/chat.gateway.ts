import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
  WsException,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../notifications/email.service';
import { ChatService } from './chat.service';
import { RequestsService } from '../requests/requests.service';
import type {
  SendMessagePayload,
  MarkReadPayload,
  TypingPayload,
  JoinThreadPayload,
} from './chat.types';

interface AuthenticatedSocket extends Socket {
  data: { userId: string; email: string; role: string };
}

@WebSocketGateway({
  namespace: '/chat',
  cors: { origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://p2ptax.smartlaunchhub.com'] },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private readonly rateLimits = new Map<string, { count: number; resetAt: number }>();

  /** userId → Set of socketIds — tracks online presence */
  private readonly onlineUsers = new Map<string, Set<string>>();

  private checkRateLimit(userId: string, key: string, maxPerMin: number): boolean {
    const mapKey = `${userId}:${key}`;
    const now = Date.now();
    const entry = this.rateLimits.get(mapKey);
    if (!entry || now > entry.resetAt) {
      this.rateLimits.set(mapKey, { count: 1, resetAt: now + 60_000 });
      return true;
    }
    if (entry.count >= maxPerMin) return false;
    entry.count++;
    return true;
  }

  constructor(
    private readonly jwtService: JwtService,
    private readonly chatService: ChatService,
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly requestsService: RequestsService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.auth?.token;
      if (!token) {
        client.emit('error', { message: 'Authentication required' });
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET!,
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { isBlocked: true },
      });
      if (!user || user.isBlocked) {
        client.emit('error', { message: 'Account blocked' });
        client.disconnect();
        return;
      }

      client.data.userId = payload.sub;
      client.data.email = payload.email;
      client.data.role = payload.role;

      // Track online presence
      const sockets = this.onlineUsers.get(payload.sub);
      if (sockets) {
        sockets.add(client.id);
      } else {
        this.onlineUsers.set(payload.sub, new Set([client.id]));
        // First socket for this user — broadcast online status
        this.server.emit('user:online', { userId: payload.sub });
      }

      this.logger.log(`Authenticated: ${client.data.email} (${client.id})`);
    } catch {
      client.emit('error', { message: 'Invalid token' });
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    const userId = client.data?.userId;
    if (userId) {
      const sockets = this.onlineUsers.get(userId);
      if (sockets) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.onlineUsers.delete(userId);
          // Last socket gone — broadcast offline status
          this.server.emit('user:offline', { userId });
        }
      }
    }
    this.logger.log(`Disconnected: ${client.data?.email ?? client.id}`);
  }

  /** Returns list of currently online user IDs */
  getOnlineUserIds(): string[] {
    return Array.from(this.onlineUsers.keys());
  }

  @SubscribeMessage('join_thread')
  async handleJoinThread(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: JoinThreadPayload,
  ) {
    if (!client.data?.userId) {
      throw new WsException('Not authenticated');
    }

    const thread = await this.chatService.verifyParticipant(client.data.userId, data.threadId);
    if (!thread) {
      client.emit('error', { message: 'Thread not found or access denied' });
      return;
    }

    const room = `thread:${data.threadId}`;
    client.join(room);
    client.emit('joined_thread', { threadId: data.threadId });
    this.logger.log(`${client.data.email} joined ${room}`);
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: SendMessagePayload,
  ) {
    if (!client.data?.userId) {
      throw new WsException('Not authenticated');
    }

    if (!this.checkRateLimit(client.data.userId, 'send_message', 30)) {
      client.emit('error', { message: 'Rate limit exceeded. Try again later.' });
      return;
    }

    // Validate content length to prevent oversized payload attacks
    const MAX_CONTENT_LENGTH = 10000;
    if (data.content && data.content.length > MAX_CONTENT_LENGTH) {
      client.emit('error', { message: 'Message too long' });
      return;
    }

    // Validate attachment URL length
    const MAX_URL_LENGTH = 2048;
    if (data.attachmentUrl && data.attachmentUrl.length > MAX_URL_LENGTH) {
      client.emit('error', { message: 'Attachment URL too long' });
      return;
    }

    // Allow empty content if attachment is present
    const hasAttachment = !!(data.attachmentUrl && data.attachmentType && data.attachmentName);
    if (!data.content?.trim() && !hasAttachment) {
      client.emit('error', { message: 'Content or attachment is required' });
      return;
    }

    const thread = await this.chatService.verifyParticipant(client.data.userId, data.threadId);
    if (!thread) {
      client.emit('error', { message: 'Thread not found or access denied' });
      return;
    }

    const attachment = hasAttachment
      ? { url: data.attachmentUrl!, type: data.attachmentType!, name: data.attachmentName! }
      : undefined;

    const message = await this.chatService.createMessage(
      data.threadId,
      client.data.userId,
      data.content?.trim() ?? '',
      attachment,
    );

    const room = `thread:${data.threadId}`;
    this.server.to(room).emit('message:new', message);
    // Keep legacy event for backward compatibility
    this.server.to(room).emit('message_received', message);

    // Auto-transition request to IN_PROGRESS when specialist sends a message
    if (client.data.role === 'SPECIALIST') {
      this.requestsService
        .autoTransitionToInProgress(client.data.userId, [thread.participant1Id, thread.participant2Id])
        .catch((err) => this.logger.error('Failed to auto-transition request status', err?.message));
    }

    // Email notification for offline recipient — fire-and-forget
    const recipientId =
      thread.participant1Id === client.data.userId
        ? thread.participant2Id
        : thread.participant1Id;

    const recipientOnline = this.isUserInRoom(recipientId, room);
    if (!recipientOnline) {
      this.notifyRecipientAsync(recipientId, client.data.email, data.threadId).catch((err) => this.logger.error('Failed to send offline notification', err?.message));
    }
  }

  @SubscribeMessage('typing:start')
  handleTypingStart(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: TypingPayload,
  ) {
    if (!client.data?.userId) return;

    if (!this.checkRateLimit(client.data.userId, 'typing', 60)) {
      return;
    }

    const room = `thread:${data.threadId}`;
    client.to(room).emit('typing:start', {
      threadId: data.threadId,
      userId: client.data.userId,
    });
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: TypingPayload,
  ) {
    if (!client.data?.userId) return;

    const room = `thread:${data.threadId}`;
    client.to(room).emit('typing:stop', {
      threadId: data.threadId,
      userId: client.data.userId,
    });
  }

  // Keep legacy 'typing' event for backward compatibility
  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: TypingPayload,
  ) {
    if (!client.data?.userId) return;

    if (!this.checkRateLimit(client.data.userId, 'typing', 60)) {
      client.emit('error', { message: 'Rate limit exceeded. Try again later.' });
      return;
    }

    const room = `thread:${data.threadId}`;
    client.to(room).emit('typing', {
      threadId: data.threadId,
      userId: client.data.userId,
    });
  }

  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: MarkReadPayload,
  ) {
    if (!client.data?.userId) {
      throw new WsException('Not authenticated');
    }

    const updated = await this.chatService.markRead(client.data.userId, data.messageId);
    if (!updated) {
      client.emit('error', { message: 'Message not found or access denied' });
      return;
    }

    // Broadcast to the whole thread room so the sender sees the read status
    const room = `thread:${updated.threadId}`;
    this.server.to(room).emit('message:read', { messageId: updated.id, readAt: updated.readAt });
    // Keep legacy event for backward compatibility
    this.server.to(room).emit('message_read', { messageId: updated.id, readAt: updated.readAt });
  }

  /** Look up recipient email and send notification */
  async notifyRecipientAsync(
    recipientId: string,
    senderEmail: string,
    threadId: string,
  ): Promise<void> {
    const recipient = await this.prisma.user.findUnique({
      where: { id: recipientId },
      select: { email: true, notifyNewMessages: true },
    });
    if (recipient?.email && recipient.notifyNewMessages) {
      this.emailService.notifyNewMessage(recipient.email, senderEmail, threadId, recipientId);
    }
  }

  /** Check if a user has any socket in a given room */
  isUserInRoom(userId: string, room: string): boolean {
    const adapter = this.server.adapter as any;
    const roomSockets: Set<string> | undefined = adapter.rooms?.get(room);
    if (!roomSockets) return false;

    const sockets = this.server.sockets as any;
    for (const socketId of roomSockets) {
      const socket = sockets.get?.(socketId) as AuthenticatedSocket | undefined;
      if (socket?.data?.userId === userId) return true;
    }
    return false;
  }
}
