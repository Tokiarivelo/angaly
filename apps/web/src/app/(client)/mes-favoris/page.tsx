import type { Metadata } from 'next';
import { MesFavorisPage } from '@/features/mes-favoris';

export const metadata: Metadata = {
  title: 'Mes favoris | ANGALY',
  description: 'Retrouvez vos créations, produits et collections favoris.',
};

export default function Page() {
  return <MesFavorisPage />;
}
