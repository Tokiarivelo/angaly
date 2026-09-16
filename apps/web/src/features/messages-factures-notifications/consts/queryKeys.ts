export const QUERY_KEYS = {
  notifications: ['messages-factures-notifications', 'notifications'] as const,
  payments: ['messages-factures-notifications', 'payments'] as const,
  orders: ['messages-factures-notifications', 'orders'] as const,
  conversations: ['messages-factures-notifications', 'conversations'] as const,
  conversationThread: (conversationId: string) => ['messages-factures-notifications', 'conversations', conversationId, 'messages'] as const,
};
