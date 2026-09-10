import { useQuery } from '@tanstack/react-query';
import type { CollectionDto, CreationDto, PaginatedResponse } from '@angaly/types';

import { apiClient } from '@/lib/api-client';

const FEATURED_CREATIONS_LIMIT = 20;

/** Real endpoint — see docs/features/creations.md. Sorted by feature date, not just the isFeatured flag. */
export function useFeaturedCreationsQuery() {
  return useQuery({
    queryKey: ['la-une', 'featured-creations'],
    queryFn: () =>
      apiClient.get<PaginatedResponse<CreationDto>>(
        `/creations?isFeatured=true&sort=featuredFrom&limit=${FEATURED_CREATIONS_LIMIT}`,
      ),
  });
}

/**
 * Real endpoint — see docs/features/collections.md. `Collection` has no `isFeatured` field
 * (unlike `Creation`) — "collection du moment" is derived as the most recently published
 * one, same resolution as docs/pages/collections-liste.md's own banner.
 */
export function useFeaturedCollectionQuery() {
  return useQuery({
    queryKey: ['la-une', 'featured-collection'],
    queryFn: () =>
      apiClient.get<PaginatedResponse<CollectionDto>>('/collections?sort=publishedAt:desc&limit=1'),
  });
}
