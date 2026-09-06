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
  list: (filter: CollectionListFilter) => Promise<CollectionListResult>;
}
