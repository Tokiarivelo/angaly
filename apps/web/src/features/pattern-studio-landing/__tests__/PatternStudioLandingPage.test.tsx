import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PatternStudioLandingPage } from '../ui/PatternStudioLandingPage';
import { withQueryClient } from '@/lib/test-utils';
import { apiClient } from '@/lib/api-client';

vi.mock('@/lib/api-client');
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
});
