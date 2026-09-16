import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { apiClient } from '@/lib/api-client';
import { withQueryClient } from '@/lib/test-utils';

import { useMarkNotificationsRead } from '../hooks/useMarkNotificationsRead';

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    patch: vi.fn(),
  },
}));

describe('useMarkNotificationsRead', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('markAllRead() calls PATCH /notifications/read-all', async () => {
    vi.mocked(apiClient.patch).mockResolvedValueOnce(undefined as never);

    const { result } = renderHook(() => useMarkNotificationsRead(), { wrapper: withQueryClient() });

    await act(async () => {
      await result.current.markAllRead();
    });

    expect(apiClient.patch).toHaveBeenCalledWith('/notifications/read-all');
  });

  it('markOneRead() calls PATCH /notifications/:id/read', async () => {
    vi.mocked(apiClient.patch).mockResolvedValueOnce({ id: 'n1', isRead: true } as never);

    const { result } = renderHook(() => useMarkNotificationsRead(), { wrapper: withQueryClient() });

    await act(async () => {
      await result.current.markOneRead('n1');
    });

    expect(apiClient.patch).toHaveBeenCalledWith('/notifications/n1/read');
  });
});
