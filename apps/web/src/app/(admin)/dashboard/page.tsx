import { AdminDashboardPage } from '@/features/admin-dashboard';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Administration | ANGALY',
  description: 'Tableau de bord administrateur ANGALY.',
};

export default function Page() {
  return <AdminDashboardPage />;
}
