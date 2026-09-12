import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { CreationDto } from '@angaly/types';

export function useCreationReference(slug: string) {
  return useQuery({
    queryKey: ['creation-detail', slug],
    queryFn: () => apiClient.get<CreationDto>(`/creations/${slug}`),
    enabled: Boolean(slug),
  });
}
