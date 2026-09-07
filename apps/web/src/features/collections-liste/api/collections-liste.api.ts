import { useQuery } from '@tanstack/react-query';
import type { CollectionDto, PaginatedResponse } from '@angaly/types';

import { apiClient } from '@/lib/api-client';

const LIST_LIMIT = 40;

/** Real endpoint — see docs/features/collections.md. Only ever returns published collections. */
export function useCollectionsListQuery() {
  return useQuery({
    queryKey: ['collections-liste', 'list'],
    queryFn: () =>
      apiClient.get<PaginatedResponse<CollectionDto>>(`/collections?sort=seasonYear:desc&limit=${LIST_LIMIT}`),
  });
}

/**
 * `Collection` has no `isFeatured` field (unlike `Creation`) — "Collection du moment" is
 * derived as the most recently published one, same resolution as docs/pages/la-une.md's
 * own hero derivation.
 */
export function useFeaturedCollectionQuery() {
  return useQuery({
    queryKey: ['collections-liste', 'featured'],
    queryFn: () => apiClient.get<PaginatedResponse<CollectionDto>>('/collections?sort=publishedAt:desc&limit=1'),
  });
}
