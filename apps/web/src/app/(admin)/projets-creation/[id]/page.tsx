import type { Metadata } from 'next';
import { AdminCreationProjectDetailPage } from '@/features/admin-projets-creation';

export const metadata: Metadata = {
  title: 'Détail du projet | Administration ANGALY',
  description: "Détail d'un projet de création sur mesure : étapes, assignation et historique.",
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminCreationProjectDetailPage projectId={id} />;
}
