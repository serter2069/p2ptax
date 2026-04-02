import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { SpecialistsModule } from './specialists/specialists.module';
import { RequestsModule } from './requests/requests.module';
import { PromotionsModule } from './promotions/promotions.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    ChatModule,
    SpecialistsModule,
    RequestsModule,
    PromotionsModule,
    UsersModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
