import type { Metadata } from 'next';

import { LoginPage } from '@/features/authentification';

import { Suspense } from 'react';

export const metadata: Metadata = { title: 'Connexion' };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <LoginPage />
    </Suspense>
  );
}
