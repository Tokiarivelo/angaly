import React from 'react';
import { MessageSquare } from 'lucide-react';
import { useContactSupport } from '../hooks/useContactSupport';

interface Props {
  orderNumber: string;
}

export const ContactAngalySupportButton: React.FC<Props> = ({ orderNumber }) => {
  const { handleContact } = useContactSupport(orderNumber);

  return (
    <button
      onClick={handleContact}
      className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 bg-white border border-border rounded-xl text-primary-deep-navy font-medium hover:bg-ivory-warm transition-colors text-sm"
    >
      <MessageSquare size={16} />
      Contacter ANGALY à propos de cette commande
    </button>
  );
};
