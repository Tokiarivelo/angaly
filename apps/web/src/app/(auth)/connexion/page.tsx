import type { Metadata } from 'next';

import { LoginPage } from '@/features/authentification';

export const metadata: Metadata = { title: 'Connexion' };

export default function Page() {
  return <LoginPage />;
}
