import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

import { Role } from '@angaly/types';

import { auth } from '@/lib/auth/auth';
import { AdminLayout as AdminShell } from '@/features/admin-dashboard';
import { ROUTES } from '@/lib/routes';

const STAFF_ROLES: Role[] = [Role.COUTURIERE, Role.MANAGER, Role.ADMIN];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  if (!session?.user || session.error === 'RefreshAccessTokenError') {
    redirect(`/connexion?redirectTo=${encodeURIComponent(ROUTES.compte)}`);
  }

  if (!STAFF_ROLES.includes(session.user.role)) {
    redirect(ROUTES.compte);
  }

  return <AdminShell>{children}</AdminShell>;
}
