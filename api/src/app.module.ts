import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { SpecialistsModule } from './specialists/specialists.module';
import { RequestsModule } from './requests/requests.module';

@Module({
  imports: [PrismaModule, AuthModule, ChatModule, SpecialistsModule, RequestsModule],
  controllers: [AppController],
})
export class AppModule {}
