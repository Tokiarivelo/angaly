import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { useMobileNavigationStore } from '@/stores/mobile-navigation.store';
import { withQueryClient } from '@/lib/test-utils';

import { MobileBottomBar } from '../MobileBottomBar';

beforeEach(() => {
  useMobileNavigationStore.setState({ isDrawerOpen: false, isSearchOpen: false });
});

describe('MobileBottomBar', () => {
  it('renders all 5 destinations with the rendez-vous CTA raised and prominent', () => {
    render(<MobileBottomBar />, { wrapper: withQueryClient() });

    expect(screen.getByRole('link', { name: /Accueil/ })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Prendre rendez-vous' })).toHaveAttribute(
      'href',
      '/prendre-rendez-vous',
    );
    expect(screen.getByRole('link', { name: /Favoris/ })).toHaveAttribute('href', '/mes-favoris');
    expect(screen.getByRole('link', { name: /Compte/ })).toHaveAttribute('href', '/connexion');
  });

  it('marks the Accueil link as the current page on "/"', () => {
    render(<MobileBottomBar />, { wrapper: withQueryClient() });
    expect(screen.getByRole('link', { name: /Accueil/ })).toHaveAttribute('aria-current', 'page');
  });

  it('opens the search overlay when the search button is pressed', async () => {
    const user = userEvent.setup();
    render(<MobileBottomBar />, { wrapper: withQueryClient() });

    await user.click(screen.getByRole('button', { name: /Recherche/ }));

    expect(useMobileNavigationStore.getState().isSearchOpen).toBe(true);
  });
});
