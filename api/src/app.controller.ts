import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('health')
  health() {
    return {
      status: 'ok',
      project: 'p2ptax',
      timestamp: new Date().toISOString(),
    };
  }
}
