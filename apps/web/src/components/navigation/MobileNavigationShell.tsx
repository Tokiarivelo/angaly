import { MobileBottomBar } from './MobileBottomBar';
import { MobileDrawer } from './MobileDrawer';
import { MobileSearchOverlay } from './MobileSearchOverlay';
import { WhatsAppFab } from './WhatsAppFab';

/**
 * Mounted once from `(public)/layout.tsx`, alongside Header/Footer — orchestrates every
 * global mobile navigation surface. Each child self-manages its own visibility from the
 * shared `useMobileNavigationStore` (see docs/pages/navigation-mobile.md), so this shell is
 * pure composition, no logic of its own.
 */
export function MobileNavigationShell() {
  return (
    <>
      <MobileDrawer />
      <MobileSearchOverlay />
      <MobileBottomBar />
      <WhatsAppFab />
    </>
  );
}
