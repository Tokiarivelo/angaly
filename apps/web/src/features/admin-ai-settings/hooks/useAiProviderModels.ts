'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { AiProviderId, AiProviderModelsResponse } from '@angaly/types';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { AI_SETTINGS_QUERY_KEYS } from '../consts/ai-providers.consts';
import { fetchAiProviderModels } from '../api/ai-providers.api';

export const MODEL_SEARCH_DEBOUNCE_MS = 300;

/** Lists the provider's non-obsolete models, filtered server-side by a debounced search term. */
export const useAiProviderModels = (
  provider: AiProviderId | null,
  search: string,
  enabled: boolean,
) => {
  const debouncedSearch = useDebouncedValue(search, MODEL_SEARCH_DEBOUNCE_MS);

  const query = useQuery<AiProviderModelsResponse>({
    queryKey: [...AI_SETTINGS_QUERY_KEYS.providers, 'models', provider, debouncedSearch],
    queryFn: () => fetchAiProviderModels(provider as AiProviderId, debouncedSearch),
    enabled: enabled && provider !== null,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });

  return { ...query, isSearching: search !== debouncedSearch || query.isFetching };
};
