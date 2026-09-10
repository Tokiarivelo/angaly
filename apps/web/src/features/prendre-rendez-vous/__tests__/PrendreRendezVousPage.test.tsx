import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { createTestQueryClient } from '@/lib/test-utils';

import { PrendreRendezVousPage } from '../ui/PrendreRendezVousPage';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/prendre-rendez-vous',
  useSearchParams: () => new URLSearchParams(),
}));

describe('PrendreRendezVousPage', () => {
  it('renders the booking form heading and the 7 creation-type chips', () => {
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <PrendreRendezVousPage />
      </QueryClientProvider>,
    );

    expect(screen.getByRole('heading', { name: 'Prendre rendez-vous' })).toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: 'Type de création' })).toBeInTheDocument();
    expect(screen.getByText('Costume')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Confirmer le rendez-vous/i }).length).toBeGreaterThan(0);
  });
});
