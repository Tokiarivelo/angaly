import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

import { Role } from '@angaly/types';
import { auth } from '@/lib/auth/auth';
import { AdminMediathequePage } from '@/features/admin-mediatheque';

export const metadata: Metadata = {
  title: 'Médiathèque | ANGALY Admin',
  description: 'Bibliothèque de médias du back-office ANGALY.',
};

// Same MANAGER/ADMIN-only gate as /gestion-contenu — see docs/pages/admin-mediatheque.md.
const CONTENT_ROLES: Role[] = [Role.MANAGER, Role.ADMIN];

interface PageProps {
  searchParams: Promise<{ folder?: string }>;
}

export default async function Page({ searchParams }: PageProps) {
  const session = await auth();

  if (!session?.user || !CONTENT_ROLES.includes(session.user.role)) {
    // NB: `(admin)` is a route group, real URL has no `/admin` prefix — see
    // docs/pages/admin-gestion-contenu.md "Points d'attention".
    redirect('/dashboard');
  }

  const { folder } = await searchParams;

  return <AdminMediathequePage initialFolderId={folder} />;
}
