import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NotificationType } from '@angaly/types';

import { apiClient } from '@/lib/api-client';
import { withQueryClient } from '@/lib/test-utils';

import { useNotifications } from '../hooks/useNotifications';

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe('useNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches and maps the current user notifications', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce([
      {
        id: 'n1',
        userId: 'user-1',
        type: NotificationType.ORDER_STATUS_CHANGED,
        title: 'Commande expédiée',
        body: 'Votre commande est en route.',
        isRead: false,
        relatedEntityType: null,
        relatedEntityId: null,
        createdAt: '2026-09-24T15:00:00.000Z',
      },
    ] as never);

    const { result } = renderHook(() => useNotifications(), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(apiClient.get).toHaveBeenCalledWith('/notifications');
    expect(result.current.notifications).toEqual([
      {
        id: 'n1',
        type: NotificationType.ORDER_STATUS_CHANGED,
        title: 'Commande expédiée',
        body: 'Votre commande est en route.',
        isRead: false,
        createdAt: '2026-09-24T15:00:00.000Z',
      },
    ]);
  });

  it('surfaces an error state', async () => {
    vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('network error'));

    const { result } = renderHook(() => useNotifications(), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.notifications).toEqual([]);
  });
});
