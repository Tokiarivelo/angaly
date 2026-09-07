import type { Metadata } from 'next';

import { NosAteliersListePage } from '@/features/nos-ateliers-liste';

export const metadata: Metadata = {
  title: 'Nos Ateliers | ANGALY',
  description: "Venez découvrir notre savoir-faire dans l'un de nos ateliers.",
};

export default function Page() {
  return <NosAteliersListePage />;
}
