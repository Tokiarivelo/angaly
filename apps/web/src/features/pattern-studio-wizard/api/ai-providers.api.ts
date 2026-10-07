import { apiClient } from '@/lib/api-client';
import type { SelectableAiProvidersResponse } from '@angaly/types';

export const fetchSelectableAiProviders = async (): Promise<SelectableAiProvidersResponse> => {
  try {
    return await apiClient.get<SelectableAiProvidersResponse>('/api/ai-inference/selectable-providers');
  } catch {
    // Never blocking: without a list the wizard simply keeps the atelier's automatic routing.
    return { providers: [], defaultProvider: null };
  }
};
