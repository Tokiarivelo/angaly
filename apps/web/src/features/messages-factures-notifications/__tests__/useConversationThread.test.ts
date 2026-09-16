import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MessageSenderRole } from '@angaly/types';

import { apiClient } from '@/lib/api-client';
import { withQueryClient } from '@/lib/test-utils';

import { useConversationThread } from '../hooks/useConversationThread';

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe('useConversationThread', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches and maps messages for the selected thread', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce([
      {
        id: 'msg-1',
        conversationId: 'conv-1',
        senderRole: MessageSenderRole.CLIENT,
        senderUserId: 'user-1',
        content: 'Où en est ma commande ?',
        isRead: true,
        createdAt: '2026-09-20T10:00:00.000Z',
      },
      {
        id: 'msg-2',
        conversationId: 'conv-1',
        senderRole: MessageSenderRole.STAFF,
        senderUserId: 'staff-1',
        content: 'Elle avance bien !',
        isRead: false,
        createdAt: '2026-09-20T10:05:00.000Z',
      },
    ] as never);

    const { result } = renderHook(() => useConversationThread('conv-1'), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(apiClient.get).toHaveBeenCalledWith('/messages/conversations/conv-1/messages');
    expect(result.current.messages).toEqual([
      { id: 'msg-1', sender: 'client', content: 'Où en est ma commande ?', timestamp: '2026-09-20T10:00:00.000Z' },
      { id: 'msg-2', sender: 'atelier', content: 'Elle avance bien !', timestamp: '2026-09-20T10:05:00.000Z' },
    ]);
  });

  it('does not fetch when no thread is selected', () => {
    renderHook(() => useConversationThread(null), { wrapper: withQueryClient() });

    expect(apiClient.get).not.toHaveBeenCalled();
  });
});
