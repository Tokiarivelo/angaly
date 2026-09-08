import { render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useMobileNavigationStore } from '@/stores/mobile-navigation.store';
import { withQueryClient } from '@/lib/test-utils';

import { MobileNavigationShell } from '../MobileNavigationShell';

beforeEach(() => {
  useMobileNavigationStore.setState({ isDrawerOpen: false, isSearchOpen: false });
  vi.stubEnv('NEXT_PUBLIC_WHATSAPP_NUMBER', '261202212345');
});

describe('MobileNavigationShell', () => {
  it('mounts the bottom bar and WhatsApp FAB always, with the drawer/search closed by default', () => {
    render(<MobileNavigationShell />, { wrapper: withQueryClient() });

    expect(screen.getByRole('navigation', { name: 'Navigation mobile' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Contacter ANGALY sur WhatsApp' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Navigation principale' })).not.toBeInTheDocument();
  });

  it('opening the drawer via the store renders its own nav links', () => {
    useMobileNavigationStore.setState({ isDrawerOpen: true });
    render(<MobileNavigationShell />, { wrapper: withQueryClient() });

    const drawerNav = screen.getByRole('navigation', { name: 'Navigation principale' });
    expect(within(drawerNav).getByRole('link', { name: 'La Une' })).toBeInTheDocument();
  });
});
