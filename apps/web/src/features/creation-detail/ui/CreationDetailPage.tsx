'use client';

import Link from 'next/link';

import { ROUTES } from '@/lib/routes';

import { useCreationDetail } from '../hooks/useCreationDetail';
import { useCreationDetailContent } from '../hooks/useCreationDetailContent';
import { useRelatedCreations } from '../hooks/useRelatedCreations';
import { AppointmentCtaBand } from './AppointmentCtaBand';
import { CraftsmanshipStory } from './CraftsmanshipStory';
import { CreationGallery } from './CreationGallery';
import { CreationInfoPanel } from './CreationInfoPanel';
import { RelatedCollectionRow } from './RelatedCollectionRow';
import { RelatedCreationsGrid } from './RelatedCreationsGrid';

/** Orchestrates the real Stitch "Robe Éternelle (Detail Page)" screen — JSX + hooks only. */
export function CreationDetailPage({ slug }: { slug: string }) {
  const { data: creation, isLoading, error } = useCreationDetail(slug);
  const { sameCollection, sameCategory } = useRelatedCreations(creation);
  const { data: content } = useCreationDetailContent();

  if (isLoading) {
    return null;
  }

  if (error || !creation) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <p className="text-angaly-slate">Cette création est introuvable.</p>
        <Link href={ROUTES.creations} className="mt-4 inline-block text-sm text-angaly-navy underline">
          Retour à nos créations
        </Link>
      </div>
    );
  }

  return (
    <>
      <nav aria-label="Fil d'Ariane" className="mx-auto max-w-7xl px-6 py-4 text-xs text-angaly-slate">
        <ol className="inline-flex items-center space-x-2">
          <li>
            <Link href={ROUTES.home} className="hover:text-angaly-navy transition-colors">
              Accueil
            </Link>
          </li>
          <li className="flex items-center gap-2">
            <span>/</span>
            <Link href={ROUTES.creations} className="hover:text-angaly-navy transition-colors">
              Nos Créations
            </Link>
          </li>
          <li className="flex items-center gap-2">
            <span>/</span>
            <span>{creation.category.name}</span>
          </li>
          <li aria-current="page" className="flex items-center gap-2">
            <span>/</span>
            <span className="font-medium text-angaly-navy">{creation.name}</span>
          </li>
        </ol>
      </nav>

      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="flex flex-col gap-12 lg:flex-row">
          <CreationGallery creation={creation} />
          <CreationInfoPanel creation={creation} />
        </div>
      </section>

      <CraftsmanshipStory content={content.savoirFaire} />

      {creation.collection && (
        <RelatedCollectionRow
          collectionName={creation.collection.name}
          collectionHref={`/collections/${creation.collection.slug}`}
          creations={sameCollection}
        />
      )}

      <RelatedCreationsGrid creations={sameCategory} />

      <AppointmentCtaBand />
    </>
  );
}
