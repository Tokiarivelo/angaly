import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { Locale } from '@angaly/types';

export class ListPublishedSectionsQueryDto {
  @ApiPropertyOptional({ enum: Locale, description: 'Filter to a single locale. Omit to get every published locale.' })
  @IsOptional()
  @IsIn(Object.values(Locale))
  locale?: Locale;
}
