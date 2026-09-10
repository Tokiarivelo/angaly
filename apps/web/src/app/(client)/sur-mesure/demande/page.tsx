import type { Metadata } from 'next';

import { DemandeSurMesureWizard } from '@/features/demande-sur-mesure';

export const metadata: Metadata = {
  title: 'Demande de création sur mesure',
  description: 'Racontez-nous votre projet, nous vous recontactons rapidement.',
};

export default function Page() {
  return <DemandeSurMesureWizard />;
}
