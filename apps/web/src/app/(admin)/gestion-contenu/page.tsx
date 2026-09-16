import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

import { Role } from '@angaly/types';
import { auth } from '@/lib/auth/auth';
import { AdminContentPage } from '@/features/admin-gestion-contenu';

export const metadata: Metadata = {
  title: 'Gestion de contenu | ANGALY Admin',
  description: 'Éditeur de sections de page pour le back-office ANGALY.',
};

// Stricter than the (admin) layout's STAFF_ROLES gate: content editing is
// MANAGER/ADMIN-only, a COUTURIERE reaches /admin/dashboard but not this page
// (docs/pages/admin-gestion-contenu.md).
const CONTENT_ROLES: Role[] = [Role.MANAGER, Role.ADMIN];

interface PageProps {
  searchParams: Promise<{ page?: string; section?: string }>;
}

export default async function Page({ searchParams }: PageProps) {
  const session = await auth();

  if (!session?.user || !CONTENT_ROLES.includes(session.user.role)) {
    // NB: the (admin) segment is a Next.js route group (no URL prefix), so
    // the dashboard's real URL is `/dashboard`, not `/admin/dashboard` —
    // see the routing note in docs/pages/admin-gestion-contenu.md.
    redirect('/dashboard');
  }

  const { page, section } = await searchParams;

  return <AdminContentPage initialPage={page} initialSectionKey={section} />;
}
