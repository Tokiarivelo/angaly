import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AiProviderId } from '@angaly/types';
import { withQueryClient } from '@/lib/test-utils';
import { apiClient } from '@/lib/api-client';
import { useSelectableAiProviders } from '../hooks/useSelectableAiProviders';

vi.mock('@/lib/api-client');

describe('useSelectableAiProviders', () => {
  beforeEach(() => vi.clearAllMocks());

  it('loads the providers a user may pick', async () => {
    const payload = {
      providers: [{ provider: AiProviderId.GEMINI, name: 'Google Gemini', model: 'gemini-2.5-flash' }],
      defaultProvider: AiProviderId.GEMINI,
    };
    vi.mocked(apiClient.get).mockResolvedValueOnce(payload);

    const { result } = renderHook(() => useSelectableAiProviders(), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.data).toEqual(payload));
    expect(apiClient.get).toHaveBeenCalledWith('/api/ai-inference/selectable-providers');
  });

  it('degrades to an empty list when the endpoint fails', async () => {
    vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('403'));

    const { result } = renderHook(() => useSelectableAiProviders(), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.data).toEqual({ providers: [], defaultProvider: null }));
  });
});
