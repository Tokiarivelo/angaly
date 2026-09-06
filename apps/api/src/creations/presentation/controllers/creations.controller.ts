import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PaginatedResponse } from '@angaly/types';

import { CreationResponseDto, PaginatedCreationResponseDto } from '../../application/dtos/creation-response.dto';
import { ListCreationsQueryDto } from '../../application/dtos/list-creations-query.dto';
import { GetCreationBySlugUseCase } from '../../application/use-cases/get-creation-by-slug.use-case';
import { ListCreationsUseCase } from '../../application/use-cases/list-creations.use-case';
import { CreationMapper } from '../../infrastructure/mappers/creation.mapper';

@ApiTags('Creations')
@Controller('creations')
export class CreationsController {
  constructor(
    private readonly listCreationsUseCase: ListCreationsUseCase,
    private readonly getCreationBySlugUseCase: GetCreationBySlugUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List creations, filtered by category/collection/featured, paginated' })
  @ApiResponse({ status: 200, type: PaginatedCreationResponseDto })
  async list(@Query() query: ListCreationsQueryDto): Promise<PaginatedResponse<CreationResponseDto>> {
    const { items, total } = await this.listCreationsUseCase.execute(query);
    const totalPages = Math.max(1, Math.ceil(total / query.limit));

    return {
      data: items.map((item) => CreationMapper.toResponseDto(item)),
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
  @ApiOperation({ summary: 'Get a creation by slug, with its ordered media' })
  @ApiResponse({ status: 200, type: CreationResponseDto })
  async getBySlug(@Param('slug') slug: string): Promise<CreationResponseDto> {
    const creation = await this.getCreationBySlugUseCase.execute(slug);
    return CreationMapper.toResponseDto(creation);
  }
}
