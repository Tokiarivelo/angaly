'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateAiModelSetting } from '../api/ai-model-settings.api';
import { AI_MODEL_SETTING_KEY } from './useAiModelSetting';
import type { MeasurementModelPreference } from '@angaly/types';

export const useUpdateAiModelSetting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (measurementModel: MeasurementModelPreference) => updateAiModelSetting(measurementModel),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: AI_MODEL_SETTING_KEY });
    },
  });
};
