import { Suspense } from 'react';
import type { Metadata } from 'next';

import { LaUnePage } from '@/features/la-une';

export const metadata: Metadata = {
  title: 'La Une',
  description:
    "Les créations qui incarnent l'univers Angaly — sélectionnées et renouvelées par la maison.",
};

export default function Page() {
  return (
    <Suspense>
      <LaUnePage />
    </Suspense>
  );
}
