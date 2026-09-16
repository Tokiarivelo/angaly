import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsObject, IsOptional, IsString } from 'class-validator';
import { Locale } from '@angaly/types';

export class SaveSectionDraftDto {
  @ApiProperty({ enum: Locale, description: 'Which locale row this save targets — @@unique([page, sectionKey, locale]).' })
  @IsIn(Object.values(Locale))
  locale!: Locale;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  titleText?: string | null;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  subtitleText?: string | null;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  bodyText?: string | null;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  ctaPrimaryLabel?: string | null;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  ctaSecondaryLabel?: string | null;

  @ApiProperty({ required: false, nullable: true, type: Object })
  @IsOptional()
  @IsObject()
  dataJson?: Record<string, unknown> | null;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  mediaId?: string | null;
}
