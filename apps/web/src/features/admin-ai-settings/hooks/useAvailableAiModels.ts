'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchAvailableAiModels } from '../api/ai-model-settings.api';

export const useAvailableAiModels = () => {
  return useQuery({
    queryKey: ['admin', 'ai-available-models'],
    queryFn: fetchAvailableAiModels,
    staleTime: 1000 * 60,
  });
};
