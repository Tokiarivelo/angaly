import { Inject, Injectable } from '@nestjs/common';

import { PageSectionEntity } from '../../domain/entities/page-section.entity';
import {
  IPageSectionRepository,
  PAGE_SECTION_REPOSITORY,
} from '../../domain/repositories/page-section.repository';
import { LocaleValue } from '../../domain/value-objects/content-status.vo';

export interface SaveSectionDraftInput {
  page: string;
  sectionKey: string;
  locale: LocaleValue;
  titleText?: string | null;
  subtitleText?: string | null;
  bodyText?: string | null;
  ctaPrimaryLabel?: string | null;
  ctaSecondaryLabel?: string | null;
  dataJson?: unknown;
  mediaId?: string | null;
  actorId: string | null;
}

/**
 * Saves a section as a DRAFT — never publishes implicitly (docs/pages/admin-gestion-contenu.md
 * "Points d'attention"). The repository snapshots the row's prior state into
 * `PageSectionVersion` before overwriting it, in the same transaction.
 */
@Injectable()
export class SaveSectionDraftUseCase {
  constructor(
    @Inject(PAGE_SECTION_REPOSITORY) private readonly pageSectionRepository: IPageSectionRepository,
  ) {}

  execute(input: SaveSectionDraftInput): Promise<PageSectionEntity> {
    return this.pageSectionRepository.saveWithSnapshot({
      page: input.page,
      sectionKey: input.sectionKey,
      locale: input.locale,
      titleText: input.titleText,
      subtitleText: input.subtitleText,
      bodyText: input.bodyText,
      ctaPrimaryLabel: input.ctaPrimaryLabel,
      ctaSecondaryLabel: input.ctaSecondaryLabel,
      dataJson: input.dataJson,
      mediaId: input.mediaId,
      status: 'DRAFT',
      updatedById: input.actorId,
    });
  }
}
