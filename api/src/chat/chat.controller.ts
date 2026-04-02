import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChatService } from './chat.service';
import { StartThreadDto } from './dto/start-thread.dto';

@Controller('threads')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

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
}
