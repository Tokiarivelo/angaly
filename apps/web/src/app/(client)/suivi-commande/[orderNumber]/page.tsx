import { SuiviCommandePage } from '@/features/suivi-commande';
import { ClientSpaceLayout } from '@/features/espace-client-dashboard';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Suivi de commande | ANGALY',
  description: 'Suivez la production et livraison de votre commande ANGALY.',
};

interface PageProps {
  params: Promise<{
    orderNumber: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  const resolvedParams = await params;
  return (
    <ClientSpaceLayout>
      <SuiviCommandePage orderNumber={resolvedParams.orderNumber} />
    </ClientSpaceLayout>
  );
}
