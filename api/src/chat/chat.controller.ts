import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { StartThreadDto } from './dto/start-thread.dto';
import { SendMessageDto } from './dto/send-message.dto';

@Controller('threads')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
  ) {}

  @Get()
  getThreads(@Request() req: { user: { id: string } }) {
    return this.chatService.getThreads(req.user.id);
  }

  // POST /threads/start — upsert thread between current user and otherUserId
  @Post('start')
  startThread(
    @Request() req: { user: { id: string } },
    @Body() dto: StartThreadDto,
  ) {
    return this.chatService.startThread(req.user.id, dto.otherUserId);
  }

  @Get(':id/messages')
  getMessages(
    @Request() req: { user: { id: string } },
    @Param('id') threadId: string,
    @Query('page') page?: string,
  ) {
    return this.chatService.getMessages(req.user.id, threadId, parseInt(page ?? '1', 10) || 1);
  }

  // POST /threads/:id/messages — send a message via REST (fallback when WebSocket unavailable)
  @Post(':id/messages')
  async sendMessage(
    @Request() req: { user: { id: string; email: string } },
    @Param('id') threadId: string,
    @Body() dto: SendMessageDto,
  ) {
    const thread = await this.chatService.verifyParticipant(req.user.id, threadId);
    if (!thread) {
      throw new NotFoundException('Thread not found or access denied');
    }

    const message = await this.chatService.createMessage(threadId, req.user.id, dto.content.trim());

    const room = `thread:${threadId}`;

    // Notify connected participants in real time via WebSocket (same as gateway)
    try {
      this.chatGateway.server.to(room).emit('message_received', message);
    } catch {
      // Non-blocking — WS emit failure must not fail the REST response
    }

    // Email notification for offline recipient — fire-and-forget (same logic as gateway)
    const recipientId =
      thread.participant1Id === req.user.id
        ? thread.participant2Id
        : thread.participant1Id;

    const recipientOnline = this.chatGateway.isUserInRoom(recipientId, room);
    if (!recipientOnline) {
      this.chatGateway.notifyRecipientAsync(recipientId, req.user.email, threadId).catch(() => {});
    }

    return message;
  }

  // PATCH /threads/:id/messages/:messageId/read — mark a message as read via REST
  @Patch(':id/messages/:messageId/read')
  async markMessageRead(
    @Request() req: { user: { id: string } },
    @Param('id') threadId: string,
    @Param('messageId') messageId: string,
  ) {
    // Verify thread access first
    const thread = await this.chatService.verifyParticipant(req.user.id, threadId);
    if (!thread) {
      throw new ForbiddenException('Thread not found or access denied');
    }

    const updated = await this.chatService.markRead(req.user.id, messageId);
    if (!updated) {
      throw new NotFoundException('Message not found or cannot be marked as read');
    }

    return updated;
  }
}
