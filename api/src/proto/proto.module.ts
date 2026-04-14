import { Module } from '@nestjs/common';
import { ProtoController } from './proto.controller';
import { ProtoService } from './proto.service';

@Module({
  controllers: [ProtoController],
  providers: [ProtoService],
})
export class ProtoModule {}
