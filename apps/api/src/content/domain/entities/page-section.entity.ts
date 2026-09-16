import type { ContentStatusValue, LocaleValue } from '../value-objects/content-status.vo';
import { isContentStatus, isLocale } from '../value-objects/content-status.vo';

export interface PageSectionProps {
  id: string;
  page: string;
  sectionKey: string;
  locale: LocaleValue;
  titleText: string | null;
  subtitleText: string | null;
  bodyText: string | null;
  ctaPrimaryLabel: string | null;
  ctaSecondaryLabel: string | null;
  dataJson: unknown;
  mediaId: string | null;
  status: ContentStatusValue;
  updatedById: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Invariants: page/sectionKey non-empty, locale/status are known values (schema §`page_sections`). */
export class PageSectionEntity {
  private constructor(private readonly props: PageSectionProps) {}

  static create(props: PageSectionProps): PageSectionEntity {
    if (props.page.trim().length === 0) {
      throw new Error('PageSection.page must not be empty');
    }
    if (props.sectionKey.trim().length === 0) {
      throw new Error('PageSection.sectionKey must not be empty');
    }
    if (!isLocale(props.locale)) {
      throw new Error('PageSection.locale must be FR or MG');
    }
    if (!isContentStatus(props.status)) {
      throw new Error('PageSection.status must be DRAFT or PUBLISHED');
    }
    return new PageSectionEntity(props);
  }

  get id(): string {
    return this.props.id;
  }

  get page(): string {
    return this.props.page;
  }

  get sectionKey(): string {
    return this.props.sectionKey;
  }

  get locale(): LocaleValue {
    return this.props.locale;
  }

  get titleText(): string | null {
    return this.props.titleText;
  }

  get subtitleText(): string | null {
    return this.props.subtitleText;
  }

  get bodyText(): string | null {
    return this.props.bodyText;
  }

  get ctaPrimaryLabel(): string | null {
    return this.props.ctaPrimaryLabel;
  }

  get ctaSecondaryLabel(): string | null {
    return this.props.ctaSecondaryLabel;
  }

  get dataJson(): unknown {
    return this.props.dataJson;
  }

  get mediaId(): string | null {
    return this.props.mediaId;
  }

  get status(): ContentStatusValue {
    return this.props.status;
  }

  get updatedById(): string | null {
    return this.props.updatedById;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /** Full-row snapshot persisted verbatim into PageSectionVersion.snapshotJson before any overwrite. */
  toSnapshot(): Record<string, unknown> {
    return {
      page: this.props.page,
      sectionKey: this.props.sectionKey,
      locale: this.props.locale,
      titleText: this.props.titleText,
      subtitleText: this.props.subtitleText,
      bodyText: this.props.bodyText,
      ctaPrimaryLabel: this.props.ctaPrimaryLabel,
      ctaSecondaryLabel: this.props.ctaSecondaryLabel,
      dataJson: this.props.dataJson,
      mediaId: this.props.mediaId,
      status: this.props.status,
    };
  }
}
