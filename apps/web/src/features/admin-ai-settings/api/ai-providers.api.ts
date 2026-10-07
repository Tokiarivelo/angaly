import { apiClient } from '@/lib/api-client';
import type {
  AiProviderCatalogEntry,
  AiProviderConfigView,
  AiProviderId,
  AiProviderModelsResponse,
  AiRoutingSetting,
  TestAiProviderResponse,
  UpdateAiRoutingDto,
  UpsertAiProviderDto,
} from '@angaly/types';

export interface AiProvidersListResponse {
  catalog: AiProviderCatalogEntry[];
  configured: AiProviderConfigView[];
}

export const fetchAiProviders = async (): Promise<AiProvidersListResponse> => {
  return apiClient.get<AiProvidersListResponse>('/api/admin/ai-settings/providers');
};

export const upsertAiProvider = async (
  provider: AiProviderId,
  dto: UpsertAiProviderDto,
): Promise<AiProviderConfigView> => {
  return apiClient.put<AiProviderConfigView>(`/api/admin/ai-settings/providers/${provider}`, dto);
};

export const removeAiProvider = async (
  provider: AiProviderId,
): Promise<{ success: boolean; message: string }> => {
  return apiClient.delete<{ success: boolean; message: string }>(
    `/api/admin/ai-settings/providers/${provider}`,
  );
};

export const testAiProvider = async (
  provider: AiProviderId,
): Promise<TestAiProviderResponse> => {
  return apiClient.post<TestAiProviderResponse>(`/api/admin/ai-settings/providers/${provider}/test`);
};

export const fetchAiRouting = async (): Promise<AiRoutingSetting> => {
  return apiClient.get<AiRoutingSetting>('/api/admin/ai-settings');
};

export const updateAiRouting = async (
  dto: UpdateAiRoutingDto,
): Promise<AiRoutingSetting> => {
  return apiClient.patch<AiRoutingSetting>('/api/admin/ai-settings', dto);
};

export const fetchAiProviderModels = async (
  provider: AiProviderId,
  search: string,
): Promise<AiProviderModelsResponse> => {
  const query = search.trim() ? `?q=${encodeURIComponent(search.trim())}` : '';
  return apiClient.get<AiProviderModelsResponse>(
    `/api/admin/ai-settings/providers/${provider}/models${query}`,
  );
};
