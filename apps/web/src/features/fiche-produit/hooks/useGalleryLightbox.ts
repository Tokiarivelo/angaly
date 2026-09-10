import { useState } from 'react';

/**
 * Same shape as creation-detail/hooks/useGalleryLightbox.ts — duplicated
 * rather than imported cross-feature (feature-slice isolation), see
 * apps/web/src/features/README.md.
 */
export function useGalleryLightbox(mediaCount: number): {
  activeIndex: number;
  setActiveIndex: (index: number) => void;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  next: () => void;
  previous: () => void;
} {
  const [activeIndex, setActiveIndexState] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const setActiveIndex = (index: number) => {
    if (index >= 0 && index < mediaCount) {
      setActiveIndexState(index);
    }
  };

  const next = () => {
    if (mediaCount > 1) {
      setActiveIndexState((current) => (current + 1) % mediaCount);
    }
  };

  const previous = () => {
    if (mediaCount > 1) {
      setActiveIndexState((current) => (current - 1 + mediaCount) % mediaCount);
    }
  };

  return {
    activeIndex,
    setActiveIndex,
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    next,
    previous,
  };
}
