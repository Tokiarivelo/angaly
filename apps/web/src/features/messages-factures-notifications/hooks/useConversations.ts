'use client';

import { useState } from 'react';

import { useConversationsQuery } from '../api/messages.api';
import { useOrdersQuery } from '../api/invoices.api';

export interface ConversationThread {
  id: string;
  atelierName: string;
  orderReference?: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
}

/**
 * Real endpoint — `GET /api/messages/conversations` (see docs/features/messages.md).
 * `orderReference` is resolved locally by joining the (small) own-orders list
 * when `relatedEntityType === 'Order'` — same join pattern as `useInvoices.ts`.
 */
export const useConversations = () => {
  const conversationsQuery = useConversationsQuery();
  const ordersQuery = useOrdersQuery();
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);

  const threads: ConversationThread[] = (conversationsQuery.data ?? []).map((conversation) => {
    const order =
      conversation.relatedEntityType === 'Order'
        ? ordersQuery.data?.find((candidate) => candidate.id === conversation.relatedEntityId)
        : undefined;

    return {
      id: conversation.id,
      atelierName: conversation.atelierName,
      ...(order?.orderNumber ? { orderReference: order.orderNumber } : {}),
      lastMessage: conversation.lastMessagePreview,
      timestamp: conversation.lastMessageAt,
      unreadCount: conversation.unreadCount,
    };
  });

  return {
    threads,
    activeThreadId,
    setActiveThreadId,
    isLoading: conversationsQuery.isLoading,
    isError: conversationsQuery.isError,
  };
};
