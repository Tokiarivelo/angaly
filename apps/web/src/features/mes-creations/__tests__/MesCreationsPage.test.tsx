import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CreationProjectStage, type CreationProjectDto } from '@angaly/types';
import { MesCreationsPage } from '../ui/MesCreationsPage';
import { useCreationProjects } from '../hooks/useCreationProjects';

vi.mock('../hooks/useCreationProjects', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../hooks/useCreationProjects')>()),
  useCreationProjects: vi.fn(),
}));

const project = (overrides: Partial<CreationProjectDto>): CreationProjectDto => ({
  id: 'p-1',
  reference: 'CRP-2026-K3f9aQ1x',
  title: 'Robe de mariée — dentelle ivoire',
  description: null,
  stage: CreationProjectStage.CONFECTION,
  quoteId: 'q-1',
  quoteNumber: 'ANG-DEV-2026-abc12345',
  creationId: null,
  completedAt: null,
  createdAt: '2026-09-12T10:00:00.000Z',
  updatedAt: '2026-09-12T10:00:00.000Z',
  ...overrides,
});

const mockQuery = (data: CreationProjectDto[], extra: Record<string, unknown> = {}) =>
  vi.mocked(useCreationProjects).mockReturnValue({ data, isLoading: false, isError: false, ...extra } as ReturnType<typeof useCreationProjects>);

describe('MesCreationsPage', () => {
  it('renders the empty state when there is no project', () => {
    mockQuery([]);
    render(<MesCreationsPage />);
    expect(screen.getByText("Vous n'avez pas encore de création en cours.")).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Demander un sur-mesure' })).toHaveAttribute('href', '/sur-mesure/demande');
  });

  it('shows an error message when loading fails', () => {
    mockQuery([], { isError: true });
    render(<MesCreationsPage />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('renders a card with its 6-step stepper, status badge and quote link', () => {
    mockQuery([project({})]);
    render(<MesCreationsPage />);
    expect(screen.getByRole('heading', { name: 'Robe de mariée — dentelle ivoire' })).toBeInTheDocument();
    expect(screen.getByText("En confection à l'Atelier")).toBeInTheDocument();
    expect(screen.getByText('Réf. CRP-2026-K3f9aQ1x')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(6);
    expect(screen.getByRole('link', { name: 'Voir le devis' })).toHaveAttribute('href', '/devis/ANG-DEV-2026-abc12345');
  });

  it('hides the quote link when the project has no quote', () => {
    mockQuery([project({ quoteId: null, quoteNumber: null })]);
    render(<MesCreationsPage />);
    expect(screen.queryByRole('link', { name: 'Voir le devis' })).not.toBeInTheDocument();
  });

  it('offers to plan the fitting at the ESSAYAGE stage', () => {
    mockQuery([project({ stage: CreationProjectStage.ESSAYAGE })]);
    render(<MesCreationsPage />);
    expect(screen.getByRole('link', { name: "Planifier l'essayage" })).toHaveAttribute('href', '/essayage/reserver');
  });

  it('filters in-progress and delivered projects with counts', () => {
    mockQuery([
      project({ id: 'a', title: 'Pièce A' }),
      project({ id: 'b', title: 'Pièce B', stage: CreationProjectStage.TERMINEE, completedAt: '2026-09-02T10:00:00.000Z' }),
    ]);
    render(<MesCreationsPage />);
    expect(screen.getByRole('tab', { name: 'Toutes (2)' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Livrées (1)' }));
    expect(screen.queryByText('Pièce A')).not.toBeInTheDocument();
    expect(screen.getByText('Pièce B')).toBeInTheDocument();
    expect(screen.getByText(/Terminée le 2 septembre 2026/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'En cours (1)' }));
    expect(screen.getByText('Pièce A')).toBeInTheDocument();
    expect(screen.queryByText('Pièce B')).not.toBeInTheDocument();
  });
});
