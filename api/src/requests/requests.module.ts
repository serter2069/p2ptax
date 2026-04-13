import { Module } from '@nestjs/common';
import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';
import { StorageService } from '../storage/storage.service';

@Module({
  controllers: [RequestsController],
  providers: [RequestsService, StorageService],
  exports: [RequestsService],
})
export class RequestsModule {}
