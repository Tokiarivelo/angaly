import { ApiProperty } from '@nestjs/swagger';
import { ProductAvailability } from '@angaly/types';
import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsOptional, IsString, Matches, Max, Min } from 'class-validator';

const DECIMAL_STRING_PATTERN = /^\d+(\.\d{1,2})?$/;

export class ListProductsQueryDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  size?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  material?: string;

  @ApiProperty({ required: false, enum: ProductAvailability })
  @IsOptional()
  @IsEnum(ProductAvailability)
  status?: ProductAvailability;

  @ApiProperty({ required: false, description: 'Decimal string, e.g. "50000.00"' })
  @IsOptional()
  @IsString()
  @Matches(DECIMAL_STRING_PATTERN)
  priceMin?: string;

  @ApiProperty({ required: false, description: 'Decimal string, e.g. "250000.00"' })
  @IsOptional()
  @IsString()
  @Matches(DECIMAL_STRING_PATTERN)
  priceMax?: string;

  @ApiProperty({ required: false, enum: ['newest', 'priceAsc', 'priceDesc'] })
  @IsOptional()
  @IsIn(['newest', 'priceAsc', 'priceDesc'])
  sort?: 'newest' | 'priceAsc' | 'priceDesc';

  /**
   * Switches this same endpoint to "similar products" mode (list-similar-products.use-case.ts):
   * the id of the product to exclude — requires categoryId too (see docs/features/products.md).
   */
  @ApiProperty({ required: false, description: 'Product id to exclude — switches to "similar products" mode' })
  @IsOptional()
  @IsString()
  exclude?: string;

  @ApiProperty({ required: false, default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiProperty({ required: false, default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;
}
