import { EspaceClientDashboardPage, ClientSpaceLayout } from '@/features/espace-client-dashboard';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mon Espace Client | ANGALY',
  description: 'Tableau de bord de votre espace client ANGALY.',
};

export default function Page() {
  return (
    <ClientSpaceLayout>
      <EspaceClientDashboardPage />
    </ClientSpaceLayout>
  );
}
