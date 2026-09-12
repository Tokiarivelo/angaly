import type { Metadata } from 'next';
import { MesMesuresPage } from '@/features/mes-mesures';

export const metadata: Metadata = {
  title: 'Mes mesures | ANGALY',
  description: 'Gérez vos profils de mesures pour vos projets de patron sur-mesure.',
};

export default function Page() {
  return <MesMesuresPage />;
}
