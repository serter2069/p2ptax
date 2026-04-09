import { Module } from '@nestjs/common';
import { IfnsController } from './ifns.controller';
import { IfnsService } from './ifns.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [IfnsController],
  providers: [IfnsService],
  exports: [IfnsService],
})
export class IfnsModule {}
