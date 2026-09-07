import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { AtelierDto } from '@angaly/types';

import { AtelierAmbianceGallery } from '../ui/AtelierAmbianceGallery';

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

describe('AtelierAmbianceGallery', () => {
  it('always renders the fixed decorative quote tile', () => {
    render(<AtelierAmbianceGallery atelier={makeAtelier()} />);
    expect(screen.getByText('Chaque détail est pensé, chaque couture est une signature.')).toBeInTheDocument();
  });

  it('renders 4 real photos without repeats when 4 distinct photos exist', () => {
    const media = [0, 1, 2, 3].map((i) => ({
      id: `m${i}`,
      url: `https://cdn.example/${i}.jpg`,
      altText: `Photo ${i}`,
      sortOrder: i,
    }));
    render(<AtelierAmbianceGallery atelier={makeAtelier({ media })} />);

    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(4);
    expect(new Set(images.map((img) => img.getAttribute('alt')))).toEqual(
      new Set(['Photo 0', 'Photo 1', 'Photo 2', 'Photo 3']),
    );
  });

  it('cycles through fewer photos to fill every real-photo slot', () => {
    render(
      <AtelierAmbianceGallery
        atelier={makeAtelier({
          media: [{ id: 'm1', url: 'https://cdn.example/only.jpg', altText: 'Seule photo', sortOrder: 0 }],
        })}
      />,
    );
    expect(screen.getAllByRole('img', { name: 'Seule photo' })).toHaveLength(4);
  });

  it('falls back to a decorative tile in every real-photo slot when there are no photos', () => {
    render(<AtelierAmbianceGallery atelier={makeAtelier({ media: [] })} />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
