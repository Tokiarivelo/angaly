'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';

import { catalogueFiltersSchema, type CatalogueFiltersValues } from '../schemas/catalogue-filters.schema';

type FilterKey = keyof CatalogueFiltersValues;

/**
 * Filter/sort/page state synced with the URL query string (shareable,
 * back/forward-navigable — see docs/pages/pret-a-porter-catalogue.md "Points
 * d'attention"). Changing any filter other than `page` resets `page` to 1.
 */
export function useCatalogueFilters(): {
  filters: CatalogueFiltersValues;
  setFilter: (key: FilterKey, value: string | undefined) => void;
  setPage: (page: number) => void;
  resetFilters: () => void;
} {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = useMemo(() => {
    const raw = Object.fromEntries(searchParams.entries());
    const parsed = catalogueFiltersSchema.safeParse(raw);
    return parsed.success ? parsed.data : catalogueFiltersSchema.parse({});
  }, [searchParams]);

  const pushParams = useCallback(
    (next: URLSearchParams) => {
      router.push(`${pathname}?${next.toString()}`);
    },
    [pathname, router],
  );

  const setFilter = useCallback(
    (key: FilterKey, value: string | undefined) => {
      const next = new URLSearchParams(searchParams.toString());
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      if (key !== 'page') {
        next.delete('page');
      }
      pushParams(next);
    },
    [pushParams, searchParams],
  );

  const setPage = useCallback(
    (page: number) => {
      const next = new URLSearchParams(searchParams.toString());
      next.set('page', String(page));
      pushParams(next);
    },
    [pushParams, searchParams],
  );

  const resetFilters = useCallback(() => {
    router.push(pathname);
  }, [pathname, router]);

  return { filters, setFilter, setPage, resetFilters };
}
