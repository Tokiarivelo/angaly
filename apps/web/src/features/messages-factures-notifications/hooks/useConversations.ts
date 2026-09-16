/**
 * Messaging has no backend: no `Message`/`Conversation` Prisma model and no
 * `messages` NestJS module exist (see docs/pages/messages-factures-notifications.md
 * "Points d'attention" — a known, documented gap, not something to fix here).
 * Always returns an empty conversation list rather than fake/demo threads
 * presented as real.
 */
export interface ConversationThread {
  id: string;
  atelierName: string;
  orderReference?: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
}

export const useConversations = () => {
  return {
    threads: [] as ConversationThread[],
    activeThreadId: null as string | null,
    setActiveThreadId: (_id: string | null) => {
      // No-op: messaging is not connected to a backend yet.
    },
  };
};
