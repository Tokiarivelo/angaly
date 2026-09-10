import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsObject, IsOptional, IsString } from 'class-validator';

/** Backs `PATCH /api/quotes/design-briefs/:id` — incremental save, `DRAFT` only. */
export class UpdateQuoteDraftDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  options?: Record<string, string>;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  inspirationMediaIds?: string[];
}
