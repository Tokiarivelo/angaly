import type { CollectionEntity } from '../entities/collection.entity';

export const COLLECTION_REPOSITORY = Symbol('ICollectionRepository');

export type CollectionSort = 'seasonYear:asc' | 'seasonYear:desc' | 'publishedAt:asc' | 'publishedAt:desc';

export interface CollectionListFilter {
  seasonYear?: number;
  sort?: CollectionSort;
  page: number;
  limit: number;
}

export interface CollectionListResult {
  items: CollectionEntity[];
  total: number;
}

export interface ICollectionRepository {
  /** Excludes unpublished collections — never surfaced on public endpoints (Phase 1 has no admin preview). */
  findPublishedBySlug: (slug: string) => Promise<CollectionEntity | null>;
  /**
   * Used by `customers`.`list-favorites` to hydrate a COLLECTION favorite
   * (`Favorite.entityId` is this id, never the slug) — unlike
   * findPublishedBySlug, not filtered by publication status: a collection
   * favorited while published should still resolve if later unpublished,
   * per docs/features/customers.md "Points d'attention" (only existence is
   * checked, not publication state).
   */
  findById: (id: string) => Promise<CollectionEntity | null>;
  list: (filter: CollectionListFilter) => Promise<CollectionListResult>;
}
