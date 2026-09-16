import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { Locale } from '@angaly/types';

export class PublishSectionDto {
  @ApiProperty({ enum: Locale })
  @IsIn(Object.values(Locale))
  locale!: Locale;
}
