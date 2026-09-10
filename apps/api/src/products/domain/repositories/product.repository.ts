import type { ProductEntity } from '../entities/product.entity';
import type { ProductVariantEntity } from '../entities/product-variant.entity';
import type { ProductAvailability } from '../value-objects/product-availability.vo';

export const PRODUCT_REPOSITORY = Symbol('IProductRepository');

export interface ProductListFilter {
  categoryId?: string;
  size?: string;
  color?: string;
  material?: string;
  status?: ProductAvailability;
  priceMin?: string;
  priceMax?: string;
  sort?: 'newest' | 'priceAsc' | 'priceDesc';
  page: number;
  limit: number;
}

export interface ProductListResult {
  items: ProductEntity[];
  total: number;
}

export interface SimilarProductsFilter {
  categoryId: string;
  excludeProductId: string;
  limit: number;
}

export interface IProductRepository {
  findBySlug: (slug: string) => Promise<ProductEntity | null>;
  /** Used by `customers`.`list-favorites` to hydrate a PRODUCT favorite (`Favorite.entityId` is this id, never the slug). */
  findById: (id: string) => Promise<ProductEntity | null>;
  list: (filter: ProductListFilter) => Promise<ProductListResult>;
  /** Same category, current product excluded — docs/features/products.md "Cas d'usage clés". */
  listSimilar: (filter: SimilarProductsFilter) => Promise<ProductEntity[]>;
  /** Used by check-variant-availability.use-case.ts — the sole read path other modules (orders, Phase 3) should go through. */
  findVariantById: (variantId: string) => Promise<ProductVariantEntity | null>;
}
