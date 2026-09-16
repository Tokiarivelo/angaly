import { render, screen } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi } from 'vitest';
import { MesRendezVousPage } from '../ui/MesRendezVousPage';
import { createTestQueryClient } from '@/lib/test-utils';

vi.mock('../hooks/useMyAppointments', () => ({
  useMyAppointments: () => ({
    appointments: [
      {
        id: '1',
        reference: 'RDV-TEST-001',
        type: 'Prise de mesures',
        atelierName: 'Atelier ANGALY',
        atelierAddress: 'Analakely',
        scheduledAt: '2026-09-24T14:30:00Z',
        status: 'CONFIRMED',
      }
    ],
    filter: 'upcoming',
    setFilter: vi.fn(),
    isLoading: false,
    isError: false,
  }),
}));

describe('MesRendezVousPage', () => {
  it('renders page correctly', () => {
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MesRendezVousPage />
      </QueryClientProvider>,
    );
    expect(screen.getByText('Mes rendez-vous')).toBeInTheDocument();
    expect(screen.getByText('Prendre un rendez-vous')).toBeInTheDocument();
    expect(screen.getByText('RDV-TEST-001')).toBeInTheDocument();
  });
});
