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
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';

interface AuthenticatedSocket extends Socket {
  data: { userId: string; email: string; role: string };
}

@WebSocketGateway({
  namespace: '/chat',
  cors: { origin: '*' },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly chatService: ChatService,
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
        secret: process.env.JWT_SECRET ?? 'dev-secret-change-in-prod',
      });

      client.data.userId = payload.sub;
      client.data.email = payload.email;
      client.data.role = payload.role;

      console.log(`[Chat] Authenticated: ${client.data.email} (${client.id})`);
    } catch {
      client.emit('error', { message: 'Invalid token' });
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    console.log(`[Chat] Disconnected: ${client.data?.email ?? client.id}`);
  }

  @SubscribeMessage('join_thread')
  async handleJoinThread(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { threadId: string },
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
    console.log(`[Chat] ${client.data.email} joined ${room}`);
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { threadId: string; content: string },
  ) {
    if (!client.data?.userId) {
      throw new WsException('Not authenticated');
    }

    if (!data.content?.trim()) {
      client.emit('error', { message: 'Content is required' });
      return;
    }

    const thread = await this.chatService.verifyParticipant(client.data.userId, data.threadId);
    if (!thread) {
      client.emit('error', { message: 'Thread not found or access denied' });
      return;
    }

    const message = await this.chatService.createMessage(
      data.threadId,
      client.data.userId,
      data.content.trim(),
    );

    const room = `thread:${data.threadId}`;
    this.server.to(room).emit('message_received', message);

    // Email notification for offline recipient (TODO: implement email service)
    try {
      const recipientId =
        thread.participant1Id === client.data.userId
          ? thread.participant2Id
          : thread.participant1Id;

      const recipientOnline = this.isUserInRoom(recipientId, room);
      if (!recipientOnline) {
        console.log(`[Chat] TODO: send email notification to user ${recipientId}`);
      }
    } catch (err) {
      console.error('[Chat] Email notification failed (non-blocking):', err);
    }
  }

  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { threadId: string },
  ) {
    if (!client.data?.userId) return;

    const room = `thread:${data.threadId}`;
    client.to(room).emit('typing', {
      threadId: data.threadId,
      userId: client.data.userId,
    });
  }

  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { messageId: string },
  ) {
    if (!client.data?.userId) {
      throw new WsException('Not authenticated');
    }

    const updated = await this.chatService.markRead(client.data.userId, data.messageId);
    if (!updated) {
      client.emit('error', { message: 'Message not found or access denied' });
      return;
    }

    client.emit('message_read', { messageId: updated.id, readAt: updated.readAt });
  }

  /** Check if a user has any socket in a given room */
  private isUserInRoom(userId: string, room: string): boolean {
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
