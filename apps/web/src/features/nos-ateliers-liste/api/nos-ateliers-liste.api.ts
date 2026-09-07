import { useQuery } from '@tanstack/react-query';
import type { AtelierDto } from '@angaly/types';

import { apiClient } from '@/lib/api-client';

import { QUERY_KEYS } from '../consts/queryKeys';

/** Real endpoint — see docs/features/ateliers.md. No pagination (low expected volume). */
export function useAteliersListQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.ateliersList,
    queryFn: () => apiClient.get<AtelierDto[]>('/ateliers'),
  });
}
