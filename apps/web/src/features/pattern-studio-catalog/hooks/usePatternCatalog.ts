'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { PatternCatalogEntryDto, PatternCatalogGroup } from '@angaly/types';

import { createProjectFromCatalog, fetchPatternCatalog } from '../api/pattern-catalog.api';

export type CatalogFilter = 'TOUS' | PatternCatalogGroup;

const normalize = (s: string): string => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Entries of a shelf whose name, period or description contain every word searched (accents ignored). */
export function filterCatalog(entries: PatternCatalogEntryDto[], filter: CatalogFilter, search: string): PatternCatalogEntryDto[] {
  const words = normalize(search).split(/\s+/).filter(Boolean);
  return entries.filter((e) => {
    if (filter !== 'TOUS' && e.group !== filter) return false;
    const text = normalize(`${e.title} ${e.era} ${e.notes}`);
    return words.every((w) => text.includes(w));
  });
}

/** Number of dresses per shelf (and in all), for the filter chips. */
export function countByGroup(entries: PatternCatalogEntryDto[]): Record<CatalogFilter, number> {
  const out: Record<CatalogFilter, number> = { TOUS: entries.length, MODERNE: 0, HISTORIQUE: 0, MARIEE: 0 };
  for (const e of entries) out[e.group] += 1;
  return out;
}

/** The catalogue page's state: the list, the shelf and search chosen, the dress whose pieces are shown, creation. */
export function usePatternCatalog() {
  const router = useRouter();
  const query = useQuery({ queryKey: ['pattern-catalog'], queryFn: fetchPatternCatalog, staleTime: 5 * 60_000 });
  const [filter, setFilter] = useState<CatalogFilter>('TOUS');
  const [search, setSearch] = useState('');
  const [openPiecesId, setOpenPiecesId] = useState<string | null>(null);
  const entries = useMemo(() => query.data ?? [], [query.data]);
  const visible = useMemo(() => filterCatalog(entries, filter, search), [entries, filter, search]);
  const counts = useMemo(() => countByGroup(entries), [entries]);
  const create = useMutation({
    mutationFn: createProjectFromCatalog,
    // The customer enters their measurements and generates in the wizard, like any project.
    onSuccess: (projectId) => router.push(`/pattern-studio/wizard/${projectId}`),
  });
  return {
    isLoading: query.isLoading,
    isError: query.isError,
    entries,
    visible,
    counts,
    filter,
    setFilter,
    search,
    setSearch,
    openPieces: entries.find((e) => e.id === openPiecesId) ?? null,
    showPieces: setOpenPiecesId,
    createFrom: (id: string) => create.mutate(id),
    creatingId: create.isPending ? (create.variables ?? null) : null,
    createError: create.isError,
  };
}
