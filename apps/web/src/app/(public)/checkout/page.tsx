import { CheckoutWizard } from '@/features/checkout';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Paiement Sécurisé | ANGALY',
  description: 'Finalisez votre commande ANGALY en toute sécurité.',
};

export default function Page() {
  return <CheckoutWizard />;
}
