import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Request,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { randomUUID } from 'crypto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { StorageService } from '../storage/storage.service';
import { InAppNotificationService } from '../notifications/in-app-notification.service';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { StartThreadDto } from './dto/start-thread.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { CreateThreadDto } from './dto/create-thread.dto';
import { Role } from '@prisma/client';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

@Controller('threads')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
    private readonly storageService: StorageService,
    private readonly inAppNotifService: InAppNotificationService,
  ) {}

  @Get()
  getThreads(
    @Request() req: { user: { id: string } },
    @Query('grouped_by') groupedBy?: string,
  ) {
    if (groupedBy === 'request') {
      return this.chatService.getThreadsGroupedByRequest(req.user.id);
    }
    return this.chatService.getThreads(req.user.id);
  }

  /**
   * POST /threads — direct-chat flow (W-1).
   * Body { request_id, first_message }: specialist clicks "Написать" on a request
   * and atomically creates Thread + first Message. Idempotent on (request, specialist).
   * Returns { thread_id, created }.
   */
  @Post()
  createThread(
    @Request() req: { user: { id: string; role: Role } },
    @Body() dto: CreateThreadDto | StartThreadDto,
  ) {
    // Heuristic: new direct-chat shape = { requestId, firstMessage }
    if (
      typeof (dto as CreateThreadDto).firstMessage === 'string' &&
      typeof (dto as CreateThreadDto).requestId === 'string'
    ) {
      const ct = dto as CreateThreadDto;
      return this.chatService.createThreadForRequest(
        req.user.id,
        req.user.role,
        ct.requestId,
        ct.firstMessage,
      );
    }
    // Legacy shape: { otherUserId, requestId? } — kept for backwards compat during rollout
    const st = dto as StartThreadDto;
    if (!st.otherUserId) {
      throw new BadRequestException('firstMessage is required');
    }
    return this.chatService.startThread(req.user.id, st.otherUserId, st.requestId);
  }

  // POST /threads/start — upsert thread (legacy alias, kept for W-2 frontend migration window)
  @Post('start')
  startThread(
    @Request() req: { user: { id: string } },
    @Body() dto: StartThreadDto,
  ) {
    return this.chatService.startThread(req.user.id, dto.otherUserId, dto.requestId);
  }

  /** PATCH /threads/:id/read — update last-read timestamp for the caller's side */
  @Patch(':id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  async markThreadRead(
    @Request() req: { user: { id: string } },
    @Param('id') threadId: string,
  ): Promise<void> {
    await this.chatService.markThreadRead(req.user.id, threadId);
  }

  @Get(':id/messages')
  getMessages(
    @Request() req: { user: { id: string } },
    @Param('id') threadId: string,
    @Query('page') page?: string,
  ) {
    return this.chatService.getMessages(req.user.id, threadId, parseInt(page ?? '1', 10) || 1);
  }

  // POST /threads/:id/upload — upload a file attachment for a thread message
  @Post(':id/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB max
      fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException(`File type not allowed: ${file.mimetype}`), false);
        }
      },
    }),
  )
  async uploadChatFile(
    @Request() req: { user: { id: string } },
    @Param('id') threadId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<{ url: string; signedUrl: string; type: string; name: string }> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Image limit: 10 MB
    if (IMAGE_MIME_TYPES.has(file.mimetype) && file.size > 10 * 1024 * 1024) {
      throw new BadRequestException('Image files must be under 10 MB');
    }

    // Verify caller is a thread participant
    const thread = await this.chatService.verifyParticipant(req.user.id, threadId);
    if (!thread) {
      throw new NotFoundException('Thread not found or access denied');
    }

    const ext = file.originalname.split('.').pop()?.toLowerCase() || 'bin';
    const fileId = randomUUID();
    const key = `chat/${threadId}/${fileId}.${ext}`;

    // Upload as private (no ACL) — access via presigned URL only
    const s3Key = await this.storageService.uploadBuffer(key, file.buffer, file.mimetype);
    const signedUrl = await this.storageService.getPresignedUrl(s3Key);
    const type = IMAGE_MIME_TYPES.has(file.mimetype) ? 'IMAGE' : 'DOCUMENT';

    // Store the S3 key in DB (not the signed URL) so we can regenerate signed URLs later
    return { url: s3Key, signedUrl, type, name: file.originalname };
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

    const attachment =
      dto.attachmentUrl && dto.attachmentType && dto.attachmentName
        ? { url: dto.attachmentUrl, type: dto.attachmentType, name: dto.attachmentName }
        : undefined;

    // Validate: must have content or attachment
    if (!dto.content?.trim() && !attachment) {
      throw new BadRequestException('Content or attachment is required');
    }

    const message = await this.chatService.createMessage(
      threadId,
      req.user.id,
      dto.content?.trim() ?? '',
      attachment,
    );

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

    // In-app notification for the recipient
    this.inAppNotifService.create({
      userId: recipientId,
      type: 'NEW_MESSAGE',
      title: 'Новое сообщение',
      body: dto.content?.trim()?.slice(0, 100) || 'Вложение',
      data: { threadId },
    }).catch(() => {});

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
