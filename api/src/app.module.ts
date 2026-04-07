import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { SpecialistsModule } from './specialists/specialists.module';
import { RequestsModule } from './requests/requests.module';
import { PromotionsModule } from './promotions/promotions.module';
import { UsersModule } from './users/users.module';
import { AdminModule } from './admin/admin.module';
import { ReviewsModule } from './reviews/reviews.module';
import { ComplaintsModule } from './complaints/complaints.module';
import { NotificationsModule } from './notifications/notifications.module';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      { name: 'default', ttl: 60000, limit: 60 },
      { name: 'email-otp', ttl: 900000, limit: 3 },
      { name: 'ip-otp', ttl: 900000, limit: 10 },
    ]),
    ScheduleModule.forRoot(),
    PrismaModule,
    StorageModule,
    NotificationsModule,
    AuthModule,
    ChatModule,
    SpecialistsModule,
    RequestsModule,
    PromotionsModule,
    UsersModule,
    AdminModule,
    ReviewsModule,
    ComplaintsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
