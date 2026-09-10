'use client';

import type { ProductDto } from '@angaly/types';

import { useProductsQuery } from '../api/products.api';
import type { CatalogueFiltersValues } from '../schemas/catalogue-filters.schema';

export function useProducts(filters: CatalogueFiltersValues): {
  items: ProductDto[];
  total: number;
  totalPages: number;
  isLoading: boolean;
  isError: boolean;
} {
  const query = useProductsQuery(filters);

  return {
    items: query.data?.data ?? [],
    total: query.data?.meta.total ?? 0,
    totalPages: query.data?.meta.totalPages ?? 1,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
