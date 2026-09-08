import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { useMobileNavigationStore } from '@/stores/mobile-navigation.store';

import { Header } from '../Header';

beforeEach(() => {
  useMobileNavigationStore.setState({ isDrawerOpen: false, isSearchOpen: false });
});

/**
 * Only the new mobile menu/search trigger buttons this session added — the pre-existing
 * desktop nav behavior isn't covered here (untested before this change, out of scope).
 */
describe('Header (mobile navigation triggers)', () => {
  it('opens the shared mobile drawer state when the menu button is pressed', async () => {
    const user = userEvent.setup();
    render(<Header />);

    await user.click(screen.getByRole('button', { name: 'Ouvrir le menu' }));

    expect(useMobileNavigationStore.getState().isDrawerOpen).toBe(true);
  });

  it('opens the shared search overlay state when the search button is pressed', async () => {
    const user = userEvent.setup();
    render(<Header />);

    await user.click(screen.getByRole('button', { name: 'Rechercher' }));

    expect(useMobileNavigationStore.getState().isSearchOpen).toBe(true);
  });
});
