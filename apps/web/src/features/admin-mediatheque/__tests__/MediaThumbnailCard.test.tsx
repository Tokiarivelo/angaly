import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MediaEntityType } from '@angaly/types';

import type { MediaItemDto } from '../types/media-item.types';
import { MediaThumbnailCard } from '../ui/MediaThumbnailCard';

const MEDIA: MediaItemDto = {
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

describe('MediaThumbnailCard', () => {
  it('opens the detail panel when the thumbnail button is activated via keyboard', async () => {
    const onOpen = vi.fn();
    const user = userEvent.setup();
    render(<MediaThumbnailCard media={MEDIA} isSelected={false} onToggleSelect={vi.fn()} onOpen={onOpen} />);

    const openButton = screen.getByRole('button', { name: 'Ouvrir le détail de Robe éternelle' });
    openButton.focus();
    await user.keyboard('{Enter}');

    expect(onOpen).toHaveBeenCalled();
  });

  it('exposes the selection state via role="checkbox" and toggles it without opening the detail', async () => {
    const onToggleSelect = vi.fn();
    const onOpen = vi.fn();
    const user = userEvent.setup();
    render(<MediaThumbnailCard media={MEDIA} isSelected={false} onToggleSelect={onToggleSelect} onOpen={onOpen} />);

    const checkbox = screen.getByRole('checkbox', { name: 'Sélectionner Robe éternelle' });
    expect(checkbox).toHaveAttribute('aria-checked', 'false');

    await user.click(checkbox);

    expect(onToggleSelect).toHaveBeenCalled();
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('reflects isSelected via aria-checked', () => {
    render(<MediaThumbnailCard media={MEDIA} isSelected onToggleSelect={vi.fn()} onOpen={vi.fn()} />);
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'true');
  });

  it('shows the formatted file size', () => {
    render(<MediaThumbnailCard media={MEDIA} isSelected={false} onToggleSelect={vi.fn()} onOpen={vi.fn()} />);
    expect(screen.getByText('500 Ko')).toBeInTheDocument();
  });
});
