import { useQuery } from '@tanstack/react-query';
import type { CollectionDetailDto } from '@angaly/types';

import { apiClient } from '@/lib/api-client';

/** Real endpoint — see docs/features/collections.md. Already includes `creations[]`, no separate call needed. */
export function useCollectionDetailQuery(slug: string) {
  return useQuery({
    queryKey: ['collection-detail', slug],
    queryFn: () => apiClient.get<CollectionDetailDto>(`/collections/${slug}`),
  });
}
