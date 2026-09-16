import { ApiProperty } from '@nestjs/swagger';
import { Locale } from '@angaly/types';

/**
 * Public (unauthenticated) shape of a `PageSection` — deliberately narrower
 * than `PageSectionResponseDto`: no `status` (always PUBLISHED here, by
 * construction) and no `updatedById` (internal admin user id, no reason to
 * leak it to an unauthenticated caller).
 */
export class PublicPageSectionResponseDto {
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

  @ApiProperty()
  updatedAt!: string;
}
