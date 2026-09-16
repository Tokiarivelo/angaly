import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { PageSectionEntity } from '../../domain/entities/page-section.entity';
import {
  IPageSectionRepository,
  PAGE_SECTION_REPOSITORY,
} from '../../domain/repositories/page-section.repository';
import { LocaleValue } from '../../domain/value-objects/content-status.vo';

export interface PublishSectionInput {
  page: string;
  sectionKey: string;
  locale: LocaleValue;
  actorId: string | null;
}

/** Explicit publish — flips status to PUBLISHED without changing the content fields (distinct action from save-draft). */
@Injectable()
export class PublishSectionUseCase {
  constructor(
    @Inject(PAGE_SECTION_REPOSITORY) private readonly pageSectionRepository: IPageSectionRepository,
  ) {}

  async execute(input: PublishSectionInput): Promise<PageSectionEntity> {
    const existing = await this.pageSectionRepository.findByKey(input.page, input.sectionKey, input.locale);
    if (!existing) {
      throw new NotFoundException(
        `No ${input.locale} content saved yet for ${input.page}/${input.sectionKey} — save a draft before publishing`,
      );
    }

    return this.pageSectionRepository.saveWithSnapshot({
      page: existing.page,
      sectionKey: existing.sectionKey,
      locale: existing.locale,
      titleText: existing.titleText,
      subtitleText: existing.subtitleText,
      bodyText: existing.bodyText,
      ctaPrimaryLabel: existing.ctaPrimaryLabel,
      ctaSecondaryLabel: existing.ctaSecondaryLabel,
      dataJson: existing.dataJson,
      mediaId: existing.mediaId,
      status: 'PUBLISHED',
      updatedById: input.actorId,
    });
  }
}
