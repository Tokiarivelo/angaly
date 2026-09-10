import type { Metadata } from 'next';

import { SurMesureProcessPage } from '@/features/sur-mesure-process';

export const metadata: Metadata = {
  title: 'Sur Mesure',
  description: 'Votre idée, façonnée avec précision, entièrement pour vous.',
};

export default function Page() {
  return <SurMesureProcessPage />;
}
