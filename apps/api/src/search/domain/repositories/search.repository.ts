import type { SearchResultEntity } from '../entities/search-result.entity';

export const SEARCH_REPOSITORY = Symbol('ISearchRepository');

export interface GroupedSearchResults {
  creations: SearchResultEntity[];
  products: SearchResultEntity[];
  collections: SearchResultEntity[];
  blogPosts: SearchResultEntity[];
  ateliers: SearchResultEntity[];
}

export interface ISearchRepository {
  /** Queries all 5 entities in parallel, ranked by relevance, capped at `limitPerType` each. */
  search: (query: string, limitPerType: number) => Promise<GroupedSearchResults>;
}
