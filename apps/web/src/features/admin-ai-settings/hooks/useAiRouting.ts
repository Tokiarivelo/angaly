'use client';

import { useQuery } from '@tanstack/react-query';
import { AI_SETTINGS_QUERY_KEYS } from '../consts/ai-providers.consts';
import { fetchAiRouting } from '../api/ai-providers.api';
import type { AiRoutingSetting } from '@angaly/types';

export const useAiRouting = () => {
  return useQuery<AiRoutingSetting>({
    queryKey: AI_SETTINGS_QUERY_KEYS.routing,
    queryFn: fetchAiRouting,
  });
};
