import { Global, Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { InAppNotificationService } from './in-app-notification.service';
import { PushNotificationService } from './push-notification.service';
import { NotificationsController } from './notifications.controller';

@Global()
@Module({
  controllers: [NotificationsController],
  providers: [EmailService, InAppNotificationService, PushNotificationService],
  exports: [EmailService, InAppNotificationService, PushNotificationService],
})
export class NotificationsModule {}
