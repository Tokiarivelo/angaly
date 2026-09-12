'use client';

import { useState } from 'react';
import { useRequestQuoteChange } from '../hooks/useRequestQuoteChange';

interface RequestChangeModalProps {
  quoteNumber: string;
  isOpen: boolean;
  onClose: () => void;
}

export const RequestChangeModal = ({ quoteNumber, isOpen, onClose }: RequestChangeModalProps) => {
  const [message, setMessage] = useState('');
  const { mutate: requestChange, isPending } = useRequestQuoteChange();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    requestChange(
      { quoteNumber, message },
      {
        onSuccess: () => {
          setMessage('');
          onClose();
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="font-serif text-xl font-bold text-navy-deep mb-4">
          Demander une modification
        </h2>
        <p className="text-sm text-gray-warm mb-6">
          Indiquez-nous ce que vous souhaitez ajuster sur ce devis (budget, matériaux, prestations...). 
          Notre équipe vous renverra une nouvelle proposition.
        </p>
        
        <form onSubmit={handleSubmit}>
          <textarea
            className="w-full rounded-md border border-border p-3 text-sm focus:border-navy-deep focus:outline-none focus:ring-1 focus:ring-navy-deep min-h-[120px] mb-6"
            placeholder="Votre message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={isPending}
            required
          />
          
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-navy-soft transition-colors hover:bg-gray-100 rounded-md"
              disabled={isPending}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isPending || !message.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-navy-deep rounded-md transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isPending ? 'Envoi...' : 'Envoyer la demande'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
