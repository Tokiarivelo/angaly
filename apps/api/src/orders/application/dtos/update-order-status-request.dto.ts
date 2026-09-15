import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '@angaly/types';
import { IsEnum } from 'class-validator';

/** Backs `PATCH /api/orders/:id/status` — staff only, validated against `Order.transitionTo()`. */
export class UpdateOrderStatusRequestDto {
  @ApiProperty({ enum: OrderStatus })
  @IsEnum(OrderStatus)
  status!: OrderStatus;
}
