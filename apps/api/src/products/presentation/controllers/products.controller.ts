import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PaginatedResponse } from '@angaly/types';

import { ListProductsQueryDto } from '../../application/dtos/list-products-query.dto';
import { PaginatedProductResponseDto, ProductResponseDto } from '../../application/dtos/product-response.dto';
import { GetProductBySlugUseCase } from '../../application/use-cases/get-product-by-slug.use-case';
import { ListProductsUseCase } from '../../application/use-cases/list-products.use-case';
import { ListSimilarProductsUseCase } from '../../application/use-cases/list-similar-products.use-case';
import { ProductMapper } from '../../infrastructure/mappers/product.mapper';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly listProductsUseCase: ListProductsUseCase,
    private readonly listSimilarProductsUseCase: ListSimilarProductsUseCase,
    private readonly getProductBySlugUseCase: GetProductBySlugUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary:
      'List products, filtered by category/size/color/material/status/price, paginated — ' +
      'or, with `exclude` + `category`, list similar products instead (see docs/features/products.md)',
  })
  @ApiResponse({ status: 200, type: PaginatedProductResponseDto })
  async list(
    @Query() query: ListProductsQueryDto,
  ): Promise<PaginatedResponse<ProductResponseDto> | ProductResponseDto[]> {
    if (query.exclude && query.categoryId) {
      const items = await this.listSimilarProductsUseCase.execute({
        categoryId: query.categoryId,
        excludeProductId: query.exclude,
        limit: query.limit,
      });
      return items.map((item) => ProductMapper.toResponseDto(item));
    }

    const { items, total } = await this.listProductsUseCase.execute(query);
    const totalPages = Math.max(1, Math.ceil(total / query.limit));

    return {
      data: items.map((item) => ProductMapper.toResponseDto(item)),
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
  @ApiOperation({ summary: 'Get a product by slug, with its variants, inventory, and ordered media' })
  @ApiResponse({ status: 200, type: ProductResponseDto })
  async getBySlug(@Param('slug') slug: string): Promise<ProductResponseDto> {
    const product = await this.getProductBySlugUseCase.execute(slug);
    return ProductMapper.toResponseDto(product);
  }
}
