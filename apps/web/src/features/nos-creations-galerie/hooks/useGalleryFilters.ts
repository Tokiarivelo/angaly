import { useState } from 'react';

import type { GallerySort, GalleryView } from '../types/gallery.types';

/**
 * Sort + view-mode + all 5 creation filter states (Catégorie, Genre, Type, Couleur, Style).
 */
export function useGalleryFilters(): {
  sort: GallerySort;
  setSort: (sort: GallerySort) => void;
  view: GalleryView;
  setView: (view: GalleryView) => void;
  categoryId: string | null;
  setCategoryId: (categoryId: string | null) => void;
  genre: string | null;
  setGenre: (genre: string | null) => void;
  type: string | null;
  setType: (type: string | null) => void;
  color: string | null;
  setColor: (color: string | null) => void;
  style: string | null;
  setStyle: (style: string | null) => void;
  resetFilters: () => void;
} {
  const [sort, setSort] = useState<GallerySort>('newest');
  const [view, setView] = useState<GalleryView>('grid');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [genre, setGenre] = useState<string | null>(null);
  const [type, setType] = useState<string | null>(null);
  const [color, setColor] = useState<string | null>(null);
  const [style, setStyle] = useState<string | null>(null);

  const resetFilters = () => {
    setCategoryId(null);
    setGenre(null);
    setType(null);
    setColor(null);
    setStyle(null);
  };

  return {
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
  };
}
