import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { SearchQueryDto } from '../../application/dtos/search-query.dto';
import { SearchResultsResponseDto } from '../../application/dtos/search-results-response.dto';
import { GlobalSearchUseCase } from '../../application/use-cases/global-search.use-case';
import { SearchResultMapper } from '../../infrastructure/mappers/search-result.mapper';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private readonly globalSearchUseCase: GlobalSearchUseCase) {}

  @Get()
  @ApiOperation({
    summary: 'Global full-text search across creations, products, collections, blog posts and ateliers',
    description: 'Results are grouped by type, each group ranked by relevance and capped at limitPerType.',
  })
  @ApiResponse({ status: 200, type: SearchResultsResponseDto })
  async search(@Query() query: SearchQueryDto): Promise<SearchResultsResponseDto> {
    const results = await this.globalSearchUseCase.execute(query.q, query.limitPerType);

    return {
      creations: results.creations.map((item) => SearchResultMapper.toResponseDto(item)),
      products: results.products.map((item) => SearchResultMapper.toResponseDto(item)),
      collections: results.collections.map((item) => SearchResultMapper.toResponseDto(item)),
      blogPosts: results.blogPosts.map((item) => SearchResultMapper.toResponseDto(item)),
      ateliers: results.ateliers.map((item) => SearchResultMapper.toResponseDto(item)),
    };
  }
}
