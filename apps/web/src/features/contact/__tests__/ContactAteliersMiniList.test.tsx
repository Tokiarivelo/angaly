import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { AtelierDto } from '@angaly/types';

import { ContactAteliersMiniList } from '../ui/ContactAteliersMiniList';

const CLOSED = { isOpen: false, slots: [] };

function makeAtelier(overrides: Partial<AtelierDto> = {}): AtelierDto {
  return {
    id: 'atelier-1',
    slug: 'antananarivo-centre',
    name: 'Atelier Antananarivo Centre',
    address: "12 Rue de l'Artisanat, Ankorondrano",
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

describe('ContactAteliersMiniList', () => {
  it('renders every real atelier and a link to the full list', () => {
    render(
      <ContactAteliersMiniList
        ateliers={[makeAtelier(), makeAtelier({ id: 'atelier-2', slug: 'ivandry', name: 'Boutique Ivandry' })]}
      />,
    );

    expect(screen.getByText('Atelier Antananarivo Centre')).toBeInTheDocument();
    expect(screen.getByText('Boutique Ivandry')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Voir tous nos ateliers' })).toHaveAttribute('href', '/ateliers');
  });
});
