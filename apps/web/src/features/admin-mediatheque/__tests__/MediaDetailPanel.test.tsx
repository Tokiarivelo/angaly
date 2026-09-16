import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MediaEntityType } from '@angaly/types';

import type { MediaDetailDto } from '../types/media-item.types';
import { MediaDetailPanel } from '../ui/MediaDetailPanel';

function makeMedia(overrides: Partial<MediaDetailDto> = {}): MediaDetailDto {
  return {
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
    usedIn: [],
    ...overrides,
  };
}

const NOOP_PROPS = {
  isLoading: false,
  onClose: vi.fn(),
  onSaveAltText: vi.fn(),
  isSavingAltText: false,
  onReplace: vi.fn(),
  isReplacing: false,
  isDeleting: false,
  deleteErrorMessage: null,
};

describe('MediaDetailPanel', () => {
  it('asks for confirmation before actually deleting an unreferenced media', async () => {
    const onDelete = vi.fn();
    const user = userEvent.setup();
    render(<MediaDetailPanel {...NOOP_PROPS} media={makeMedia()} onDelete={onDelete} />);

    await user.click(screen.getByRole('button', { name: 'Supprimer' }));

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: 'Supprimer ce média ?' })).toBeInTheDocument();
    expect(onDelete).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole('button', { name: 'Supprimer' }));

    expect(onDelete).toHaveBeenCalled();
  });

  it('disables delete and explains why when the media is still referenced', () => {
    render(
      <MediaDetailPanel
        {...NOOP_PROPS}
        media={makeMedia({ usedIn: [{ entityType: 'CREATION', entityId: 'creation-1', label: 'Robe Éternelle' }] })}
        onDelete={vi.fn()}
      />,
    );

    const deleteButton = screen.getByRole('button', { name: 'Supprimer' });
    expect(deleteButton).toBeDisabled();
    expect(deleteButton).toHaveAttribute('aria-describedby', 'media-usage-heading');
    expect(screen.getByText('Robe Éternelle')).toBeInTheDocument();
  });

  it('closes when Escape is pressed', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<MediaDetailPanel {...NOOP_PROPS} media={makeMedia()} onDelete={vi.fn()} onClose={onClose} />);

    await user.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalled();
  });

  it('renders a loading skeleton instead of the panel content', () => {
    render(<MediaDetailPanel {...NOOP_PROPS} isLoading media={null} onDelete={vi.fn()} />);
    expect(screen.queryByText('Détail du média')).not.toBeInTheDocument();
  });
});
