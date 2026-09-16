import React from 'react';
import { MessageSquare } from 'lucide-react';

/**
 * Permanent empty state for the Messages tab — no `Message`/`Conversation`
 * Prisma model and no `messages` NestJS module exist yet (see
 * docs/pages/messages-factures-notifications.md "Points d'attention"). This
 * is a documented, intentional gap: never wire this tab to a fake endpoint.
 */
export const MessagingComingSoonPanel: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-white border border-border rounded-2xl">
      <div className="w-16 h-16 bg-ivory-warm rounded-full flex items-center justify-center text-slate mb-4">
        <MessageSquare size={32} />
      </div>
      <h3 className="font-serif text-xl text-primary-deep-navy mb-2">Messagerie à venir</h3>
      <p className="text-slate max-w-sm">
        La messagerie avec l&apos;atelier ANGALY n&apos;est pas encore disponible. En attendant,
        utilisez la page de suivi de votre commande ou de votre rendez-vous pour nous contacter.
      </p>
    </div>
  );
};
