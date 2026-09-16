import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useDeleteMedia } from '../hooks/useDeleteMedia';
import { withQueryClient } from '@/lib/test-utils';
import { apiClient } from '@/lib/api-client';

vi.mock('@/lib/api-client');

describe('useDeleteMedia', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends a DELETE request for the given id', async () => {
    vi.mocked(apiClient.delete).mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useDeleteMedia(), { wrapper: withQueryClient() });

    act(() => {
      result.current.mutate('media-1');
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(apiClient.delete).toHaveBeenCalledWith('/api/media/media-1');
  });

  it('surfaces an error when the media is still referenced (409)', async () => {
    vi.mocked(apiClient.delete).mockRejectedValueOnce(
      Object.assign(new Error('Media is still referenced and cannot be deleted'), { statusCode: 409 }),
    );

    const { result } = renderHook(() => useDeleteMedia(), { wrapper: withQueryClient() });

    act(() => {
      result.current.mutate('media-1');
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toContain('still referenced');
  });
});
