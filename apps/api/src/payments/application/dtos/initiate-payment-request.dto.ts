import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod } from '@angaly/types';
import { IsEnum, IsString, MinLength } from 'class-validator';

/** Backs `POST /api/payments`. */
export class InitiatePaymentRequestDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  orderId!: string;

  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  method!: PaymentMethod;
}
