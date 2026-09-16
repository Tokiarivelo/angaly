import { ApiProperty } from '@nestjs/swagger';
import { ContentStatus, Locale } from '@angaly/types';

/**
 * One editable section, summarized across its locale rows for the left-panel
 * list of `admin-gestion-contenu` — `status` reflects the FR row (falls back
 * to the first available locale if FR does not exist yet), a simplification
 * documented in docs/features/content.md given `PageSection.status` is a
 * per-locale field in the schema, not a per-section one.
 */
export class SectionSummaryResponseDto {
  @ApiProperty()
  sectionKey!: string;

  @ApiProperty({ enum: ContentStatus })
  status!: ContentStatus;

  @ApiProperty()
  updatedAt!: string;

  @ApiProperty({ enum: Locale, isArray: true })
  locales!: Locale[];
}

export class PageSectionGroupResponseDto {
  @ApiProperty()
  page!: string;

  @ApiProperty({ type: [SectionSummaryResponseDto] })
  sections!: SectionSummaryResponseDto[];
}
