'use client';

import { useContentTypeFilter } from '../hooks/useContentTypeFilter';
import { useLaUneItems } from '../hooks/useLaUneItems';
import { ClosingCtaBand } from './ClosingCtaBand';
import { ContentTypeFilterBar } from './ContentTypeFilterBar';
import { EditorialGrid } from './EditorialGrid';
import { FeaturedHeroItem } from './FeaturedHeroItem';
import { LaUneHeader } from './LaUneHeader';

/**
 * Orchestrates the real Stitch "La Une" screen's section order: header,
 * filter bar, featured hero (always shown, unaffected by the filter), then
 * the filtered editorial grid, then the closing CTA band.
 */
export function LaUnePage() {
  const { hero, grid, isLoading } = useLaUneItems();
  const { activeFilter, setActiveFilter, filteredItems } = useContentTypeFilter(grid);

  return (
    <>
      <LaUneHeader />
      <ContentTypeFilterBar activeFilter={activeFilter} onChange={setActiveFilter} />
      {!isLoading && hero && <FeaturedHeroItem item={hero} />}
      <EditorialGrid items={filteredItems} />
      <ClosingCtaBand />
    </>
  );
}
