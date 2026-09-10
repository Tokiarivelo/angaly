import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

import { REDIRECT_TO_PARAM } from '@/features/authentification/consts/queryKeys';
import { auth } from '@/lib/auth/auth';

export default async function ClientLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    const currentPath = (await headers()).get('x-pathname') ?? '/';
    redirect(`/connexion?${REDIRECT_TO_PARAM}=${encodeURIComponent(currentPath)}`);
  }

  return <>{children}</>;
}
