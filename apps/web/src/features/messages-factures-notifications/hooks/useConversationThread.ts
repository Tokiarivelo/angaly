/** Messaging is not connected to a backend yet — see useConversations.ts. Always empty. */
export interface Message {
  id: string;
  sender: 'client' | 'atelier';
  content: string;
  timestamp: string;
}

export const useConversationThread = (_threadId: string | null) => {
  return { messages: [] as Message[] };
};
