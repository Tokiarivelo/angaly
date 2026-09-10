'use client';

import type { ProductDto } from '@angaly/types';

import { useProductQuery } from '../api/products.api';

export function useProduct(slug: string): { product: ProductDto | undefined; isLoading: boolean; isError: boolean } {
  const query = useProductQuery(slug);

  return {
    product: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
