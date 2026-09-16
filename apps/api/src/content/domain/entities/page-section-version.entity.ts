export interface PageSectionVersionProps {
  id: string;
  pageSectionId: string;
  snapshotJson: Record<string, unknown>;
  editedById: string | null;
  createdAt: Date;
}

/** Immutable historical snapshot of a PageSection row (docs/features/content.md — never edited after creation). */
export class PageSectionVersionEntity {
  private constructor(private readonly props: PageSectionVersionProps) {}

  static create(props: PageSectionVersionProps): PageSectionVersionEntity {
    if (props.pageSectionId.trim().length === 0) {
      throw new Error('PageSectionVersion.pageSectionId must not be empty');
    }
    return new PageSectionVersionEntity(props);
  }

  get id(): string {
    return this.props.id;
  }

  get pageSectionId(): string {
    return this.props.pageSectionId;
  }

  get snapshotJson(): Record<string, unknown> {
    return this.props.snapshotJson;
  }

  get editedById(): string | null {
    return this.props.editedById;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }
}
