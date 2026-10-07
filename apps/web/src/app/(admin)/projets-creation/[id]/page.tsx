import { Suspense } from 'react';
import type { Metadata } from 'next';
import { AdminCreationProjectDetailPage } from '@/features/admin-projets-creation';

export const metadata: Metadata = {
  title: 'Détail du projet | Administration ANGALY',
  description: "Détail d'un projet de création sur mesure : étapes, assignation et historique.",
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense
      fallback={
        <div className="flex-1 p-6 md:p-8 lg:p-12 max-w-7xl mx-auto w-full animate-pulse space-y-4">
          <div className="h-10 w-1/2 bg-[#D8D3C8]/40 rounded-sm" />
          <div className="h-64 bg-white border border-[#D9D4CA] rounded-sm" />
        </div>
      }
    >
      <AdminCreationProjectDetailPage projectId={id} />
    </Suspense>
  );
}
