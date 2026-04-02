import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChatService } from './chat.service';

@Controller('threads')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  getThreads(@Request() req: { user: { id: string } }) {
    return this.chatService.getThreads(req.user.id);
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
