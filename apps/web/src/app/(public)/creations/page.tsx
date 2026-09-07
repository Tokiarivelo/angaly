import type { Metadata } from 'next';

import { NosCreationsGaleriePage } from '@/features/nos-creations-galerie';

export const metadata: Metadata = {
  title: 'Nos Créations | ANGALY Couture',
  description: "Explorez l'ensemble de notre savoir-faire, des robes de mariée aux costumes sur mesure.",
};

export default function Page() {
  return <NosCreationsGaleriePage />;
}
