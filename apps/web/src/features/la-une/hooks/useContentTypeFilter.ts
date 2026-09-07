import { useMemo, useState } from 'react';

import type { FilterPillValue, LaUneItem } from '../types/la-une-item.types';

/** Client-side only — no server-side taxonomy filter exists yet, see docs/pages/la-une.md. */
export function useContentTypeFilter(items: LaUneItem[]): {
  activeFilter: FilterPillValue | 'all';
  setActiveFilter: (value: FilterPillValue | 'all') => void;
  filteredItems: LaUneItem[];
} {
  const [activeFilter, setActiveFilter] = useState<FilterPillValue | 'all'>('all');

  const filteredItems = useMemo(
    () => (activeFilter === 'all' ? items : items.filter((item) => item.contentType === activeFilter)),
    [items, activeFilter],
  );

  return { activeFilter, setActiveFilter, filteredItems };
}
