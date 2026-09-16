import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

import { Role } from '@angaly/types';
import { auth } from '@/lib/auth/auth';
import { AiModelSettingsPage } from '@/features/admin-ai-settings';

export const metadata: Metadata = {
  title: 'Paramètres IA | ANGALY Admin',
  description: 'Choix du modèle IA utilisé par Pattern Studio.',
};

// Stricter than the (admin) layout's STAFF_ROLES gate — changing the AI model
// is ADMIN-only (COUTURIERE/MANAGER can reach /admin/dashboard but not this).
export default async function Page() {
  const session = await auth();

  if (session?.user.role !== Role.ADMIN) {
    redirect('/dashboard');
  }

  return <AiModelSettingsPage />;
}
