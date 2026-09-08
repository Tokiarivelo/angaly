import { useMobileNavigationStore } from '@/stores/mobile-navigation.store';

export function useMobileDrawer(): { isOpen: boolean; open: () => void; close: () => void } {
  const isOpen = useMobileNavigationStore((state) => state.isDrawerOpen);
  const open = useMobileNavigationStore((state) => state.openDrawer);
  const close = useMobileNavigationStore((state) => state.closeDrawer);
  return { isOpen, open, close };
}
