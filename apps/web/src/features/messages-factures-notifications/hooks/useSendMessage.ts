'use client';

import { useSendMessageMutation } from '../api/messages.api';

/** Real endpoint — `POST /api/messages/conversations/:id/messages` (see docs/features/messages.md). */
export const useSendMessage = () => {
  const mutation = useSendMessageMutation();

  const sendMessage = async (threadId: string, content: string): Promise<void> => {
    await mutation.mutateAsync({ conversationId: threadId, content });
  };

  return { sendMessage, isSending: mutation.isPending };
};
