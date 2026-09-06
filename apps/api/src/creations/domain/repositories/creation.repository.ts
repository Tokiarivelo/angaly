import type { CreationEntity } from '../entities/creation.entity';

export const CREATION_REPOSITORY = Symbol('ICreationRepository');

export interface CreationListFilter {
  categoryId?: string;
  collectionId?: string;
  isFeatured?: boolean;
  sort?: 'newest' | 'featured' | 'featuredFrom';
  page: number;
  limit: number;
}

export interface CreationListResult {
  items: CreationEntity[];
  total: number;
}

export interface ICreationRepository {
  findBySlug: (slug: string) => Promise<CreationEntity | null>;
  list: (filter: CreationListFilter) => Promise<CreationListResult>;
}
