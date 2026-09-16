import type { MediaEntity } from '../entities/media.entity';
import type { MediaEntityType } from '../value-objects/media-entity-ref.vo';

export const MEDIA_REPOSITORY = Symbol('IMediaRepository');

export const MEDIA_SORT_OPTIONS = ['recent', 'name', 'size'] as const;
export type MediaSortOption = (typeof MEDIA_SORT_OPTIONS)[number];

export interface MediaListFilter {
  bucket?: string;
  entityType?: MediaEntityType;
  entityId?: string;
  /** Matches against objectKey/altText — admin-mediatheque's search bar (docs/pages/admin-mediatheque.md). */
  search?: string;
  sortBy?: MediaSortOption;
  page: number;
  limit: number;
}

export interface MediaListResult {
  items: MediaEntity[];
  total: number;
}

export interface MediaUsageRef {
  entityType: string;
  entityId: string;
  /** Human-readable label for the "Utilisée dans" panel — the referencing entity's own name/title/slug. */
  label: string;
}

export interface MediaUpdateInput {
  altText?: string;
  /** Replacing the binary keeps the same `id` and every existing reference — never create a second Media row (docs/pages/admin-mediatheque.md). */
  bucket?: string;
  objectKey?: string;
  url?: string;
  mimeType?: string;
  sizeBytes?: number;
  width?: number | null;
  height?: number | null;
}

export interface IMediaRepository {
  create: (media: MediaEntity) => Promise<MediaEntity>;
  findById: (id: string) => Promise<MediaEntity | null>;
  list: (filter: MediaListFilter) => Promise<MediaListResult>;
  update: (id: string, patch: MediaUpdateInput) => Promise<MediaEntity>;
  delete: (id: string) => Promise<void>;
  /** Sum of every polymorphic relation (CreationMedia, ProductMedia, ..., PageSection.mediaId) still pointing at this id. */
  countActiveReferences: (id: string) => Promise<number>;
  /** Resolves every real reference (relation type + entity id + display label) for the "Utilisée dans" panel. */
  findUsages: (id: string) => Promise<MediaUsageRef[]>;
}
