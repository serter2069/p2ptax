import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { InAppNotificationService } from './in-app-notification.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notifService: InAppNotificationService) {}

  @Get()
  list(@Request() req: any, @Query('page') page?: string) {
    return this.notifService.list(req.user.id, page ? parseInt(page, 10) : 1);
  }

  @Get('unread-count')
  unreadCount(@Request() req: any) {
    return this.notifService.unreadCount(req.user.id);
  }

  @Patch(':id/read')
  markRead(@Request() req: any, @Param('id') id: string) {
    return this.notifService.markRead(req.user.id, id);
  }

  @Post('read-all')
  markAllRead(@Request() req: any) {
    return this.notifService.markAllRead(req.user.id);
  }
}
