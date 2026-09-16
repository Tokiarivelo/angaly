import { ApiProperty } from '@nestjs/swagger';
import { ContentStatus, Locale } from '@angaly/types';

export class PageSectionResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  page!: string;

  @ApiProperty()
  sectionKey!: string;

  @ApiProperty({ enum: Locale })
  locale!: Locale;

  @ApiProperty({ nullable: true })
  titleText!: string | null;

  @ApiProperty({ nullable: true })
  subtitleText!: string | null;

  @ApiProperty({ nullable: true })
  bodyText!: string | null;

  @ApiProperty({ nullable: true })
  ctaPrimaryLabel!: string | null;

  @ApiProperty({ nullable: true })
  ctaSecondaryLabel!: string | null;

  @ApiProperty({ nullable: true, type: Object })
  dataJson!: unknown;

  @ApiProperty({ nullable: true })
  mediaId!: string | null;

  @ApiProperty({ enum: ContentStatus })
  status!: ContentStatus;

  @ApiProperty({ nullable: true })
  updatedById!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
