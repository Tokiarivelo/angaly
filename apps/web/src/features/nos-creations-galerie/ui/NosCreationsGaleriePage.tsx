'use client';

import { useCategoryFilter } from '../hooks/useCategoryFilter';
import { useCreationsGallery } from '../hooks/useCreationsGallery';
import { useGalleryFilters } from '../hooks/useGalleryFilters';
import { useQuickView } from '../hooks/useQuickView';
import { ActiveFilterChips } from './ActiveFilterChips';
import { FilterBar } from './FilterBar';
import { GalleryGrid } from './GalleryGrid';
import { GalleryHeader } from './GalleryHeader';
import { LoadMoreButton } from './LoadMoreButton';
import { QuickViewModal } from './QuickViewModal';
import { ResultsCount } from './ResultsCount';

/** Orchestrates the real Stitch "Nos Créations (Gallery Portfolio)" screen — JSX + hooks only. */
export function NosCreationsGaleriePage() {
  const {
    sort,
    setSort,
    view,
    setView,
    categoryId,
    setCategoryId,
    genre,
    setGenre,
    type,
    setType,
    color,
    setColor,
    style,
    setStyle,
    resetFilters,
  } = useGalleryFilters();

  const { items, total, isLoading, isLoadingMore, hasNextPage, loadMore } = useCreationsGallery(sort, {
    categoryId,
    genre,
    type,
    color,
    style,
  });

  const { activeCreation, open: openQuickView, close: closeQuickView } = useQuickView();
  const { categories } = useCategoryFilter();
  const selectedCategory = categories.find((category) => category.id === categoryId) ?? null;

  return (
    <>
      <GalleryHeader />
      <FilterBar
        sort={sort}
        onSortChange={setSort}
        view={view}
        onViewChange={setView}
        categoryId={categoryId}
        onCategoryChange={setCategoryId}
        genre={genre}
        onGenreChange={setGenre}
        type={type}
        onTypeChange={setType}
        color={color}
        onColorChange={setColor}
        style={style}
        onStyleChange={setStyle}
      />
      <ActiveFilterChips
        category={selectedCategory}
        genre={genre}
        type={type}
        color={color}
        style={style}
        onRemoveCategory={() => setCategoryId(null)}
        onRemoveGenre={() => setGenre(null)}
        onRemoveType={() => setType(null)}
        onRemoveColor={() => setColor(null)}
        onRemoveStyle={() => setStyle(null)}
        onReset={resetFilters}
      />
      <ResultsCount total={total} />
      <section className="w-full pb-24">
        {!isLoading && (
          <GalleryGrid items={items} view={view} onQuickView={openQuickView} onResetFilters={resetFilters} />
        )}
        {!isLoading && hasNextPage && <LoadMoreButton onClick={loadMore} isLoading={isLoadingMore} />}
      </section>
      <QuickViewModal creation={activeCreation} onClose={closeQuickView} />
    </>
  );
}
