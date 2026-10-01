import type { Metadata } from 'next';
import { AdminCreationProjectsPage } from '@/features/admin-projets-creation';

export const metadata: Metadata = {
  title: 'Projets de création | Administration ANGALY',
  description: 'Suivez et faites avancer les créations sur mesure des clientes.',
};

export default function Page() {
  return <AdminCreationProjectsPage />;
}
