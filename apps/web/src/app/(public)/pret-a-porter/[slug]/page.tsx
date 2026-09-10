import type { Metadata } from 'next';
import type { ProductDto } from '@angaly/types';

import { apiClient } from '@/lib/api-client';
import { FicheProduitPage } from '@/features/fiche-produit';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const product = await apiClient.get<ProductDto>(`/products/${slug}`);
    return {
      title: product.name,
      description: product.description,
    };
  } catch {
    return { title: 'Prêt-à-porter' };
  }
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <FicheProduitPage slug={slug} />;
}
