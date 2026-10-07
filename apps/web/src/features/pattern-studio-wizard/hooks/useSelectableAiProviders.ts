'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchSelectableAiProviders } from '../api/ai-providers.api';

export const SELECTABLE_AI_PROVIDERS_KEY = ['pattern-studio', 'selectable-ai-providers'] as const;

export const useSelectableAiProviders = () =>
  useQuery({
    queryKey: SELECTABLE_AI_PROVIDERS_KEY,
    queryFn: fetchSelectableAiProviders,
    staleTime: 1000 * 60 * 5,
  });
