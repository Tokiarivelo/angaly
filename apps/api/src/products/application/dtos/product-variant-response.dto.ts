import { ApiProperty } from '@nestjs/swagger';
import { ProductMediaDto, ProductPriceDto, ProductVariantDto } from '@angaly/types';

export class ProductPriceResponseDto implements ProductPriceDto {
  @ApiProperty()
  amount!: string;

  @ApiProperty()
  currency!: string;
}

export class ProductMediaResponseDto implements ProductMediaDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  url!: string;

  @ApiProperty()
  altText!: string;

  @ApiProperty()
  sortOrder!: number;
}

export class ProductVariantResponseDto implements ProductVariantDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  sku!: string;

  @ApiProperty()
  size!: string;

  @ApiProperty()
  color!: string;

  @ApiProperty({ nullable: true, type: String })
  material!: string | null;

  @ApiProperty({ nullable: true, type: ProductPriceResponseDto })
  priceOverride!: ProductPriceResponseDto | null;

  @ApiProperty()
  quantityAvailable!: number;

  @ApiProperty()
  quantityReserved!: number;

  @ApiProperty({ type: [ProductMediaResponseDto] })
  media!: ProductMediaResponseDto[];
}
