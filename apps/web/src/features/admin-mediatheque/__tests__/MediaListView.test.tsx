import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MediaEntityType } from '@angaly/types';

import type { MediaItemDto } from '../types/media-item.types';
import { MediaListView } from '../ui/MediaListView';

const ITEMS: MediaItemDto[] = [
  {
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
  },
];

describe('MediaListView', () => {
  it('renders one row per item with its name and size', () => {
    render(<MediaListView items={ITEMS} selectedIds={new Set()} onToggleSelect={vi.fn()} onOpen={vi.fn()} />);

    expect(screen.getByText('Robe éternelle')).toBeInTheDocument();
    expect(screen.getByText('500 Ko')).toBeInTheDocument();
  });

  it('opens the detail panel when a row is clicked', async () => {
    const onOpen = vi.fn();
    const user = userEvent.setup();
    render(<MediaListView items={ITEMS} selectedIds={new Set()} onToggleSelect={vi.fn()} onOpen={onOpen} />);

    await user.click(screen.getByRole('button', { name: 'Ouvrir le détail de Robe éternelle' }));

    expect(onOpen).toHaveBeenCalledWith('media-1');
  });

  it('toggles selection without opening the detail panel', async () => {
    const onToggleSelect = vi.fn();
    const onOpen = vi.fn();
    const user = userEvent.setup();
    render(<MediaListView items={ITEMS} selectedIds={new Set()} onToggleSelect={onToggleSelect} onOpen={onOpen} />);

    await user.click(screen.getByRole('checkbox', { name: 'Sélectionner Robe éternelle' }));

    expect(onToggleSelect).toHaveBeenCalledWith('media-1');
    expect(onOpen).not.toHaveBeenCalled();
  });
});
