export interface CollectionMediaSummary {
  id: string;
  url: string;
  altText: string;
  sortOrder: number;
}

export interface CollectionCreationSummary {
  id: string;
  slug: string;
  name: string;
  coverImageUrl: string | null;
}

export interface CollectionProps {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  story: string | null;
  seasonYear: number | null;
  publishedAt: Date | null;
  media: CollectionMediaSummary[];
  creationsCount: number;
  /** null when not fetched (list rows expose creationsCount instead — see docs/features/collections.md). */
  creations: CollectionCreationSummary[] | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Invariants: slug non-empty; "published" is derived from publishedAt, never a stored flag. */
export class CollectionEntity {
  private constructor(private readonly props: CollectionProps) {}

  static create(props: CollectionProps): CollectionEntity {
    if (props.slug.trim().length === 0) {
      throw new Error('Collection.slug must not be empty');
    }
    return new CollectionEntity(props);
  }

  get id(): string {
    return this.props.id;
  }

  get slug(): string {
    return this.props.slug;
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string | null {
    return this.props.description;
  }

  get story(): string | null {
    return this.props.story;
  }

  get seasonYear(): number | null {
    return this.props.seasonYear;
  }

  get publishedAt(): Date | null {
    return this.props.publishedAt;
  }

  get isPublished(): boolean {
    return this.props.publishedAt !== null && this.props.publishedAt.getTime() <= Date.now();
  }

  get media(): CollectionMediaSummary[] {
    return this.props.media;
  }

  get creationsCount(): number {
    return this.props.creationsCount;
  }

  get creations(): CollectionCreationSummary[] | null {
    return this.props.creations;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
