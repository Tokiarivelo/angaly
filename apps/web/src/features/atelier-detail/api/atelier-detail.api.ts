import { useQuery } from '@tanstack/react-query';
import type { AtelierDto } from '@angaly/types';

import { apiClient } from '@/lib/api-client';

/** Real endpoint — see docs/features/ateliers.md. */
export function useAtelierDetailQuery(slug: string) {
  return useQuery({
    queryKey: ['atelier-detail', slug],
    queryFn: () => apiClient.get<AtelierDto>(`/ateliers/${slug}`),
  });
}
