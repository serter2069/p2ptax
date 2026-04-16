import { Module } from '@nestjs/common';
import { ResponsesController } from './responses.controller';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [ChatModule],
  controllers: [ResponsesController],
})
export class ResponsesModule {}
