'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AI_SETTINGS_QUERY_KEYS } from '../consts/ai-providers.consts';
import { testAiProvider } from '../api/ai-providers.api';
import type { AiProviderId, TestAiProviderResponse } from '@angaly/types';

export const useTestAiProvider = () => {
  const queryClient = useQueryClient();

  return useMutation<TestAiProviderResponse, Error, AiProviderId>({
    mutationFn: (provider: AiProviderId) => testAiProvider(provider),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AI_SETTINGS_QUERY_KEYS.providers });
    },
  });
};
