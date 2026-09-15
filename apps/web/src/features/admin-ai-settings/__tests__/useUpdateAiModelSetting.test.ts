import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useUpdateAiModelSetting } from '../hooks/useUpdateAiModelSetting';
import { withQueryClient } from '@/lib/test-utils';
import { apiClient } from '@/lib/api-client';

vi.mock('@/lib/api-client');

describe('useUpdateAiModelSetting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends a PATCH request with the selected model', async () => {
    vi.mocked(apiClient.patch).mockResolvedValueOnce({
      measurementModel: 'LOCAL_STATISTICAL',
      updatedAt: '2026-01-02T00:00:00.000Z',
      updatedById: 'admin-1',
    });

    const { result } = renderHook(() => useUpdateAiModelSetting(), { wrapper: withQueryClient() });

    act(() => {
      result.current.mutate('LOCAL_STATISTICAL');
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(apiClient.patch).toHaveBeenCalledWith('/api/admin/ai-settings', {
      measurementModel: 'LOCAL_STATISTICAL',
    });
  });
});
