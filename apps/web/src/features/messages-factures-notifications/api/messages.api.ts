'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ConversationDto, MessageDto } from '@angaly/types';

import { apiClient } from '@/lib/api-client';

import { QUERY_KEYS } from '../consts/queryKeys';

/** Real endpoint — `GET /api/messages/conversations` (see apps/api/src/messages, docs/features/messages.md). */
export function useConversationsQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.conversations,
    queryFn: () => apiClient.get<ConversationDto[]>('/messages/conversations'),
  });
}

/** Real endpoint — `GET /api/messages/conversations/:id/messages`. Disabled while no thread is selected. */
export function useConversationThreadQuery(conversationId: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.conversationThread(conversationId ?? ''),
    queryFn: () => apiClient.get<MessageDto[]>(`/messages/conversations/${encodeURIComponent(conversationId as string)}/messages`),
    enabled: Boolean(conversationId),
  });
}

/** Real endpoint — `POST /api/messages/conversations/:id/messages` — appends to an existing conversation the caller owns. */
export function useSendMessageMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ conversationId, content }: { conversationId: string; content: string }) =>
      apiClient.post<MessageDto>(`/messages/conversations/${encodeURIComponent(conversationId)}/messages`, { content }),
    onSuccess: (_message, variables) => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.conversations });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.conversationThread(variables.conversationId) });
    },
  });
}
