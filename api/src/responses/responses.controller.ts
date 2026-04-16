import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { ChatService } from '../chat/chat.service';
import { CreateResponseDto } from './dto/create-response.dto';

/**
 * POST /api/responses — specialist responds to a client request.
 *
 * The core product action. No separate "Response" Prisma model exists —
 * responding means opening a Thread with the client and sending the first
 * message. Delegates to ChatService.createThreadForRequest, which is
 * idempotent on (requestId, specialistId).
 *
 * Also exposed as POST /api/requests/:id/respond for REST-shape callers.
 */
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ResponsesController {
  constructor(private readonly chatService: ChatService) {}

  /** POST /api/responses  body: { requestId, message } */
  @Post('responses')
  @Roles(Role.SPECIALIST)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Request() req: { user: { id: string; role: Role } },
    @Body() dto: CreateResponseDto,
  ) {
    const result = await this.chatService.createThreadForRequest(
      req.user.id,
      req.user.role,
      dto.requestId,
      dto.message,
    );
    return {
      id: result.thread_id,
      threadId: result.thread_id,
      requestId: dto.requestId,
      created: result.created,
    };
  }

  /** POST /api/requests/:id/respond  body: { message } */
  @Post('requests/:id/respond')
  @Roles(Role.SPECIALIST)
  @HttpCode(HttpStatus.CREATED)
  async respondToRequest(
    @Request() req: { user: { id: string; role: Role } },
    @Param('id') requestId: string,
    @Body() body: { message: string },
  ) {
    const result = await this.chatService.createThreadForRequest(
      req.user.id,
      req.user.role,
      requestId,
      body?.message ?? '',
    );
    return {
      id: result.thread_id,
      threadId: result.thread_id,
      requestId,
      created: result.created,
    };
  }
}
