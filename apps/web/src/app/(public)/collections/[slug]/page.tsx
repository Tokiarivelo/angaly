import type { Metadata } from 'next';
import type { CollectionDetailDto } from '@angaly/types';

import { apiClient } from '@/lib/api-client';
import { CollectionDetailPage } from '@/features/collection-detail';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const collection = await apiClient.get<CollectionDetailDto>(`/collections/${slug}`);
    return {
      title: `${collection.name} | ANGALY`,
      description: collection.description ?? collection.story ?? undefined,
    };
  } catch {
    return { title: 'Collection | ANGALY' };
  }
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <CollectionDetailPage slug={slug} />;
}
