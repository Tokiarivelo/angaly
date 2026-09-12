
export interface Message {
  id: string;
  sender: 'client' | 'atelier';
  content: string;
  timestamp: string;
}

const MOCK_MESSAGES: Record<string, Message[]> = {
  'conv-1': [
    { id: 'm1', sender: 'client', content: 'Bonjour, où en est ma robe ?', timestamp: '2026-09-24T10:00:00Z' },
    { id: 'm2', sender: 'atelier', content: 'Bonjour ! Votre pièce sera prête à l\'essayage jeudi prochain.', timestamp: '2026-09-24T14:30:00Z' },
  ],
  'conv-2': [
    { id: 'm3', sender: 'atelier', content: 'Merci pour votre confiance.', timestamp: '2026-08-10T10:00:00Z' },
  ]
};

export const useConversationThread = (threadId: string | null) => {
  const messages = threadId ? MOCK_MESSAGES[threadId] || [] : [];
  return { messages };
};
