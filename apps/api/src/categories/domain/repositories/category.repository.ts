import type { CategoryEntity } from '../entities/category.entity';
import type { CategoryKind } from '../value-objects/category-kind.vo';

export const CATEGORY_REPOSITORY = Symbol('ICategoryRepository');

export interface ICategoryRepository {
  /** No pagination — a fixed, low-volume taxonomy list. Sorted by name, optionally filtered by kind. */
  list: (kind?: CategoryKind) => Promise<CategoryEntity[]>;
}
