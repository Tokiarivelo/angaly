import { useState } from 'react';

export interface ConversationThread {
  id: string;
  atelierName: string;
  orderReference?: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
}

const MOCK_THREADS: ConversationThread[] = [
  {
    id: 'conv-1',
    atelierName: 'Atelier ANGALY',
    orderReference: 'ANG-2938',
    lastMessage: 'Bonjour ! Votre pièce sera prête à l\'essayage jeudi prochain.',
    timestamp: '2026-09-24T14:30:00Z',
    unreadCount: 1,
  },
  {
    id: 'conv-2',
    atelierName: 'Service Client',
    lastMessage: 'Merci pour votre confiance.',
    timestamp: '2026-08-10T10:00:00Z',
    unreadCount: 0,
  }
];

export const useConversations = () => {
  const [activeThreadId, setActiveThreadId] = useState<string | null>(MOCK_THREADS[0]?.id ?? null);

  return {
    threads: MOCK_THREADS,
    activeThreadId,
    setActiveThreadId,
  };
};
