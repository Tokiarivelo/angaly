import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MediaEntityType } from '@angaly/types';

import { withQueryClient } from '@/lib/test-utils';
import { apiClient } from '@/lib/api-client';

import { AdminMediathequePage } from '../ui/AdminMediathequePage';

vi.mock('@/lib/api-client');

const SAMPLE_MEDIA = {
  id: 'media-1',
  url: 'http://localhost:9000/creations/abc.jpg',
  altText: 'Robe éternelle',
  mimeType: 'image/jpeg',
  sizeBytes: 512_000,
  width: 800,
  height: 600,
  entityType: MediaEntityType.CREATION,
  entityId: 'creation-1',
  sortOrder: 0,
  createdAt: '2026-01-01T00:00:00.000Z',
};

function paginated(items: (typeof SAMPLE_MEDIA)[]) {
  return {
    data: items,
    meta: { total: items.length, page: 1, limit: 40, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
  };
}

describe('AdminMediathequePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the media grid from the library query', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(paginated([SAMPLE_MEDIA]));

    render(<AdminMediathequePage />, { wrapper: withQueryClient() });

    await waitFor(() => expect(screen.getByText('Robe éternelle')).toBeInTheDocument());
  });

  it('shows the upload prompt when the library is genuinely empty', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(paginated([]));

    render(<AdminMediathequePage />, { wrapper: withQueryClient() });

    await waitFor(() =>
      expect(screen.getByText('Glissez vos fichiers ici ou cliquez pour importer')).toBeInTheDocument(),
    );
  });

  it('shows a reset-filters state, not the upload prompt, when a search matches nothing', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(paginated([]));
    const user = userEvent.setup();

    render(<AdminMediathequePage />, { wrapper: withQueryClient() });

    await user.type(screen.getByLabelText('Rechercher un fichier'), 'introuvable');

    await waitFor(() =>
      expect(screen.getByText('Aucun média ne correspond à ces filtres')).toBeInTheDocument(),
    );
    expect(screen.queryByText('Glissez vos fichiers ici ou cliquez pour importer')).not.toBeInTheDocument();
  });

  it('asks for confirmation before bulk-deleting the selected media', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(paginated([SAMPLE_MEDIA]));
    vi.mocked(apiClient.delete).mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(<AdminMediathequePage />, { wrapper: withQueryClient() });

    await waitFor(() => expect(screen.getByText('Robe éternelle')).toBeInTheDocument());
    await user.click(screen.getByRole('checkbox', { name: 'Sélectionner Robe éternelle' }));

    expect(screen.getByText('1 fichier sélectionné')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Supprimer' }));

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('Supprimer 1 fichier ?');

    await user.click(within(dialog).getByRole('button', { name: 'Supprimer' }));

    await waitFor(() => expect(apiClient.delete).toHaveBeenCalledWith('/api/media/media-1'));
  });
});
