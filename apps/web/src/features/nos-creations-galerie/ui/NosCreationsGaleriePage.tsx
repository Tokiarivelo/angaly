'use client';

import { useCreationsGallery } from '../hooks/useCreationsGallery';
import { useGalleryFilters } from '../hooks/useGalleryFilters';
import { useQuickView } from '../hooks/useQuickView';
import { FilterBar } from './FilterBar';
import { GalleryGrid } from './GalleryGrid';
import { GalleryHeader } from './GalleryHeader';
import { LoadMoreButton } from './LoadMoreButton';
import { QuickViewModal } from './QuickViewModal';
import { ResultsCount } from './ResultsCount';

/** Orchestrates the real Stitch "Nos Créations (Gallery Portfolio)" screen — JSX + hooks only. */
export function NosCreationsGaleriePage() {
  const { sort, setSort, view, setView } = useGalleryFilters();
  const { items, total, isLoading, isLoadingMore, hasNextPage, loadMore } = useCreationsGallery(sort);
  const { activeCreation, open: openQuickView, close: closeQuickView } = useQuickView();

  return (
    <>
      <GalleryHeader />
      <FilterBar sort={sort} onSortChange={setSort} view={view} onViewChange={setView} />
      <ResultsCount total={total} />
      <section className="w-full pb-24">
        {!isLoading && <GalleryGrid items={items} view={view} onQuickView={openQuickView} />}
        {!isLoading && hasNextPage && <LoadMoreButton onClick={loadMore} isLoading={isLoadingMore} />}
      </section>
      <QuickViewModal creation={activeCreation} onClose={closeQuickView} />
    </>
  );
}
