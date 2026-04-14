import { Controller, Get, Header } from '@nestjs/common';
import { ProtoService } from './proto.service';

@Controller('proto')
export class ProtoController {
  constructor(private readonly protoService: ProtoService) {}

  @Get('pages')
  @Header('Access-Control-Allow-Origin', 'https://protocanvas.smartlaunchhub.com')
  @Header('Access-Control-Allow-Methods', 'GET')
  getPages() {
    return this.protoService.getPages();
  }
}
