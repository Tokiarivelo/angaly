import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsInt, IsOptional, IsPositive, IsString, MinLength, ValidateNested } from 'class-validator';

export class OrderItemInputDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  productVariantId!: string;

  @ApiProperty()
  @IsInt()
  @IsPositive()
  quantity!: number;
}

/** Backs `POST /api/orders` — items resolve real price/stock server-side, never trust a client-sent price. */
export class CreateOrderRequestDto {
  @ApiProperty({ type: [OrderItemInputDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemInputDto)
  items!: OrderItemInputDto[];

  @ApiProperty({ required: false, description: 'Free-form shipping address (spec §97) — no fixed shape yet.' })
  @IsOptional()
  shippingAddressJson?: unknown;
}
