'use client';

import { useQuery } from '@tanstack/react-query';
import type { ProductDto } from '@angaly/types';

import { apiClient } from '@/lib/api-client';

import { QUERY_KEYS, SIMILAR_PRODUCTS_LIMIT } from '../consts/queryKeys';

/** Real endpoint — see docs/features/products.md. */
export function useProductQuery(slug: string) {
  return useQuery({
    queryKey: [...QUERY_KEYS.all, 'product', slug],
    queryFn: () => apiClient.get<ProductDto>(`/products/${slug}`),
  });
}

/** Same endpoint, "similar products" mode (`exclude` + `category` params) — see docs/features/products.md. */
export function useSimilarProductsQuery(categoryId: string | undefined, excludeProductId: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEYS.all, 'similar', categoryId, excludeProductId],
    queryFn: () =>
      apiClient.get<ProductDto[]>(
        `/products?categoryId=${categoryId}&exclude=${excludeProductId}&limit=${SIMILAR_PRODUCTS_LIMIT}`,
      ),
    enabled: Boolean(categoryId) && Boolean(excludeProductId),
  });
}
