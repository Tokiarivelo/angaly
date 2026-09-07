import type { Metadata } from 'next';
import type { CreationDto } from '@angaly/types';

import { apiClient } from '@/lib/api-client';
import { CreationDetailPage } from '@/features/creation-detail';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const creation = await apiClient.get<CreationDto>(`/creations/${slug}`);
    return {
      title: `${creation.name} | ANGALY`,
      description: creation.description,
    };
  } catch {
    return { title: 'Création | ANGALY' };
  }
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <CreationDetailPage slug={slug} />;
}
