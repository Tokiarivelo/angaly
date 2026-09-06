import type { Metadata } from 'next';

import { HomePage } from '@/features/home';

export const metadata: Metadata = {
  title: 'ANGALY — Maison de couture',
  description:
    "L'élégance, créée pour vous. Découvrez les créations, collections et le sur-mesure de la maison de couture ANGALY.",
};

export default function Page() {
  return <HomePage />;
}
