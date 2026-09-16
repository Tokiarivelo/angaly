'use client';

import { useCollectionsContent } from '../hooks/useCollectionsContent';
import { useCollectionsList } from '../hooks/useCollectionsList';
import { CollectionsGrid } from './CollectionsGrid';
import { CollectionsHeader } from './CollectionsHeader';
import { FeaturedCollectionBanner } from './FeaturedCollectionBanner';

/** Orchestrates the real Stitch "Nos Collections (Index Editorial)" screen — JSX + hooks only. */
export function CollectionsListePage() {
  const { data: content } = useCollectionsContent();
  const { featured, grid, isLoading } = useCollectionsList();

  return (
    <>
      <CollectionsHeader content={content.header} />
      {!isLoading && featured && <FeaturedCollectionBanner collection={featured} />}
      {!isLoading && <CollectionsGrid collections={grid} />}
    </>
  );
}
