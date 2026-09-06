export const SEARCH_RESULT_TYPES = ['CREATION', 'PRODUCT', 'COLLECTION', 'BLOG_POST', 'ATELIER'] as const;

export type SearchResultType = (typeof SEARCH_RESULT_TYPES)[number];

export interface SearchResultProps {
  type: SearchResultType;
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  imageUrl: string | null;
}

/** Invariants: slug/title non-empty. Normalized shape shared by all 5 source entities. */
export class SearchResultEntity {
  private constructor(private readonly props: SearchResultProps) {}

  static create(props: SearchResultProps): SearchResultEntity {
    if (props.slug.trim().length === 0) {
      throw new Error('SearchResult.slug must not be empty');
    }
    if (props.title.trim().length === 0) {
      throw new Error('SearchResult.title must not be empty');
    }
    return new SearchResultEntity(props);
  }

  get type(): SearchResultType {
    return this.props.type;
  }

  get id(): string {
    return this.props.id;
  }

  get slug(): string {
    return this.props.slug;
  }

  get title(): string {
    return this.props.title;
  }

  get excerpt(): string {
    return this.props.excerpt;
  }

  get imageUrl(): string | null {
    return this.props.imageUrl;
  }
}
