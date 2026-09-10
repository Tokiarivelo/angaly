'use client';

import type { ProductDto } from '@angaly/types';

import { useSimilarProductsQuery } from '../api/products.api';

export function useSimilarProducts(categoryId: string | undefined, excludeProductId: string | undefined): {
  products: ProductDto[];
  isLoading: boolean;
} {
  const query = useSimilarProductsQuery(categoryId, excludeProductId);

  return { products: query.data ?? [], isLoading: query.isLoading };
}
