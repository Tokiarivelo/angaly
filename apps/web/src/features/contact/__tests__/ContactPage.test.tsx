import { render, screen, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import type { AtelierDto } from '@angaly/types';

import { server } from '@/lib/msw/server';
import { withQueryClient } from '@/lib/test-utils';

import { ContactPage } from '../ui/ContactPage';

const API_BASE_URL = 'http://localhost:3003/api';

function makeAtelier(overrides: Partial<AtelierDto> = {}): AtelierDto {
  return {
    id: 'atelier-1',
    slug: 'antananarivo-centre',
    name: 'Atelier Antananarivo Centre',
    address: "12 Rue de l'Artisanat, Ankorondrano",
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

describe('ContactPage', () => {
  it('renders the header, channels, real ateliers mini-list, form, and map', async () => {
    server.use(
      http.get(`${API_BASE_URL}/ateliers`, () => HttpResponse.json({ success: true, data: [makeAtelier()] })),
    );

    const Wrapper = withQueryClient();
    render(<ContactPage />, { wrapper: Wrapper });

    expect(screen.getByRole('heading', { level: 1, name: 'Contactez-nous' })).toBeInTheDocument();
    expect(screen.getByText('Nous joindre')).toBeInTheDocument();
    expect(screen.getByText('Écrivez-nous')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Ateliers ANGALY' })).toBeInTheDocument();

    await waitFor(() => expect(screen.getByText('Atelier Antananarivo Centre')).toBeInTheDocument());
  });

  it('never renders a floating WhatsApp button (the real screen has none, only an inline link)', () => {
    server.use(http.get(`${API_BASE_URL}/ateliers`, () => HttpResponse.json({ success: true, data: [] })));

    const Wrapper = withQueryClient();
    render(<ContactPage />, { wrapper: Wrapper });

    expect(screen.getAllByRole('link', { name: 'Message WhatsApp' })).toHaveLength(1);
  });

  it('hides the mini-list section when there are no real ateliers', async () => {
    server.use(http.get(`${API_BASE_URL}/ateliers`, () => HttpResponse.json({ success: true, data: [] })));

    const Wrapper = withQueryClient();
    render(<ContactPage />, { wrapper: Wrapper });

    await waitFor(() => expect(screen.queryByText('Nos Ateliers')).not.toBeInTheDocument());
  });
});
