import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { AtelierDto } from '@angaly/types';

import { FeaturedAtelierBanner } from '../ui/FeaturedAtelierBanner';

function makeAtelier(overrides: Partial<AtelierDto> = {}): AtelierDto {
  return {
    id: 'atelier-1',
    slug: 'antananarivo-centre',
    name: 'Atelier Antananarivo Centre',
    address: "12 Rue de l'Artisanat",
    city: 'Antananarivo',
    phone: null,
    openingHours: {
      monday: { isOpen: false, slots: [] },
      tuesday: { isOpen: false, slots: [] },
      wednesday: { isOpen: false, slots: [] },
      thursday: { isOpen: false, slots: [] },
      friday: { isOpen: false, slots: [] },
      saturday: { isOpen: false, slots: [] },
      sunday: { isOpen: false, slots: [] },
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

describe('FeaturedAtelierBanner', () => {
  it("renders the atelier's city in the headline and a rendez-vous CTA", () => {
    render(<FeaturedAtelierBanner atelier={makeAtelier({ city: 'Antananarivo' })} />);

    expect(screen.getByRole('heading', { name: 'Notre atelier principal — Antananarivo' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Prendre rendez-vous ici' })).toHaveAttribute(
      'href',
      '/prendre-rendez-vous',
    );
  });

  it('renders the real photo when media is present', () => {
    render(
      <FeaturedAtelierBanner
        atelier={makeAtelier({
          media: [{ id: 'm1', url: 'https://cdn.example/atelier.jpg', altText: 'Atelier principal', sortOrder: 0 }],
        })}
      />,
    );
    expect(screen.getByRole('img', { name: 'Atelier principal' })).toBeInTheDocument();
  });

  it('falls back to a gradient placeholder when there is no photo', () => {
    render(<FeaturedAtelierBanner atelier={makeAtelier({ media: [] })} />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
