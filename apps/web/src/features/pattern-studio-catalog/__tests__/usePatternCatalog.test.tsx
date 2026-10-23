import { describe, expect, it, vi, beforeEach } from 'vitest';
import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PatternCatalogEntryDto } from '@angaly/types';

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
vi.mock('../api/pattern-catalog.api', () => ({
  fetchPatternCatalog: vi.fn(),
  createProjectFromCatalog: vi.fn(),
}));

import { createProjectFromCatalog, fetchPatternCatalog } from '../api/pattern-catalog.api';
import { countByGroup, filterCatalog, usePatternCatalog } from '../hooks/usePatternCatalog';

const entry = (id: string, group: PatternCatalogEntryDto['group'], title: string, era = 'Moderne', notes = ''): PatternCatalogEntryDto => ({
  id,
  title,
  era,
  notes,
  group,
  garmentType: 'ROBE',
  pieceCount: 10,
  yardageM: 2.5,
  pieces: [],
  imageUrl: null,
  credit: null,
});
const ENTRIES = [
  entry('qipao', 'MODERNE', 'Qipao (cheongsam)', 'Shanghai 1930–1960', 'Col officier mandarin'),
  entry('tournure-1885', 'HISTORIQUE', 'Robe à tournure en lés', '1883–1888', 'Pouf sur tournure'),
  entry('mariee-bal', 'MARIEE', 'Robe de mariée de bal'),
];

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{children}</QueryClientProvider>
);

describe('catalogue filters', () => {
  it('filters by shelf and by words, accents ignored', () => {
    expect(filterCatalog(ENTRIES, 'HISTORIQUE', '').map((e) => e.id)).toEqual(['tournure-1885']);
    expect(filterCatalog(ENTRIES, 'TOUS', 'robe a tournure').map((e) => e.id)).toEqual(['tournure-1885']);
    expect(filterCatalog(ENTRIES, 'TOUS', 'mandarin 1930').map((e) => e.id)).toEqual(['qipao']);
    expect(filterCatalog(ENTRIES, 'MARIEE', 'qipao')).toEqual([]);
  });

  it('counts the dresses of each shelf', () => {
    expect(countByGroup(ENTRIES)).toEqual({ TOUS: 3, MODERNE: 1, HISTORIQUE: 1, MARIEE: 1 });
  });
});

describe('usePatternCatalog', () => {
  beforeEach(() => {
    vi.mocked(fetchPatternCatalog).mockResolvedValue(ENTRIES);
    vi.mocked(createProjectFromCatalog).mockResolvedValue('p-1');
    push.mockClear();
  });

  it('loads the catalogue, filters it, shows a dress’s pieces', async () => {
    const { result } = renderHook(() => usePatternCatalog(), { wrapper });
    await waitFor(() => expect(result.current.entries).toHaveLength(3));
    act(() => result.current.setFilter('MODERNE'));
    expect(result.current.visible.map((e) => e.id)).toEqual(['qipao']);
    act(() => result.current.showPieces('mariee-bal'));
    expect(result.current.openPieces?.id).toBe('mariee-bal');
    act(() => result.current.showPieces(null));
    expect(result.current.openPieces).toBeNull();
  });

  it('creates a project from a dress and opens the wizard on it', async () => {
    const { result } = renderHook(() => usePatternCatalog(), { wrapper });
    await waitFor(() => expect(result.current.entries).toHaveLength(3));
    act(() => result.current.createFrom('qipao'));
    await waitFor(() => expect(push).toHaveBeenCalledWith('/pattern-studio/wizard/p-1'));
    expect(vi.mocked(createProjectFromCatalog).mock.calls[0]![0]).toBe('qipao');
  });
});
