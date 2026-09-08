import { useState } from 'react';

/** Open/close state for the mobile full-screen filter panel — page-local, no store needed. */
export function useMobileFilterSheet(): { isOpen: boolean; open: () => void; close: () => void } {
  const [isOpen, setIsOpen] = useState(false);

  return { isOpen, open: () => setIsOpen(true), close: () => setIsOpen(false) };
}
