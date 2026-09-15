import { apiClient } from '@/lib/api-client';
import type { AvailableModelsResponse, MeasurementModelPreference } from '@angaly/types';

export interface AiModelSettingDto {
  measurementModel: MeasurementModelPreference;
  updatedAt: string;
  updatedById: string | null;
}

export const fetchAiModelSetting = async (): Promise<AiModelSettingDto> => {
  return apiClient.get<AiModelSettingDto>('/api/admin/ai-settings');
};

export const updateAiModelSetting = async (
  measurementModel: MeasurementModelPreference,
): Promise<AiModelSettingDto> => {
  return apiClient.patch<AiModelSettingDto>('/api/admin/ai-settings', { measurementModel });
};

export const fetchAvailableAiModels = async (): Promise<AvailableModelsResponse> => {
  try {
    return await apiClient.get<AvailableModelsResponse>('/api/ai-inference/available-models');
  } catch {
    // Degrade gracefully: assume only the always-available Gemini backend.
    return { measurementEstimation: ['GEMINI'] };
  }
};
