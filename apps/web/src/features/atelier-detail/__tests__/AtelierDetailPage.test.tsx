import { render, screen, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import type { AtelierDto } from '@angaly/types';

import { server } from '@/lib/msw/server';
import { withQueryClient } from '@/lib/test-utils';

import { AtelierDetailPage } from '../ui/AtelierDetailPage';

const API_BASE_URL = 'http://localhost:3003/api';

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
      sunday: { isOpen: false, slots: [] },
    },
    services: ['Essayages', 'Retouches'],
    latitude: -18.8827,
    longitude: 47.5177,
    media: [{ id: 'm1', url: 'https://cdn.example/cover.jpg', altText: 'Photo atelier', sortOrder: 0 }],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('AtelierDetailPage', () => {
  it('renders the breadcrumb, hero, info panel, and ambiance gallery with real data', async () => {
    server.use(
      http.get(`${API_BASE_URL}/ateliers/antananarivo-centre`, () =>
        HttpResponse.json({ success: true, data: makeAtelier() }),
      ),
    );

    const Wrapper = withQueryClient();
    render(<AtelierDetailPage slug="antananarivo-centre" />, { wrapper: Wrapper });

    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1, name: 'Atelier Antananarivo Centre' })).toBeInTheDocument(),
    );

    expect(screen.getByRole('link', { name: 'Ateliers' })).toHaveAttribute('href', '/ateliers');
    expect(screen.getByText('Informations Pratiques')).toBeInTheDocument();
    expect(screen.getByText("L'atelier en images")).toBeInTheDocument();
    expect(screen.getByText(/cœur vibrant/)).toBeInTheDocument();
  });

  it('never renders a "Nos Artisans" team section (no Prisma model to back it)', async () => {
    server.use(
      http.get(`${API_BASE_URL}/ateliers/antananarivo-centre`, () =>
        HttpResponse.json({ success: true, data: makeAtelier() }),
      ),
    );

    const Wrapper = withQueryClient();
    render(<AtelierDetailPage slug="antananarivo-centre" />, { wrapper: Wrapper });

    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1, name: 'Atelier Antananarivo Centre' })).toBeInTheDocument(),
    );

    expect(screen.queryByText('Nos Artisans')).not.toBeInTheDocument();
  });

  it('shows a not-found state with a link back to the ateliers list on error', async () => {
    server.use(
      http.get(`${API_BASE_URL}/ateliers/unknown-slug`, () =>
        HttpResponse.json(
          { success: false, error: { code: 'NOT_FOUND', message: 'Atelier not found' }, statusCode: 404 },
          { status: 404 },
        ),
      ),
    );

    const Wrapper = withQueryClient();
    render(<AtelierDetailPage slug="unknown-slug" />, { wrapper: Wrapper });

    await waitFor(() => expect(screen.getByText('Cet atelier est introuvable.')).toBeInTheDocument());
    expect(screen.getByRole('link', { name: 'Retour à nos ateliers' })).toHaveAttribute('href', '/ateliers');
  });
});
