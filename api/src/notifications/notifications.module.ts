import { Global, Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { InAppNotificationService } from './in-app-notification.service';
import { NotificationsController } from './notifications.controller';

@Global()
@Module({
  controllers: [NotificationsController],
  providers: [EmailService, InAppNotificationService],
  exports: [EmailService, InAppNotificationService],
})
export class NotificationsModule {}
