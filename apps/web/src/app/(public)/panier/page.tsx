import { PanierPage } from '@/features/panier';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Votre Panier | ANGALY',
  description: 'Gérez votre panier d\'achats sur ANGALY.',
};

export default function Page() {
  return <PanierPage />;
}
