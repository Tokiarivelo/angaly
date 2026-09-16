import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { useMobileNavigationStore } from '@/stores/mobile-navigation.store';
import { withQueryClient } from '@/lib/test-utils';

import { MobileDrawer } from '../MobileDrawer';

beforeEach(() => {
  useMobileNavigationStore.setState({ isDrawerOpen: false, isSearchOpen: false });
});

describe('MobileDrawer', () => {
  it('renders nothing when closed', () => {
    render(<MobileDrawer />, { wrapper: withQueryClient() });
    expect(screen.queryByRole('link', { name: 'Accueil' })).not.toBeInTheDocument();
  });

  it('renders every real nav link, the Premium badge, and the rendez-vous CTA when open', () => {
    useMobileNavigationStore.setState({ isDrawerOpen: true });
    render(<MobileDrawer />, { wrapper: withQueryClient() });

    expect(screen.getByRole('link', { name: 'Accueil' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: /Patron Premium/ })).toBeInTheDocument();
    expect(screen.getByText('Premium')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Prendre rendez-vous' })).toHaveAttribute(
      'href',
      '/prendre-rendez-vous',
    );
  });

  it('closes on the close button', async () => {
    useMobileNavigationStore.setState({ isDrawerOpen: true });
    const user = userEvent.setup();
    render(<MobileDrawer />, { wrapper: withQueryClient() });

    await user.click(screen.getByRole('button', { name: 'Fermer le menu' }));

    expect(useMobileNavigationStore.getState().isDrawerOpen).toBe(false);
  });

  it('clicking "Rechercher" closes the drawer and opens the search overlay', async () => {
    useMobileNavigationStore.setState({ isDrawerOpen: true });
    const user = userEvent.setup();
    render(<MobileDrawer />, { wrapper: withQueryClient() });

    await user.click(screen.getByRole('button', { name: 'Rechercher' }));

    expect(useMobileNavigationStore.getState().isDrawerOpen).toBe(false);
    expect(useMobileNavigationStore.getState().isSearchOpen).toBe(true);
  });

  it('clicking a nav link closes the drawer', async () => {
    useMobileNavigationStore.setState({ isDrawerOpen: true });
    const user = userEvent.setup();
    render(<MobileDrawer />, { wrapper: withQueryClient() });

    await user.click(screen.getByRole('link', { name: 'La Une' }));

    expect(useMobileNavigationStore.getState().isDrawerOpen).toBe(false);
  });
});
