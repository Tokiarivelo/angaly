import type { Metadata } from 'next';

import { PretAPorterCataloguePage } from '@/features/pret-a-porter-catalogue';

import { Suspense } from 'react';

export const metadata: Metadata = { title: 'Prêt-à-porter' };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <PretAPorterCataloguePage />
    </Suspense>
  );
}
