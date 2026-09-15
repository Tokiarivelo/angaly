import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAvailableAiModels } from '../hooks/useAvailableAiModels';
import { withQueryClient } from '@/lib/test-utils';
import { apiClient } from '@/lib/api-client';

vi.mock('@/lib/api-client');

describe('useAvailableAiModels', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the available model list', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      measurementEstimation: ['GEMINI', 'LOCAL_STATISTICAL'],
    });

    const { result } = renderHook(() => useAvailableAiModels(), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.measurementEstimation).toEqual(['GEMINI', 'LOCAL_STATISTICAL']);
  });

  it('degrades to GEMINI-only instead of throwing when the request fails', async () => {
    vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('network error'));

    const { result } = renderHook(() => useAvailableAiModels(), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.measurementEstimation).toEqual(['GEMINI']);
  });
});
