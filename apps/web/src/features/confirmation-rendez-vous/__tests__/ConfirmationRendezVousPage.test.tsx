import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '@/lib/msw/server';
import { createTestQueryClient } from '@/lib/test-utils';

import { ConfirmationRendezVousPage } from '../ui/ConfirmationRendezVousPage';
import { SAMPLE_APPOINTMENT } from '@/lib/msw/handlers/confirmation-rendez-vous.handlers';

const API_BASE_URL = 'http://localhost:3003/api';

describe('ConfirmationRendezVousPage', () => {
  it('renders the recap once the appointment has loaded', async () => {
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <ConfirmationRendezVousPage reference="ANG-RDV-2026-AbCdEfGh" />
      </QueryClientProvider>,
    );

    await waitFor(() => expect(screen.getByText('Votre rendez-vous est confirmé')).toBeInTheDocument());

    expect(screen.getByText('ANG-RDV-2026-AbCdEfGh')).toBeInTheDocument();
    expect(screen.getByText('Ajouter au calendrier')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'ANGALY' })).toBeInTheDocument();
  });

  it('shows the product/size context from `message` (e.g. an essayage booking) when present', async () => {
    server.use(
      http.get(`${API_BASE_URL}/appointments/:reference`, () =>
        HttpResponse.json({
          success: true,
          data: { ...SAMPLE_APPOINTMENT, message: 'Robe Solène — Taille 36 — Réf. RS-24-FW' },
        }),
      ),
    );
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <ConfirmationRendezVousPage reference="ANG-RDV-2026-AbCdEfGh" />
      </QueryClientProvider>,
    );

    await waitFor(() => expect(screen.getByText('Robe Solène — Taille 36 — Réf. RS-24-FW')).toBeInTheDocument());
  });
});
