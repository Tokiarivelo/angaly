import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsISO8601, IsInt, IsOptional, IsPositive, Matches, MinLength, ValidateNested } from 'class-validator';

/** Same pattern as `products/application/dtos/list-products-query.dto.ts` DECIMAL_STRING_PATTERN. */
const DECIMAL_STRING_PATTERN = /^\d+(\.\d{1,2})?$/;

export class QuoteLineItemInputDto {
  @ApiProperty()
  @MinLength(1)
  label!: string;

  @ApiProperty()
  @IsPositive()
  quantity!: number;

  @ApiProperty({ description: 'Decimal string, e.g. "20.00"' })
  @Matches(DECIMAL_STRING_PATTERN)
  unitPrice!: string;
}

/** Backs `POST /api/quotes/:quoteNumber/send` — staff pricing, `DRAFT` -> `SENT`. */
export class SendQuoteDto {
  @ApiProperty({ type: [QuoteLineItemInputDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => QuoteLineItemInputDto)
  lineItems!: QuoteLineItemInputDto[];

  @ApiProperty({ description: 'Acompte demandé (decimal string)' })
  @Matches(DECIMAL_STRING_PATTERN)
  depositAmount!: string;

  @ApiProperty({ description: 'Montant total, decimal string (peut différer du subtotal des lignes, ex. frais)' })
  @Matches(DECIMAL_STRING_PATTERN)
  total!: string;

  @ApiProperty({ required: false, description: 'Date de validité du devis (ISO 8601)' })
  @IsOptional()
  @IsISO8601()
  validUntil?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @IsPositive()
  estimatedDelayDays?: number;
}
