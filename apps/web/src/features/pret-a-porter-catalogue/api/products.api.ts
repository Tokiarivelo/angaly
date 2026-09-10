'use client';

import { useQuery } from '@tanstack/react-query';
import type { CategoryDto, PaginatedResponse, ProductDto } from '@angaly/types';

import { apiClient } from '@/lib/api-client';

import { CATALOGUE_PAGE_SIZE, QUERY_KEYS } from '../consts/queryKeys';
import type { CatalogueFiltersValues } from '../schemas/catalogue-filters.schema';

function buildQueryString(filters: CatalogueFiltersValues): string {
  const params = new URLSearchParams({
    page: String(filters.page),
    limit: String(CATALOGUE_PAGE_SIZE),
    sort: filters.sort,
  });
  if (filters.categoryId) params.set('categoryId', filters.categoryId);
  if (filters.size) params.set('size', filters.size);
  if (filters.color) params.set('color', filters.color);
  if (filters.material) params.set('material', filters.material);
  if (filters.status) params.set('status', filters.status);
  if (filters.priceMin) params.set('priceMin', filters.priceMin);
  if (filters.priceMax) params.set('priceMax', filters.priceMax);
  return params.toString();
}

/** Real endpoint — see docs/features/products.md. */
export function useProductsQuery(filters: CatalogueFiltersValues) {
  return useQuery({
    queryKey: [...QUERY_KEYS.all, 'products', filters],
    queryFn: () => apiClient.get<PaginatedResponse<ProductDto>>(`/products?${buildQueryString(filters)}`),
  });
}

/** Real endpoint — see docs/features/categories.md. Powers the sidebar's Catégorie filter. */
export function useCategoriesQuery() {
  return useQuery({
    queryKey: [...QUERY_KEYS.all, 'categories'],
    queryFn: () => apiClient.get<CategoryDto[]>('/categories?kind=PRODUCT'),
  });
}
