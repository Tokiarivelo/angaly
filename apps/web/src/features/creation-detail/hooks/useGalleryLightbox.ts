import { useState } from 'react';

/**
 * Active thumbnail index + full-screen lightbox open/close and prev/next
 * cycling. `next`/`previous` are no-ops when there's 0 or 1 media items
 * (nothing to cycle to) — callers already gate the zoom trigger on
 * `media.length > 0` and the arrow buttons on `media.length > 1`.
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
