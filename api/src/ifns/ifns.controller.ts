import { Controller, Get, Query } from '@nestjs/common';
import { IfnsService } from './ifns.service';

@Controller('ifns')
export class IfnsController {
  constructor(private readonly ifnsService: IfnsService) {}

  @Get('search')
  search(@Query('q') q: string) {
    return this.ifnsService.search(q || '');
  }

  @Get()
  findAll(@Query('city_id') cityId?: string) {
    return this.ifnsService.findAll(cityId);
  }

  @Get('cities')
  getCities() {
    return this.ifnsService.getCities();
  }
}
