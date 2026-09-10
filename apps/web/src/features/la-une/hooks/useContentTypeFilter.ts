'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';

import { CONTENT_TYPE_FILTERS } from '../consts/content-type-filters.const';
import type { FilterPillValue, LaUneItem } from '../types/la-une-item.types';

const VALID_FILTERS = new Set<string>(CONTENT_TYPE_FILTERS.map((f) => f.value));

/** Filter state synced with the URL query string (?type=...), back/forward-navigable. */
export function useContentTypeFilter(items: LaUneItem[]): {
  activeFilter: FilterPillValue;
  setActiveFilter: (value: FilterPillValue) => void;
  filteredItems: LaUneItem[];
} {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeFilter: FilterPillValue = useMemo(() => {
    const raw = searchParams.get('type');
    return raw && VALID_FILTERS.has(raw) ? (raw as FilterPillValue) : 'all';
  }, [searchParams]);

  const setActiveFilter = useCallback(
    (value: FilterPillValue) => {
      const next = new URLSearchParams(searchParams.toString());
      if (value === 'all') {
        next.delete('type');
      } else {
        next.set('type', value);
      }
      const queryString = next.toString();
      const target = queryString ? `${pathname}?${queryString}` : pathname;
      router.push(target, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const filteredItems = useMemo(
    () => (activeFilter === 'all' ? items : items.filter((item) => item.contentType === activeFilter)),
    [items, activeFilter],
  );

  return { activeFilter, setActiveFilter, filteredItems };
}
