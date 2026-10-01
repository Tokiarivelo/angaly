import { render, screen } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi } from 'vitest';
import { EspaceClientDashboardPage } from '../ui/EspaceClientDashboardPage';
import { createTestQueryClient } from '@/lib/test-utils';
import { OrderStatus, PatternStatus } from '@angaly/types';

vi.mock('../hooks/useDashboardSummary', () => ({
  useDashboardSummary: vi.fn(),
}));

vi.mock('../hooks/useRecentActivity', () => ({
  useRecentActivity: vi.fn(),
}));

import { useDashboardSummary } from '../hooks/useDashboardSummary';
import { useRecentActivity } from '../hooks/useRecentActivity';

describe('EspaceClientDashboardPage', () => {
  it('renders dashboard with empty hook data', () => {
    vi.mocked(useDashboardSummary).mockReturnValue({
      firstName: 'Toki',
      nextAppointment: null,
      currentOrder: null,
      premiumProject: null,
      notifications: [],
      isLoading: false,
    });
    vi.mocked(useRecentActivity).mockReturnValue({
      activities: [],
      isLoading: false,
    });

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <EspaceClientDashboardPage />
      </QueryClientProvider>,
    );
    expect(screen.getByText(/Bonjour, Toki/i)).toBeInTheDocument();
    expect(screen.getByText('Aucun rendez-vous')).toBeInTheDocument();
    expect(screen.getByText('Aucune commande')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /accès rapide/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /activité récente/i })).toBeInTheDocument();
  });

  it('renders dashboard with populated upcoming appointment, order, premium project and notifications', () => {
    vi.mocked(useDashboardSummary).mockReturnValue({
      firstName: 'Marie',
      nextAppointment: {
        id: 'apt-1',
        scheduledAt: '2026-10-15T11:00:00.000Z',
        atelierName: 'Atelier Principal Antananarivo',
        atelierAddress: '12 Rue de l\'Artisanat',
      },
      currentOrder: {
        id: 'ANG-2026-0042',
        status: OrderStatus.IN_PRODUCTION,
        createdAt: '2026-10-10T09:00:00.000Z',
      },
      premiumProject: {
        id: 'ANG-PAT-2026-00001',
        name: 'Robe de Soirée Sur-Mesure',
        status: PatternStatus.GENERATED,
      },
      notifications: [
        { id: 'notif-1', title: 'Nouveau message d\'Anna', message: 'Votre croquis est prêt' },
      ],
      isLoading: false,
    });
    vi.mocked(useRecentActivity).mockReturnValue({
      activities: [
        { date: 'Il y a 2h', title: 'Devis validé', description: 'Ref #ANG-DEV-2014', at: 1000 },
      ],
      isLoading: false,
    });

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <EspaceClientDashboardPage />
      </QueryClientProvider>,
    );

    expect(screen.getByText(/Bonjour, Marie/i)).toBeInTheDocument();
    expect(screen.getByText(/Atelier Principal Antananarivo/i)).toBeInTheDocument();
    expect(screen.getByText(/Commande #ANG-2026-0042/i)).toBeInTheDocument();
    expect(screen.getByText(/En confection/i)).toBeInTheDocument();
    expect(screen.getByText(/Robe de Soirée Sur-Mesure/i)).toBeInTheDocument();
    expect(screen.getByText(/Nouveau message d'Anna/i)).toBeInTheDocument();
    expect(screen.getByText(/Devis validé/i)).toBeInTheDocument();
  });
});
