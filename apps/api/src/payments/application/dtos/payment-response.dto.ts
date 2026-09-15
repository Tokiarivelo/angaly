import { ApiProperty } from '@nestjs/swagger';
import { PaymentDto, PaymentMethod, PaymentStatus } from '@angaly/types';

export class PaymentResponseDto implements PaymentDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  orderId!: string;

  @ApiProperty({ enum: PaymentMethod })
  method!: PaymentMethod;

  @ApiProperty({ enum: PaymentStatus })
  status!: PaymentStatus;

  @ApiProperty({ description: 'Decimal string' })
  amount!: string;

  @ApiProperty({ nullable: true, type: String })
  transactionRef!: string | null;

  @ApiProperty({ nullable: true, type: String })
  paidAt!: string | null;

  @ApiProperty()
  createdAt!: string;
}
