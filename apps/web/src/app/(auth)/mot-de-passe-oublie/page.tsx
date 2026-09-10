import type { Metadata } from 'next';

import { ForgotPasswordPage } from '@/features/authentification';

export const metadata: Metadata = { title: 'Mot de passe oublié' };

export default function Page() {
  return <ForgotPasswordPage />;
}
