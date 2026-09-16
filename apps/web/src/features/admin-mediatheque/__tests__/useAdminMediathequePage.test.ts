import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MediaEntityType } from '@angaly/types';

import { useAdminMediathequePage } from '../hooks/useAdminMediathequePage';
import { withQueryClient } from '@/lib/test-utils';
import { apiClient } from '@/lib/api-client';

vi.mock('@/lib/api-client');

const SAMPLE_MEDIA = {
  id: 'media-1',
  url: 'http://localhost:9000/creations/abc.jpg',
  altText: 'Robe éternelle',
  mimeType: 'image/jpeg',
  sizeBytes: 1024,
  width: 800,
  height: 600,
  entityType: MediaEntityType.CREATION,
  entityId: 'creation-1',
  sortOrder: 0,
  createdAt: '2026-01-01T00:00:00.000Z',
};

function mockLibraryResponse(items: (typeof SAMPLE_MEDIA)[] = [SAMPLE_MEDIA]) {
  vi.mocked(apiClient.get).mockResolvedValue({
    data: items,
    meta: { total: items.length, page: 1, limit: 40, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
  });
}

describe('useAdminMediathequePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debounces the search value before it reaches the library query', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockLibraryResponse();

    const { result } = renderHook(() => useAdminMediathequePage(), { wrapper: withQueryClient() });
    await waitFor(() => expect(result.current.library.isSuccess).toBe(true));
    vi.mocked(apiClient.get).mockClear();

    act(() => {
      result.current.setSearch('robe');
    });
    // Immediately visible in the input value...
    expect(result.current.search).toBe('robe');
    // ...but no new fetch until the debounce window elapses.
    expect(apiClient.get).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    await waitFor(() => expect(apiClient.get).toHaveBeenCalledWith(expect.stringContaining('search=robe')));
    vi.useRealTimers();
  });

  it('changeFolder resets the page back to 1', async () => {
    mockLibraryResponse();
    const { result } = renderHook(() => useAdminMediathequePage(), { wrapper: withQueryClient() });
    await waitFor(() => expect(result.current.library.isSuccess).toBe(true));

    act(() => {
      result.current.setPage(3);
    });
    expect(result.current.page).toBe(3);

    act(() => {
      result.current.changeFolder('produits');
    });

    expect(result.current.folderId).toBe('produits');
    expect(result.current.page).toBe(1);
  });

  it('resetFilters clears folder and search back to defaults', async () => {
    mockLibraryResponse();
    const { result } = renderHook(() => useAdminMediathequePage(), { wrapper: withQueryClient() });
    await waitFor(() => expect(result.current.library.isSuccess).toBe(true));

    act(() => {
      result.current.changeFolder('produits');
      result.current.setSearch('robe');
    });

    act(() => {
      result.current.resetFilters();
    });

    expect(result.current.folderId).toBe('toutes');
    expect(result.current.search).toBe('');
  });

  it('hasActiveFilters is true only when a folder or search is active', async () => {
    mockLibraryResponse();
    const { result } = renderHook(() => useAdminMediathequePage(), { wrapper: withQueryClient() });
    await waitFor(() => expect(result.current.library.isSuccess).toBe(true));

    expect(result.current.hasActiveFilters).toBe(false);

    act(() => {
      result.current.changeFolder('produits');
    });
    expect(result.current.hasActiveFilters).toBe(true);
  });

  it('confirmBulkDelete deletes every selected id and clears the selection', async () => {
    mockLibraryResponse();
    vi.mocked(apiClient.delete).mockResolvedValue(undefined);

    const { result } = renderHook(() => useAdminMediathequePage(), { wrapper: withQueryClient() });
    await waitFor(() => expect(result.current.library.isSuccess).toBe(true));

    act(() => {
      result.current.selection.toggle('media-1');
    });
    expect(result.current.selection.count).toBe(1);

    act(() => {
      result.current.confirmBulkDelete();
    });

    await waitFor(() => expect(apiClient.delete).toHaveBeenCalledWith('/api/media/media-1'));
    expect(result.current.selection.count).toBe(0);
  });
});
