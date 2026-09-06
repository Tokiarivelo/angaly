import { ApiProperty } from '@nestjs/swagger';
import { Locale } from '@angaly/types';

export class SupportedLocalesResponseDto {
  @ApiProperty({ enum: Locale, isArray: true, example: [Locale.FR, Locale.MG] })
  locales!: Locale[];

  @ApiProperty({ enum: Locale, description: 'Locale resolved for this request.' })
  current!: Locale;
}
