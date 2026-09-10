import { ApiProperty } from '@nestjs/swagger';
import { QuoteDto, QuoteLineItemDto, QuoteStatus } from '@angaly/types';

export class QuoteLineItemResponseDto implements QuoteLineItemDto {
  @ApiProperty()
  label!: string;

  @ApiProperty()
  quantity!: number;

  @ApiProperty({ description: 'Decimal string, e.g. "20.00"' })
  unitPrice!: string;
}

export class QuoteResponseDto implements QuoteDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  quoteNumber!: string;

  @ApiProperty()
  customerId!: string;

  @ApiProperty({ nullable: true, type: String })
  creationId!: string | null;

  @ApiProperty()
  description!: string;

  @ApiProperty({ type: [QuoteLineItemResponseDto] })
  lineItems!: QuoteLineItemResponseDto[];

  @ApiProperty({ description: 'Decimal string, e.g. "200.00"' })
  subtotal!: string;

  @ApiProperty({ description: 'Decimal string' })
  depositAmount!: string;

  @ApiProperty({ description: 'Decimal string' })
  balanceAmount!: string;

  @ApiProperty({ description: 'Decimal string' })
  total!: string;

  @ApiProperty({ enum: QuoteStatus })
  status!: QuoteStatus;

  @ApiProperty({ nullable: true, type: String })
  validUntil!: string | null;

  @ApiProperty({ nullable: true, type: Number })
  estimatedDelayDays!: number | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
