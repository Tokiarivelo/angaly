import type { Metadata } from 'next';
import type { AtelierDto } from '@angaly/types';

import { apiClient } from '@/lib/api-client';
import { AtelierDetailPage } from '@/features/atelier-detail';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const atelier = await apiClient.get<AtelierDto>(`/ateliers/${slug}`);
    return {
      title: atelier.name,
      description: `${atelier.name} — ${atelier.address}, ${atelier.city}.`,
    };
  } catch {
    return { title: 'Atelier' };
  }
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <AtelierDetailPage slug={slug} />;
}
