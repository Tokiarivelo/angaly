'use client';

import { useQuery } from '@tanstack/react-query';
import { AI_SETTINGS_QUERY_KEYS } from '../consts/ai-providers.consts';
import { fetchAiProviders, type AiProvidersListResponse } from '../api/ai-providers.api';

export const useAiProviders = () => {
  return useQuery<AiProvidersListResponse>({
    queryKey: AI_SETTINGS_QUERY_KEYS.providers,
    queryFn: fetchAiProviders,
    refetchInterval: 30000,
  });
};
