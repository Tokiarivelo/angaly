import { useEffect, useState } from 'react';

import { useMobileNavigationStore } from '@/stores/mobile-navigation.store';

const DEBOUNCE_MS = 300;

/** Open/closed state (shared via the store) + the raw and debounced search query. */
export function useMobileSearchOverlay(): {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  query: string;
  setQuery: (query: string) => void;
  debouncedQuery: string;
} {
  const isOpen = useMobileNavigationStore((state) => state.isSearchOpen);
  const openSearch = useMobileNavigationStore((state) => state.openSearch);
  const closeSearch = useMobileNavigationStore((state) => state.closeSearch);

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const close = () => {
    closeSearch();
    setQuery('');
    setDebouncedQuery('');
  };

  return { isOpen, open: openSearch, close, query, setQuery, debouncedQuery };
}
