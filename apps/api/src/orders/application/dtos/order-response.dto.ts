import { ApiProperty } from '@nestjs/swagger';
import { OrderDto, OrderItemDto, OrderStatus } from '@angaly/types';

export class OrderItemResponseDto implements OrderItemDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  orderId!: string;

  @ApiProperty()
  productVariantId!: string;

  @ApiProperty()
  quantity!: number;

  @ApiProperty({ description: 'Decimal string, e.g. "45000.00"' })
  unitPrice!: string;
}

export class OrderResponseDto implements OrderDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  orderNumber!: string;

  @ApiProperty()
  customerId!: string;

  @ApiProperty({ enum: OrderStatus })
  status!: OrderStatus;

  @ApiProperty({ description: 'Decimal string' })
  subtotal!: string;

  @ApiProperty({ description: 'Decimal string' })
  shippingCost!: string;

  @ApiProperty({ description: 'Decimal string' })
  total!: string;

  @ApiProperty()
  currency!: string;

  @ApiProperty({ nullable: true, type: Object })
  shippingAddressJson!: unknown;

  @ApiProperty({ type: [OrderItemResponseDto] })
  items!: OrderItemResponseDto[];

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
