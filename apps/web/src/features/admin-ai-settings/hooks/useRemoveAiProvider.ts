'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AI_SETTINGS_QUERY_KEYS } from '../consts/ai-providers.consts';
import { removeAiProvider } from '../api/ai-providers.api';
import type { AiProviderId } from '@angaly/types';

export const useRemoveAiProvider = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (provider: AiProviderId) => removeAiProvider(provider),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AI_SETTINGS_QUERY_KEYS.providers });
      queryClient.invalidateQueries({ queryKey: AI_SETTINGS_QUERY_KEYS.routing });
    },
  });
};
