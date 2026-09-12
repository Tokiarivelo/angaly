import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MesRendezVousPage } from '../ui/MesRendezVousPage';

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
  }),
}));

describe('MesRendezVousPage', () => {
  it('renders page correctly', () => {
    render(<MesRendezVousPage />);
    expect(screen.getByText('Mes rendez-vous')).toBeInTheDocument();
    expect(screen.getByText('Prendre un rendez-vous')).toBeInTheDocument();
    expect(screen.getByText('RDV-TEST-001')).toBeInTheDocument();
  });
});
