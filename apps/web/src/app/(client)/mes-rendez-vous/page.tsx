import { MesRendezVousPage } from '@/features/mes-rendez-vous';
import { ClientSpaceLayout } from '@/features/espace-client-dashboard';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mes Rendez-vous | ANGALY',
  description: 'Gérez vos rendez-vous en atelier ANGALY.',
};

export default function Page() {
  return (
    <ClientSpaceLayout>
      <MesRendezVousPage />
    </ClientSpaceLayout>
  );
}
