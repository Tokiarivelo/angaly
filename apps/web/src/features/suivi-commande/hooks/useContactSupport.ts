import { useRouter } from 'next/navigation';

export const useContactSupport = (orderNumber: string) => {
  const router = useRouter();

  const handleContact = () => {
    // Redirect to messages-factures-notifications with pre-filled context.
    router.push(`/mes-messages?context=order&ref=${encodeURIComponent(orderNumber)}`);
  };

  return { handleContact };
};
