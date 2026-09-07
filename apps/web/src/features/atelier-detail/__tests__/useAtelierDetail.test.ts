import { renderHook, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import type { AtelierDto } from '@angaly/types';

import { server } from '@/lib/msw/server';
import { withQueryClient } from '@/lib/test-utils';

import { useAtelierDetail } from '../hooks/useAtelierDetail';

const API_BASE_URL = 'http://localhost:3003/api';

const CLOSED = { isOpen: false, slots: [] };

function makeAtelier(overrides: Partial<AtelierDto> = {}): AtelierDto {
  return {
    id: 'atelier-1',
    slug: 'antananarivo-centre',
    name: 'Atelier Antananarivo Centre',
    address: "12 Rue de l'Artisanat, Ankorondrano",
    city: 'Antananarivo',
    phone: '+261 20 22 123 45',
    openingHours: {
      monday: { isOpen: true, slots: [{ open: '09:00', close: '18:00' }] },
      tuesday: { isOpen: true, slots: [{ open: '09:00', close: '18:00' }] },
      wednesday: { isOpen: true, slots: [{ open: '09:00', close: '18:00' }] },
      thursday: { isOpen: true, slots: [{ open: '09:00', close: '18:00' }] },
      friday: { isOpen: true, slots: [{ open: '09:00', close: '18:00' }] },
      saturday: { isOpen: true, slots: [{ open: '10:00', close: '17:00' }] },
      sunday: CLOSED,
    },
    services: ['Essayages', 'Consultations sur mesure', 'Retouches'],
    latitude: -18.8827,
    longitude: 47.5177,
    media: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('useAtelierDetail', () => {
  it('resolves the atelier matching the requested slug', async () => {
    server.use(
      http.get(`${API_BASE_URL}/ateliers/antananarivo-centre`, () =>
        HttpResponse.json({ success: true, data: makeAtelier() }),
      ),
    );

    const { result } = renderHook(() => useAtelierDetail('antananarivo-centre'), {
      wrapper: withQueryClient(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data?.slug).toBe('antananarivo-centre');
    expect(result.current.error).toBeNull();
  });

  it('surfaces a 404 as an error rather than throwing', async () => {
    server.use(
      http.get(`${API_BASE_URL}/ateliers/does-not-exist`, () =>
        HttpResponse.json(
          { success: false, error: { code: 'NOT_FOUND', message: 'Atelier not found' }, statusCode: 404 },
          { status: 404 },
        ),
      ),
    );

    const { result } = renderHook(() => useAtelierDetail('does-not-exist'), {
      wrapper: withQueryClient(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toBeUndefined();
    expect(result.current.error).not.toBeNull();
  });
});
