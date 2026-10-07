'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AI_SETTINGS_QUERY_KEYS } from '../consts/ai-providers.consts';
import { upsertAiProvider } from '../api/ai-providers.api';
import type { AiProviderId, UpsertAiProviderDto } from '@angaly/types';

export const useUpsertAiProvider = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ provider, dto }: { provider: AiProviderId; dto: UpsertAiProviderDto }) =>
      upsertAiProvider(provider, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AI_SETTINGS_QUERY_KEYS.providers });
      queryClient.invalidateQueries({ queryKey: AI_SETTINGS_QUERY_KEYS.routing });
    },
  });
};
