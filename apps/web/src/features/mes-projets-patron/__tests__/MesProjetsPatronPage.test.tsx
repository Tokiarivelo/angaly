import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MesProjetsPatronPage } from '../ui/MesProjetsPatronPage';
import { withQueryClient } from '@/lib/test-utils';
import { apiClient } from '@/lib/api-client';
import { PatternStatus } from '@angaly/types';

vi.mock('@/lib/api-client');
vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: { user: { id: 'user-1' } }, status: 'authenticated' }),
  getSession: () => Promise.resolve({ user: { id: 'user-1' } }),
}));
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

const MOCK_PROJECTS = [
  {
    id: 'proj-1',
    projectRef: 'ANG-PAT-2026-00001',
    customerId: 'cust-1',
    garmentType: 'ROBE',
    status: PatternStatus.GENERATED,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const DRAFT_PROJECT = {
  id: 'proj-draft-1',
  projectRef: 'ANG-PAT-2026-00003',
  customerId: 'cust-1',
  garmentType: 'ROBE',
  status: PatternStatus.DRAFT,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('MesProjetsPatronPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders project list when projects exist', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce(MOCK_PROJECTS);

    render(<MesProjetsPatronPage />, { wrapper: withQueryClient() });

    expect(screen.getByText('Mes projets de patron')).toBeInTheDocument();
    expect(
      await screen.findByText('ANG-PAT-2026-00001'),
    ).toBeInTheDocument();
    expect(screen.getByText('Ouvrir le projet')).toBeInTheDocument();
  });

  it('renders draft project, allows clicking card and button to resume wizard', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce([DRAFT_PROJECT]);

    render(<MesProjetsPatronPage />, { wrapper: withQueryClient() });

    expect(await screen.findByText('ANG-PAT-2026-00003')).toBeInTheDocument();
    expect(screen.getByText('Ébauche en cours')).toBeInTheDocument();
    expect(screen.getByText("Reprendre l'ébauche")).toBeInTheDocument();

    // Click the card directly
    const card = screen.getByTestId('pattern-project-card-proj-draft-1');
    card.click();
    expect(mockPush).toHaveBeenCalledWith('/pattern-studio/wizard/proj-draft-1');

    // Click the button inside the card
    mockPush.mockClear();
    const resumeBtn = screen.getByTestId('open-project-button');
    resumeBtn.click();
    expect(mockPush).toHaveBeenCalledWith('/pattern-studio/wizard/proj-draft-1');
  });

  it('renders empty state when no projects exist', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce([]);

    render(<MesProjetsPatronPage />, { wrapper: withQueryClient() });

    expect(
      await screen.findByText('Vous n’avez pas encore de projet de patron'),
    ).toBeInTheDocument();
    expect(screen.getByText('Créer mon premier patron')).toBeInTheDocument();
  });
});
