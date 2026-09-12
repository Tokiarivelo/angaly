import { Suspense } from 'react';
import { PrendreRendezVousPage } from '@/features/prendre-rendez-vous';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <PrendreRendezVousPage />
    </Suspense>
  );
}
