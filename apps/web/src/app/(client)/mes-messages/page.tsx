import { MessagesFacturesNotificationsPage } from '@/features/messages-factures-notifications';
import { ClientSpaceLayout } from '@/features/espace-client-dashboard';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Messagerie & Factures | ANGALY',
  description: 'Échangez avec l\'atelier, consultez vos factures et vos notifications.',
};

export default function Page() {
  return (
    <ClientSpaceLayout>
      <MessagesFacturesNotificationsPage />
    </ClientSpaceLayout>
  );
}
