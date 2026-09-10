import { ApiProperty } from '@nestjs/swagger';
import {
  PaginatedResponse,
  ProductAvailability,
  ProductCategoryDto as SharedProductCategoryDto,
  ProductDto,
  ProductMediaDto as SharedProductMediaDto,
} from '@angaly/types';

import { ProductPriceResponseDto, ProductVariantResponseDto } from './product-variant-response.dto';

export class ProductMediaResponseDto implements SharedProductMediaDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  url!: string;

  @ApiProperty()
  altText!: string;

  @ApiProperty()
  sortOrder!: number;
}

export class ProductCategoryResponseDto implements SharedProductCategoryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  name!: string;
}

export class ProductResponseDto implements ProductDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  sku!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty({ type: ProductPriceResponseDto })
  price!: ProductPriceResponseDto;

  @ApiProperty({ enum: ProductAvailability })
  status!: ProductAvailability;

  @ApiProperty({ type: ProductCategoryResponseDto })
  category!: ProductCategoryResponseDto;

  @ApiProperty({ type: [ProductMediaResponseDto] })
  media!: ProductMediaResponseDto[];

  @ApiProperty({ type: [ProductVariantResponseDto] })
  variants!: ProductVariantResponseDto[];

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class PaginatedProductResponseDto implements PaginatedResponse<ProductResponseDto> {
  @ApiProperty({ type: [ProductResponseDto] })
  data!: ProductResponseDto[];

  @ApiProperty()
  meta!: PaginatedResponse<ProductResponseDto>['meta'];
}
