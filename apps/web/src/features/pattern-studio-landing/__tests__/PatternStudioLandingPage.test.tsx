import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PatternStudioLandingPage } from '../ui/PatternStudioLandingPage';
import { withQueryClient } from '@/lib/test-utils';
import { apiClient } from '@/lib/api-client';

vi.mock('@/lib/api-client');
vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: { user: { id: 'user-1' } }, status: 'authenticated' }),
  getSession: () => Promise.resolve({ user: { id: 'user-1' } }),
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe('PatternStudioLandingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiClient.get).mockResolvedValue([]);
  });

  it('renders headline, hero, steps, pricing and CTA', () => {
    render(<PatternStudioLandingPage />, { wrapper: withQueryClient() });

    expect(screen.getByText('Angaly Pattern Studio')).toBeInTheDocument();
    expect(screen.getByText('Votre patron, créé selon vos mesures.')).toBeInTheDocument();
    expect(screen.getByText('Comment ça fonctionne')).toBeInTheDocument();
    expect(screen.getByText('Nos offres d’atelier')).toBeInTheDocument();
    expect(screen.getByText('Prêt·e à créer votre patron ?')).toBeInTheDocument();

    // Check steps presence
    expect(screen.getAllByText('Type de vêtement')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Génération géométrique')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Export professionnel')[0]).toBeInTheDocument();

    // Check pricing tiers
    expect(screen.getByText('Patron numérique')).toBeInTheDocument();
    expect(screen.getByText('Patron + Vérification Angaly')).toBeInTheDocument();
  });

  it('triggers project creation when clicking a step cell in Comment ça fonctionne', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ id: 'proj-new', projectRef: 'ANG-PAT-2026-00001' });

    render(<PatternStudioLandingPage />, { wrapper: withQueryClient() });

    const stepCell = screen.getAllByText('Type de vêtement')[0];
    const button = stepCell?.closest('button');
    button?.click();

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/pattern-projects'),
        expect.objectContaining({ garmentType: 'ROBE' }),
      );
    });
  });
});
