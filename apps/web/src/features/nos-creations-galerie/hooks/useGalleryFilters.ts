import { useState } from 'react';

import type { GallerySort, GalleryView } from '../types/gallery.types';

/** Sort + view-mode state — the decorative Genre/Type/Catégorie/Couleur/Style dropdowns carry no state yet (see gallery-filters.const.ts). */
export function useGalleryFilters(): {
  sort: GallerySort;
  setSort: (sort: GallerySort) => void;
  view: GalleryView;
  setView: (view: GalleryView) => void;
} {
  const [sort, setSort] = useState<GallerySort>('newest');
  const [view, setView] = useState<GalleryView>('grid');

  return { sort, setSort, view, setView };
}
