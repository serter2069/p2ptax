import { Module } from '@nestjs/common';
import { SpecialistsService } from './specialists.service';
import { SpecialistsController } from './specialists.controller';
import { SpecialistPortalController } from './specialist-portal.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { RequestsModule } from '../requests/requests.module';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [PrismaModule, RequestsModule, ChatModule],
  controllers: [SpecialistsController, SpecialistPortalController],
  providers: [SpecialistsService],
  exports: [SpecialistsService],
})
export class SpecialistsModule {}
