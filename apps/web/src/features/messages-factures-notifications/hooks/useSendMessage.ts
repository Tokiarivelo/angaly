/**
 * Messaging is not connected to a backend yet (no `Message`/`Conversation`
 * model, no `messages` module — see useConversations.ts). This never hits a
 * fake endpoint; it rejects so the composer surfaces the "à venir" state
 * rather than pretending to have sent anything.
 */
export const useSendMessage = () => {
  const sendMessage = (_threadId: string, _content: string): Promise<void> => {
    return Promise.reject(new Error('La messagerie ANGALY arrive bientôt.'));
  };
  return { sendMessage };
};
