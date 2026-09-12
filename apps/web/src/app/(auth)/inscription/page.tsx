import type { Metadata } from 'next';

import { SignupPage } from '@/features/authentification';

import { Suspense } from 'react';

export const metadata: Metadata = { title: 'Inscription' };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <SignupPage />
    </Suspense>
  );
}
