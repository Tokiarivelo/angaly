import { create } from 'zustand';

/**
 * Shared open/closed UI state for the mobile drawer and search overlay —
 * plain (non-persisted) Zustand so the header's trigger buttons and the
 * overlay components mounted from `MobileNavigationShell` (a layout-level
 * sibling, not a parent/child of Header) can read/mutate the same state
 * without prop drilling across that boundary.
 */
interface MobileNavigationState {
  isDrawerOpen: boolean;
  isSearchOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  openSearch: () => void;
  closeSearch: () => void;
}

export const useMobileNavigationStore = create<MobileNavigationState>()((set) => ({
  isDrawerOpen: false,
  isSearchOpen: false,
  openDrawer: () => set({ isDrawerOpen: true, isSearchOpen: false }),
  closeDrawer: () => set({ isDrawerOpen: false }),
  openSearch: () => set({ isSearchOpen: true, isDrawerOpen: false }),
  closeSearch: () => set({ isSearchOpen: false }),
}));
