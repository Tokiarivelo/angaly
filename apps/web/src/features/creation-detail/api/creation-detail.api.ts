import { useQuery } from '@tanstack/react-query';
import type { CreationDto, PaginatedResponse } from '@angaly/types';

import { apiClient } from '@/lib/api-client';

const RELATED_LIMIT = 4;

/** Real endpoint — see docs/features/creations.md. Same CreationDto shape as the list. */
export function useCreationDetailQuery(slug: string) {
  return useQuery({
    queryKey: ['creation-detail', slug],
    queryFn: () => apiClient.get<CreationDto>(`/creations/${slug}`),
  });
}

/** Same collection, current creation excluded client-side (no `excludeId` query param). */
export function useCollectionCreationsQuery(collectionId: string | null) {
  return useQuery({
    queryKey: ['creation-detail', 'collection-creations', collectionId],
    queryFn: () =>
      apiClient.get<PaginatedResponse<CreationDto>>(`/creations?collectionId=${collectionId}&limit=${RELATED_LIMIT + 1}`),
    enabled: collectionId !== null,
  });
}

/** Same category, current creation excluded client-side. */
export function useCategoryCreationsQuery(categoryId: string | null) {
  return useQuery({
    queryKey: ['creation-detail', 'category-creations', categoryId],
    queryFn: () =>
      apiClient.get<PaginatedResponse<CreationDto>>(`/creations?categoryId=${categoryId}&limit=${RELATED_LIMIT + 1}`),
    enabled: categoryId !== null,
  });
}
