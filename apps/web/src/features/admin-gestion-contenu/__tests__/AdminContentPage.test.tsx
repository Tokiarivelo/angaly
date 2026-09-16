import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { ContentStatus, Locale } from '@angaly/types';

import { withQueryClient } from '@/lib/test-utils';
import { apiClient } from '@/lib/api-client';

import { AdminContentPage } from '../ui/AdminContentPage';

vi.mock('@/lib/api-client');

const GROUPS = [
  {
    page: 'accueil',
    sections: [
      { sectionKey: 'hero', status: ContentStatus.DRAFT, updatedAt: '2026-01-01T00:00:00.000Z', locales: [Locale.FR] },
      { sectionKey: 'footer', status: ContentStatus.PUBLISHED, updatedAt: '2026-01-01T00:00:00.000Z', locales: [Locale.FR] },
    ],
  },
];

const HERO_SECTION = {
  id: 'section-1',
  page: 'accueil',
  sectionKey: 'hero',
  locale: Locale.FR,
  titleText: 'Bienvenue',
  subtitleText: null,
  bodyText: null,
  ctaPrimaryLabel: null,
  ctaSecondaryLabel: null,
  dataJson: null,
  mediaId: null,
  status: ContentStatus.DRAFT,
  updatedById: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('AdminContentPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiClient.get).mockImplementation((path: string) => {
      if (path === '/api/content/sections') return Promise.resolve(GROUPS);
      if (path === '/api/content/sections/accueil/hero') return Promise.resolve([HERO_SECTION]);
      return Promise.resolve([]);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads the editor for the selected section', async () => {
    const user = userEvent.setup();
    render(<AdminContentPage />, { wrapper: withQueryClient() });

    await waitFor(() => expect(screen.getByRole('button', { name: /hero/ })).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /hero/ }));

    await waitFor(() => expect(screen.getByLabelText('Titre')).toHaveValue('Bienvenue'));
  });

  it('warns before discarding unsaved edits when switching sections, and respects Cancel', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(<AdminContentPage />, { wrapper: withQueryClient() });

    await waitFor(() => expect(screen.getByRole('button', { name: /hero/ })).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /hero/ }));
    await waitFor(() => expect(screen.getByLabelText('Titre')).toHaveValue('Bienvenue'));

    await user.type(screen.getByLabelText('Titre'), '!');
    await user.click(screen.getByRole('button', { name: /footer/ }));

    expect(confirmSpy).toHaveBeenCalled();
    // Cancelled — still on "hero" with the edited value intact.
    expect(screen.getByLabelText('Titre')).toHaveValue('Bienvenue!');
  });

  it('switches sections once the discard is confirmed', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<AdminContentPage />, { wrapper: withQueryClient() });

    await waitFor(() => expect(screen.getByRole('button', { name: /hero/ })).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /hero/ }));
    await waitFor(() => expect(screen.getByLabelText('Titre')).toHaveValue('Bienvenue'));

    await user.type(screen.getByLabelText('Titre'), '!');
    await user.click(screen.getByRole('button', { name: /footer/ }));

    await waitFor(() => expect(apiClient.get).toHaveBeenCalledWith('/api/content/sections/accueil/footer'));
  });
});
