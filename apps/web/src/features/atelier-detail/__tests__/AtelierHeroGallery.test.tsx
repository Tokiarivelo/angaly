import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { AtelierDto } from '@angaly/types';

import { AtelierHeroGallery } from '../ui/AtelierHeroGallery';

const CLOSED = { isOpen: false, slots: [] };

function makeAtelier(overrides: Partial<AtelierDto> = {}): AtelierDto {
  return {
    id: 'atelier-1',
    slug: 'antananarivo-centre',
    name: 'Atelier Antananarivo Centre',
    address: "12 Rue de l'Artisanat",
    city: 'Antananarivo',
    phone: null,
    openingHours: {
      monday: CLOSED,
      tuesday: CLOSED,
      wednesday: CLOSED,
      thursday: CLOSED,
      friday: CLOSED,
      saturday: CLOSED,
      sunday: CLOSED,
    },
    services: [],
    latitude: null,
    longitude: null,
    media: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('AtelierHeroGallery', () => {
  it('renders the atelier name as the h1 and the fixed decorative "précision" tile', () => {
    render(<AtelierHeroGallery atelier={makeAtelier()} />);
    expect(screen.getByRole('heading', { level: 1, name: 'Atelier Antananarivo Centre' })).toBeInTheDocument();
    expect(screen.getByText("L'art de la précision")).toBeInTheDocument();
  });

  it('renders both real photos when at least two exist', () => {
    render(
      <AtelierHeroGallery
        atelier={makeAtelier({
          media: [
            { id: 'm1', url: 'https://cdn.example/large.jpg', altText: 'Grande photo', sortOrder: 0 },
            { id: 'm2', url: 'https://cdn.example/small.jpg', altText: 'Petite photo', sortOrder: 1 },
          ],
        })}
      />,
    );
    expect(screen.getByRole('img', { name: 'Grande photo' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Petite photo' })).toBeInTheDocument();
  });

  it('does not duplicate the single photo into the second slot', () => {
    render(
      <AtelierHeroGallery
        atelier={makeAtelier({
          media: [{ id: 'm1', url: 'https://cdn.example/large.jpg', altText: 'Grande photo', sortOrder: 0 }],
        })}
      />,
    );
    expect(screen.getAllByRole('img')).toHaveLength(1);
  });

  it('falls back to decorative tiles in both photo slots when there are no photos at all', () => {
    render(<AtelierHeroGallery atelier={makeAtelier({ media: [] })} />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('Notre savoir-faire')).toBeInTheDocument();
  });
});
