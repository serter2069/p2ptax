import { Controller, Get } from '@nestjs/common';
import { ContentService } from './content.service';

@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Get('terms')
  getTerms() {
    return this.contentService.getTerms();
  }

  @Get('privacy')
  getPrivacy() {
    return this.contentService.getPrivacy();
  }
}
