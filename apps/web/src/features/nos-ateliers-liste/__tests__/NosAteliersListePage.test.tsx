import { render, screen, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import type { AtelierDto } from '@angaly/types';

import { server } from '@/lib/msw/server';
import { withQueryClient } from '@/lib/test-utils';

import { NosAteliersListePage } from '../ui/NosAteliersListePage';

const API_BASE_URL = 'http://localhost:3003/api';

const WEEKDAY_HOURS = { isOpen: true, slots: [{ open: '09:00', close: '18:00' }] };
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
      monday: WEEKDAY_HOURS,
      tuesday: WEEKDAY_HOURS,
      wednesday: WEEKDAY_HOURS,
      thursday: WEEKDAY_HOURS,
      friday: WEEKDAY_HOURS,
      saturday: { isOpen: true, slots: [{ open: '09:00', close: '13:00' }] },
      sunday: CLOSED,
    },
    services: ['Essayage', 'Consultation', 'Retouche'],
    latitude: -18.8827,
    longitude: 47.5177,
    media: [{ id: 'media-1', url: 'https://cdn.example/atelier.jpg', altText: 'Atelier', sortOrder: 0 }],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function mockAteliers(ateliers: AtelierDto[]) {
  server.use(
    http.get(`${API_BASE_URL}/ateliers`, () => HttpResponse.json({ success: true, data: ateliers })),
  );
}

describe('NosAteliersListePage', () => {
  it('renders the header, featured banner, map, and list with real data', async () => {
    mockAteliers([
      makeAtelier(),
      makeAtelier({
        id: 'atelier-2',
        slug: 'ivandry',
        name: 'Boutique & Retouches Ivandry',
        media: [],
        openingHours: {
          monday: WEEKDAY_HOURS,
          tuesday: WEEKDAY_HOURS,
          wednesday: WEEKDAY_HOURS,
          thursday: WEEKDAY_HOURS,
          friday: WEEKDAY_HOURS,
          saturday: WEEKDAY_HOURS,
          sunday: CLOSED,
        },
      }),
    ]);

    const Wrapper = withQueryClient();
    render(<NosAteliersListePage />, { wrapper: Wrapper });

    expect(screen.getByRole('heading', { level: 1, name: 'Nos Ateliers' })).toBeInTheDocument();

    await waitFor(() =>
      expect(screen.getByText('Notre atelier principal — Antananarivo')).toBeInTheDocument(),
    );

    expect(screen.getByRole('heading', { name: 'Atelier Antananarivo Centre (Flagship)' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Boutique & Retouches Ivandry' })).toBeInTheDocument();
    expect(screen.getByText('Lun - Ven : 09h00 - 18h00')).toBeInTheDocument();
    expect(screen.getByText('Sam : 09h00 - 13h00')).toBeInTheDocument();
    expect(screen.getAllByText('Itinéraire')).toHaveLength(2);
  });

  it('hides the featured banner and map/list section when there are no ateliers', async () => {
    mockAteliers([]);

    const Wrapper = withQueryClient();
    render(<NosAteliersListePage />, { wrapper: Wrapper });

    await waitFor(() => expect(screen.queryByText('Itinéraire')).not.toBeInTheDocument());
    expect(screen.queryByText('Notre atelier principal — Antananarivo')).not.toBeInTheDocument();
  });
});
