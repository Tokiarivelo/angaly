import { useState } from 'react';

/**
 * Active thumbnail index only — a full zoom/lightbox modal is deferred
 * (no real photography yet to zoom into), same de-scoping as
 * docs/pages/nos-creations-galerie.md's QuickViewModal.
 */
export function useGalleryLightbox(mediaCount: number): {
  activeIndex: number;
  setActiveIndex: (index: number) => void;
} {
  const [activeIndex, setActiveIndexState] = useState(0);

  const setActiveIndex = (index: number) => {
    if (index >= 0 && index < mediaCount) {
      setActiveIndexState(index);
    }
  };

  return { activeIndex, setActiveIndex };
}
