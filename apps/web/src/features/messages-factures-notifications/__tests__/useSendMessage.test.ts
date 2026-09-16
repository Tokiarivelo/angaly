import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { apiClient } from '@/lib/api-client';
import { withQueryClient } from '@/lib/test-utils';

import { useSendMessage } from '../hooks/useSendMessage';

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    post: vi.fn(),
  },
}));

describe('useSendMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('appends a message to the given conversation via POST /messages/conversations/:id/messages', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      id: 'msg-1',
      conversationId: 'conv-1',
      senderRole: 'CLIENT',
      senderUserId: 'user-1',
      content: 'Bonjour',
      isRead: true,
      createdAt: '2026-09-20T10:00:00.000Z',
    } as never);

    const { result } = renderHook(() => useSendMessage(), { wrapper: withQueryClient() });

    await act(async () => {
      await result.current.sendMessage('conv-1', 'Bonjour');
    });

    expect(apiClient.post).toHaveBeenCalledWith('/messages/conversations/conv-1/messages', { content: 'Bonjour' });
  });

  it('propagates a rejection (e.g. another customer’s conversation) to the caller', async () => {
    vi.mocked(apiClient.post).mockRejectedValueOnce(new Error('Forbidden'));

    const { result } = renderHook(() => useSendMessage(), { wrapper: withQueryClient() });

    await expect(result.current.sendMessage('conv-1', 'Bonjour')).rejects.toThrow('Forbidden');
  });
});
