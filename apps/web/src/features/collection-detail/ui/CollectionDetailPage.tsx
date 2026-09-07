'use client';

import Link from 'next/link';

import { ROUTES } from '@/lib/routes';

import { useCollectionDetail } from '../hooks/useCollectionDetail';
import { ClosingCtaBand } from './ClosingCtaBand';
import { CollectionCover } from './CollectionCover';
import { CollectionCreationsGrid } from './CollectionCreationsGrid';
import { CollectionStory } from './CollectionStory';

/** Orchestrates the real Stitch "Collection Éternelle (Detail Page)" screen — JSX + hooks only. */
export function CollectionDetailPage({ slug }: { slug: string }) {
  const { data: collection, isLoading, error } = useCollectionDetail(slug);

  if (isLoading) {
    return null;
  }

  if (error || !collection) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <p className="text-angaly-slate">Cette collection est introuvable.</p>
        <Link href={ROUTES.collections} className="mt-4 inline-block text-sm text-angaly-navy underline">
          Retour aux collections
        </Link>
      </div>
    );
  }

  return (
    <>
      <CollectionCover collection={collection} />
      <CollectionStory collection={collection} />
      <CollectionCreationsGrid creations={collection.creations} />
      <ClosingCtaBand />
    </>
  );
}
