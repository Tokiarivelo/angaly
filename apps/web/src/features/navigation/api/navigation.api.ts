import { useQuery } from '@tanstack/react-query';
import type { SearchResultsResponseDto } from '@angaly/types';

import { apiClient } from '@/lib/api-client';

import { MIN_SEARCH_QUERY_LENGTH } from '../consts/search.const';
import { QUERY_KEYS } from '../consts/queryKeys';

const LIMIT_PER_TYPE = 5;

/** Real endpoint — see docs/features/search.md. Disabled below the backend's own minimum query length. */
export function useGlobalSearchQuery(query: string) {
  return useQuery({
    queryKey: QUERY_KEYS.globalSearch(query),
    queryFn: () =>
      apiClient.get<SearchResultsResponseDto>(
        `/search?q=${encodeURIComponent(query)}&limitPerType=${LIMIT_PER_TYPE}`,
      ),
    enabled: query.trim().length >= MIN_SEARCH_QUERY_LENGTH,
  });
}
