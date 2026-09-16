import { render, screen } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi } from 'vitest';
import { EspaceClientDashboardPage } from '../ui/EspaceClientDashboardPage';
import { createTestQueryClient } from '@/lib/test-utils';

vi.mock('../hooks/useDashboardSummary', () => ({
  useDashboardSummary: () => ({
    firstName: 'Toki',
    nextAppointment: null,
    currentOrder: null,
    premiumProject: null,
    notifications: [],
    isLoading: false,
  }),
}));

vi.mock('../hooks/useRecentActivity', () => ({
  useRecentActivity: () => ({ activities: [], isLoading: false }),
}));

describe('EspaceClientDashboardPage', () => {
  it('renders dashboard with real hook data', () => {
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <EspaceClientDashboardPage />
      </QueryClientProvider>,
    );
    expect(screen.getByText(/Bonjour, Toki/i)).toBeInTheDocument();
    expect(screen.getByText('Aucun rendez-vous')).toBeInTheDocument();
    expect(screen.getByText('Accès rapide')).toBeInTheDocument();
  });
});
