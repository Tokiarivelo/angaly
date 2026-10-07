'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AI_SETTINGS_QUERY_KEYS } from '../consts/ai-providers.consts';
import { updateAiRouting } from '../api/ai-providers.api';
import type { UpdateAiRoutingDto } from '@angaly/types';

export const useUpdateAiRouting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: UpdateAiRoutingDto) => updateAiRouting(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AI_SETTINGS_QUERY_KEYS.routing });
      queryClient.invalidateQueries({ queryKey: AI_SETTINGS_QUERY_KEYS.providers });
    },
  });
};
