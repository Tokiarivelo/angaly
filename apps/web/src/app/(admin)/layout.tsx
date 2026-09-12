import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

import { Role } from '@angaly/types';

import { auth } from '@/lib/auth/auth';

const STAFF_ROLES: Role[] = [Role.COUTURIERE, Role.MANAGER, Role.ADMIN];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  if (!session?.user || session.error === 'RefreshAccessTokenError' || !STAFF_ROLES.includes(session.user.role)) {
    redirect('/');
  }

  return <>{children}</>;
}
