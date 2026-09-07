import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { AtelierDto } from '@angaly/types';

import { AtelierLocalSeoBlock } from '../ui/AtelierLocalSeoBlock';

const CLOSED = { isOpen: false, slots: [] };

function makeAtelier(overrides: Partial<AtelierDto> = {}): AtelierDto {
  return {
    id: 'atelier-1',
    slug: 'ivandry',
    name: 'Boutique & Retouches Ivandry',
    address: 'Centre Commercial La City, Ivandry',
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

describe('AtelierLocalSeoBlock', () => {
  it('templates the paragraph with the real atelier name and city, not a hardcoded one', () => {
    render(<AtelierLocalSeoBlock atelier={makeAtelier({ city: 'Toamasina' })} />);
    expect(screen.getByText(/Boutique & Retouches Ivandry/)).toBeInTheDocument();
    expect(screen.getByText(/cœur vibrant de Toamasina/)).toBeInTheDocument();
  });

  it('elides "de" to "d\'" before a vowel-starting city', () => {
    render(<AtelierLocalSeoBlock atelier={makeAtelier({ city: 'Antananarivo' })} />);
    expect(screen.getByText(/cœur vibrant d'Antananarivo/)).toBeInTheDocument();
  });
});
