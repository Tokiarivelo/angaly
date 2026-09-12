import { useRouter } from 'next/navigation';

export const useContactSupport = (orderNumber: string) => {
  const router = useRouter();

  const handleContact = () => {
    // Redirect to messages with pre-filled context
    router.push(`/messages?context=order&ref=${orderNumber}`);
  };

  return { handleContact };
};
