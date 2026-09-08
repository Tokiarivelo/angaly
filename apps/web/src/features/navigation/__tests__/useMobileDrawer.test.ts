import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { useMobileNavigationStore } from '@/stores/mobile-navigation.store';

import { useMobileDrawer } from '../hooks/useMobileDrawer';

beforeEach(() => {
  useMobileNavigationStore.setState({ isDrawerOpen: false, isSearchOpen: false });
});

describe('useMobileDrawer', () => {
  it('starts closed', () => {
    const { result } = renderHook(() => useMobileDrawer());
    expect(result.current.isOpen).toBe(false);
  });

  it('opens and closes via the shared store', () => {
    const { result } = renderHook(() => useMobileDrawer());

    act(() => result.current.open());
    expect(result.current.isOpen).toBe(true);

    act(() => result.current.close());
    expect(result.current.isOpen).toBe(false);
  });

  it('opening the drawer closes the search overlay (mutually exclusive)', () => {
    useMobileNavigationStore.setState({ isSearchOpen: true });
    const { result } = renderHook(() => useMobileDrawer());

    act(() => result.current.open());

    expect(useMobileNavigationStore.getState().isSearchOpen).toBe(false);
  });
});
