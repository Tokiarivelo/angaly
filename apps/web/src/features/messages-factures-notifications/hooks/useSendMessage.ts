export const useSendMessage = () => {
  const sendMessage = async (threadId: string, content: string) => {
    console.log(`Sending message in ${threadId}: ${content}`);
    // Mock successful send
    return new Promise(resolve => setTimeout(resolve, 300));
  };
  return { sendMessage };
};
