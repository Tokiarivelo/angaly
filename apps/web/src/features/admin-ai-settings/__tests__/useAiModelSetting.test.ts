import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAiModelSetting } from '../hooks/useAiModelSetting';
import { withQueryClient } from '@/lib/test-utils';
import { apiClient } from '@/lib/api-client';

vi.mock('@/lib/api-client');

describe('useAiModelSetting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches the current AI model setting', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      measurementModel: 'GEMINI',
      updatedAt: '2026-01-01T00:00:00.000Z',
      updatedById: null,
    });

    const { result } = renderHook(() => useAiModelSetting(), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(apiClient.get).toHaveBeenCalledWith('/api/admin/ai-settings');
    expect(result.current.data?.measurementModel).toBe('GEMINI');
  });
});
