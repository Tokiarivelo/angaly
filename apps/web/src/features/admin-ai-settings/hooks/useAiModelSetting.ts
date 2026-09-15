'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchAiModelSetting } from '../api/ai-model-settings.api';

export const AI_MODEL_SETTING_KEY = ['admin', 'ai-model-setting'];

export const useAiModelSetting = () => {
  return useQuery({
    queryKey: AI_MODEL_SETTING_KEY,
    queryFn: fetchAiModelSetting,
  });
};
