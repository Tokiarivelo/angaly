import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useMobileNavigationStore } from '@/stores/mobile-navigation.store';

import { useMobileSearchOverlay } from '../hooks/useMobileSearchOverlay';

beforeEach(() => {
  useMobileNavigationStore.setState({ isDrawerOpen: false, isSearchOpen: false });
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useMobileSearchOverlay', () => {
  it('starts closed with an empty query', () => {
    const { result } = renderHook(() => useMobileSearchOverlay());
    expect(result.current.isOpen).toBe(false);
    expect(result.current.query).toBe('');
    expect(result.current.debouncedQuery).toBe('');
  });

  it('debounces the query before updating debouncedQuery', async () => {
    const { result } = renderHook(() => useMobileSearchOverlay());

    act(() => result.current.setQuery('robe'));
    expect(result.current.debouncedQuery).toBe('');

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current.debouncedQuery).toBe('robe');
  });

  it('clears both the raw and debounced query on close', async () => {
    const { result } = renderHook(() => useMobileSearchOverlay());

    act(() => {
      result.current.open();
      result.current.setQuery('robe');
    });
    await act(async () => vi.advanceTimersByTime(300));
    expect(result.current.debouncedQuery).toBe('robe');

    act(() => result.current.close());

    expect(result.current.isOpen).toBe(false);
    expect(result.current.query).toBe('');
    expect(result.current.debouncedQuery).toBe('');
  });

  it('opening the search overlay closes the drawer (mutually exclusive)', () => {
    useMobileNavigationStore.setState({ isDrawerOpen: true });
    const { result } = renderHook(() => useMobileSearchOverlay());

    act(() => result.current.open());

    expect(useMobileNavigationStore.getState().isDrawerOpen).toBe(false);
  });
});
