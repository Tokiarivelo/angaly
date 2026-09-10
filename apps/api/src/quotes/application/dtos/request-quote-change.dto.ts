import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

/** Backs `POST /api/quotes/:quoteNumber/request-change` — free-text message to staff, no status change. */
export class RequestQuoteChangeDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  message!: string;
}
