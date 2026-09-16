'use client';

import { MessageSenderRole } from '@angaly/types';

import { useConversationThreadQuery } from '../api/messages.api';

export interface Message {
  id: string;
  sender: 'client' | 'atelier';
  content: string;
  timestamp: string;
}

/**
 * Real endpoint — `GET /api/messages/conversations/:id/messages` (see
 * docs/features/messages.md). Fetching this also marks unread STAFF-authored
 * messages as read server-side (the read receipt on opening a thread).
 */
export const useConversationThread = (threadId: string | null) => {
  const query = useConversationThreadQuery(threadId);

  const messages: Message[] = (query.data ?? []).map((message) => ({
    id: message.id,
    sender: message.senderRole === MessageSenderRole.STAFF ? 'atelier' : 'client',
    content: message.content,
    timestamp: message.createdAt,
  }));

  return { messages, isLoading: query.isLoading, isError: query.isError };
};
