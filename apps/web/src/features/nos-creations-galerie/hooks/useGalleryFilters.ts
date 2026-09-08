import { useState } from 'react';

import type { GallerySort, GalleryView } from '../types/gallery.types';

/**
 * Sort + view-mode + the real Catégorie filter state. Genre/Type/Couleur/Style
 * stay decorative — no Prisma field backs them yet (see gallery-filters.const.ts).
 */
export function useGalleryFilters(): {
  sort: GallerySort;
  setSort: (sort: GallerySort) => void;
  view: GalleryView;
  setView: (view: GalleryView) => void;
  categoryId: string | null;
  setCategoryId: (categoryId: string | null) => void;
  resetFilters: () => void;
} {
  const [sort, setSort] = useState<GallerySort>('newest');
  const [view, setView] = useState<GalleryView>('grid');
  const [categoryId, setCategoryId] = useState<string | null>(null);

  return { sort, setSort, view, setView, categoryId, setCategoryId, resetFilters: () => setCategoryId(null) };
}
