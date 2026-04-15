import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { SearchService, SearchType } from './search.service';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  search(
    @Query('q') q?: string,
    @Query('type') type?: string,
    @Query('page') page?: string,
  ) {
    if (!q || !q.trim()) {
      throw new BadRequestException('Query parameter "q" is required');
    }

    const validTypes = ['all', 'requests', 'specialists'];
    const searchType: SearchType = validTypes.includes(type ?? '')
      ? (type as SearchType)
      : 'all';

    return this.searchService.search(
      q,
      searchType,
      page ? parseInt(page, 10) : 1,
    );
  }
}
