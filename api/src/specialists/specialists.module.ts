import { Module } from '@nestjs/common';
import { SpecialistsService } from './specialists.service';
import { SpecialistsController } from './specialists.controller';
import { SpecialistPortalController } from './specialist-portal.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { RequestsModule } from '../requests/requests.module';

@Module({
  imports: [PrismaModule, RequestsModule],
  controllers: [SpecialistsController, SpecialistPortalController],
  providers: [SpecialistsService],
  exports: [SpecialistsService],
})
export class SpecialistsModule {}
