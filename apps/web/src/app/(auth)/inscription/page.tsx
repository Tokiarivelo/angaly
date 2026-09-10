import type { Metadata } from 'next';

import { SignupPage } from '@/features/authentification';

export const metadata: Metadata = { title: 'Inscription' };

export default function Page() {
  return <SignupPage />;
}
