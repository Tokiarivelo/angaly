import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CategoryResponseDto } from '../../application/dtos/category-response.dto';
import { ListCategoriesQueryDto } from '../../application/dtos/list-categories-query.dto';
import { ListCategoriesUseCase } from '../../application/use-cases/list-categories.use-case';
import { CategoryMapper } from '../../infrastructure/mappers/category.mapper';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly listCategoriesUseCase: ListCategoriesUseCase) {}

  @Get()
  @ApiOperation({ summary: 'List categories, optionally filtered by kind (no pagination — fixed taxonomy)' })
  @ApiResponse({ status: 200, type: [CategoryResponseDto] })
  async list(@Query() query: ListCategoriesQueryDto): Promise<CategoryResponseDto[]> {
    const categories = await this.listCategoriesUseCase.execute(query.kind);
    return categories.map((category) => CategoryMapper.toResponseDto(category));
  }
}
