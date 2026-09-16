'use client';

import { FLAGSHIP_ATELIER_SLUG } from '../consts/flagship.const';
import { useAteliersList } from '../hooks/useAteliersList';
import { useAteliersListeContent } from '../hooks/useAteliersListeContent';
import { useAteliersMap } from '../hooks/useAteliersMap';
import { AteliersHeader } from './AteliersHeader';
import { AteliersList } from './AteliersList';
import { AteliersMapPanel } from './AteliersMapPanel';
import { FeaturedAtelierBanner } from './FeaturedAtelierBanner';

/** Orchestrates the real Stitch "Nos Ateliers (Workshops & Locations)" screen — JSX + hooks only. */
export function NosAteliersListePage() {
  const { data: content } = useAteliersListeContent();
  const { flagship, ateliers, isLoading } = useAteliersList();
  const { activeSlug, setActiveSlug } = useAteliersMap();

  return (
    <>
      <AteliersHeader content={content.header} />
      {!isLoading && flagship && <FeaturedAtelierBanner atelier={flagship} />}
      {!isLoading && ateliers.length > 0 && (
        <section className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 py-12 pb-24 sm:px-8 lg:flex-row">
          <AteliersMapPanel ateliers={ateliers} activeSlug={activeSlug} onHoverChange={setActiveSlug} />
          <AteliersList
            ateliers={ateliers}
            flagshipSlug={FLAGSHIP_ATELIER_SLUG}
            activeSlug={activeSlug}
            onHoverChange={setActiveSlug}
          />
        </section>
      )}
    </>
  );
}
