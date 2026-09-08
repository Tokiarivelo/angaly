import { useState } from 'react';
import type { CreationDto } from '@angaly/types';

/**
 * Quick-view modal state only. `open` receives the full `CreationDto` already
 * fetched by `useCreationsGallery` (the list endpoint returns the same full
 * shape as the detail endpoint) — no extra network call needed.
 */
export function useQuickView(): {
  activeCreation: CreationDto | null;
  open: (creation: CreationDto) => void;
  close: () => void;
} {
  const [activeCreation, setActiveCreation] = useState<CreationDto | null>(null);

  return {
    activeCreation,
    open: (creation: CreationDto) => setActiveCreation(creation),
    close: () => setActiveCreation(null),
  };
}
