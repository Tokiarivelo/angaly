import type { PageSectionVersionEntity } from '../entities/page-section-version.entity';
import type { PageSectionEntity } from '../entities/page-section.entity';
import type { ContentStatusValue, LocaleValue } from '../value-objects/content-status.vo';

export const PAGE_SECTION_REPOSITORY = Symbol('IPageSectionRepository');

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
  /** Defaults to DRAFT — publish-section is the only caller that passes PUBLISHED. */
  status: ContentStatusValue;
  updatedById: string | null;
}

/**
 * `saveWithSnapshot`/`restoreVersion` encapsulate the non-negotiable rule from
 * docs/phases/phase-6-admin-cms.md ("Points d'attention"): every overwrite of
 * a `PageSection` row snapshots its prior full state into
 * `PageSectionVersion` first, in the same Prisma `$transaction` — see
 * `PrismaPageSectionRepository`.
 */
export interface IPageSectionRepository {
  /** Flat list of every section row (all pages/sectionKeys/locales) — the Application layer groups it by page. */
  listAll: () => Promise<PageSectionEntity[]>;
  findAllLocales: (page: string, sectionKey: string) => Promise<PageSectionEntity[]>;
  findById: (id: string) => Promise<PageSectionEntity | null>;
  findByKey: (page: string, sectionKey: string, locale: LocaleValue) => Promise<PageSectionEntity | null>;
  saveWithSnapshot: (input: SaveSectionDraftInput) => Promise<PageSectionEntity>;
  listVersions: (pageSectionId: string) => Promise<PageSectionVersionEntity[]>;
  findVersionById: (pageSectionId: string, versionId: string) => Promise<PageSectionVersionEntity | null>;
  restoreVersion: (
    pageSectionId: string,
    versionId: string,
    restoredById: string | null,
  ) => Promise<PageSectionEntity>;
}
