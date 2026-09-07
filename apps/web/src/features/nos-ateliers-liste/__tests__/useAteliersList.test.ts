import { renderHook, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import type { AtelierDto } from '@angaly/types';

import { server } from '@/lib/msw/server';
import { withQueryClient } from '@/lib/test-utils';

import { useAteliersList } from '../hooks/useAteliersList';

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
    media: [],
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

describe('useAteliersList', () => {
  it('resolves the flagship atelier by slug without excluding it from the list', async () => {
    mockAteliers([
      makeAtelier(),
      makeAtelier({ id: 'atelier-2', slug: 'ivandry', name: 'Boutique & Retouches Ivandry' }),
    ]);

    const { result } = renderHook(() => useAteliersList(), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.flagship?.slug).toBe('antananarivo-centre');
    expect(result.current.ateliers.map((a) => a.slug)).toEqual(['antananarivo-centre', 'ivandry']);
  });

  it('has no flagship and an empty list when no atelier matches the designated slug', async () => {
    mockAteliers([makeAtelier({ id: 'atelier-2', slug: 'ivandry', name: 'Ivandry' })]);

    const { result } = renderHook(() => useAteliersList(), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.flagship).toBeNull();
    expect(result.current.ateliers).toHaveLength(1);
  });
});
