import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { CreationAvailability, type CreationDto } from '@angaly/types';

import { QuickViewModal } from '../ui/QuickViewModal';

const CREATION: CreationDto = {
  id: 'c1',
  slug: 'robe-eternelle',
  name: 'Robe Éternelle',
  description: "L'incarnation du raffinement intemporel.",
  materials: null,
  techniques: null,
  availability: CreationAvailability.PIECE_UNIQUE,
  reproducible: true,
  isFeatured: false,
  featuredFrom: null,
  featuredUntil: null,
  category: { id: 'cat-1', slug: 'robes-de-mariee', name: 'Robes de mariée' },
  collection: { id: 'col-1', slug: 'collection-eternelle', name: 'Collection Éternelle' },
  media: [{ id: 'm1', url: 'https://cdn.example/1.jpg', altText: 'Vue de face', sortOrder: 0 }],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('QuickViewModal', () => {
  it('renders nothing when there is no active creation', () => {
    const { container } = render(<QuickViewModal creation={null} onClose={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the creation details and the collection — category badge', () => {
    render(<QuickViewModal creation={CREATION} onClose={vi.fn()} />);

    expect(screen.getByRole('heading', { level: 2, name: 'Robe Éternelle' })).toBeInTheDocument();
    expect(screen.getByText('Collection Éternelle — Robes de mariée')).toBeInTheDocument();
    expect(screen.getByText("L'incarnation du raffinement intemporel.")).toBeInTheDocument();
    expect(screen.getByAltText('Vue de face')).toBeInTheDocument();
  });

  it('falls back to the category name alone when there is no collection', () => {
    render(<QuickViewModal creation={{ ...CREATION, collection: null }} onClose={vi.fn()} />);
    expect(screen.getByText('Robes de mariée')).toBeInTheDocument();
  });

  it('links "Voir la création" to the detail page and calls onClose when clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<QuickViewModal creation={CREATION} onClose={onClose} />);

    const link = screen.getByRole('link', { name: 'Voir la création' });
    expect(link).toHaveAttribute('href', '/creations/robe-eternelle');

    await user.click(link);
    expect(onClose).toHaveBeenCalled();
  });

  it('toggles its own local favorite state', async () => {
    const user = userEvent.setup();
    render(<QuickViewModal creation={CREATION} onClose={vi.fn()} />);

    const favoriteButton = screen.getByRole('button', { name: 'Ajouter aux favoris' });
    expect(favoriteButton).toHaveAttribute('aria-pressed', 'false');

    await user.click(favoriteButton);
    expect(favoriteButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('calls onClose from the close button', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<QuickViewModal creation={CREATION} onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: "Fermer l'aperçu rapide" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
