import { Controller, Get, Query } from '@nestjs/common';
import { IfnsService } from './ifns.service';

@Controller('ifns')
export class IfnsController {
  constructor(private readonly ifnsService: IfnsService) {}

  @Get('search')
  search(@Query('q') q: string) {
    return this.ifnsService.search(q || '');
  }
}
