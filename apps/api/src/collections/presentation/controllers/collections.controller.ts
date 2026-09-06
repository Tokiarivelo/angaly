import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PaginatedResponse } from '@angaly/types';

import {
  CollectionDetailResponseDto,
  CollectionResponseDto,
  PaginatedCollectionResponseDto,
} from '../../application/dtos/collection-response.dto';
import { ListCollectionsQueryDto } from '../../application/dtos/list-collections-query.dto';
import { GetCollectionBySlugUseCase } from '../../application/use-cases/get-collection-by-slug.use-case';
import { ListCollectionsUseCase } from '../../application/use-cases/list-collections.use-case';
import { CollectionMapper } from '../../infrastructure/mappers/collection.mapper';

@ApiTags('Collections')
@Controller('collections')
export class CollectionsController {
  constructor(
    private readonly listCollectionsUseCase: ListCollectionsUseCase,
    private readonly getCollectionBySlugUseCase: GetCollectionBySlugUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List published collections, filtered by seasonYear, sorted and paginated' })
  @ApiResponse({ status: 200, type: PaginatedCollectionResponseDto })
  async list(@Query() query: ListCollectionsQueryDto): Promise<PaginatedResponse<CollectionResponseDto>> {
    const { items, total } = await this.listCollectionsUseCase.execute(query);
    const totalPages = Math.max(1, Math.ceil(total / query.limit));

    return {
      data: items.map((item) => CollectionMapper.toResponseDto(item)),
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages,
        hasNextPage: query.page < totalPages,
        hasPreviousPage: query.page > 1,
      },
    };
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get a published collection by slug, with its creations and ordered media' })
  @ApiResponse({ status: 200, type: CollectionDetailResponseDto })
  async getBySlug(@Param('slug') slug: string): Promise<CollectionDetailResponseDto> {
    const collection = await this.getCollectionBySlugUseCase.execute(slug);
    return CollectionMapper.toDetailResponseDto(collection);
  }
}
