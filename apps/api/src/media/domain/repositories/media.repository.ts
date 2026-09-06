import type { MediaEntity } from '../entities/media.entity';
import type { MediaEntityType } from '../value-objects/media-entity-ref.vo';

export const MEDIA_REPOSITORY = Symbol('IMediaRepository');

export interface MediaListFilter {
  bucket?: string;
  entityType?: MediaEntityType;
  entityId?: string;
  page: number;
  limit: number;
}

export interface MediaListResult {
  items: MediaEntity[];
  total: number;
}

export interface IMediaRepository {
  create: (media: MediaEntity) => Promise<MediaEntity>;
  findById: (id: string) => Promise<MediaEntity | null>;
  list: (filter: MediaListFilter) => Promise<MediaListResult>;
  delete: (id: string) => Promise<void>;
  /** Sum of every polymorphic relation (CreationMedia, ProductMedia, ..., PageSection.mediaId) still pointing at this id. */
  countActiveReferences: (id: string) => Promise<number>;
}
