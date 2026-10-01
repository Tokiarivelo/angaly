import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { CreationProjectStage, type CreationProjectDto } from '@angaly/types';
import { AdminCreationProjectsPage } from '../ui/AdminCreationProjectsPage';
import { useAdminCreationProjects } from '../hooks/useAdminCreationProjects';

vi.mock('../hooks/useAdminCreationProjects', () => ({
  useAdminCreationProjects: vi.fn(),
}));

const mockProject = (overrides: Partial<CreationProjectDto> = {}): CreationProjectDto => ({
  id: 'p-1',
  reference: 'CRP-2026-K3f9a01x',
  title: 'Robe de mariée dentelle ivoire',
  customerName: 'Éléonore de Saint-Germain',
  description: null,
  stage: CreationProjectStage.CONSULTATION,
  quoteId: 'q-1',
  quoteNumber: 'ANG-DEV-2026-014',
  creationId: null,
  completedAt: null,
  createdAt: '2026-01-14T10:00:00.000Z',
  updatedAt: '2026-01-14T10:00:00.000Z',
  ...overrides,
});

describe('AdminCreationProjectsPage', () => {
  const updateStageMock = vi.fn();
  const refetchMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setup = (
    projects: CreationProjectDto[],
    options: { isLoading?: boolean; isError?: boolean; error?: Error } = {},
  ) => {
    vi.mocked(useAdminCreationProjects).mockReturnValue({
      projects,
      isLoading: options.isLoading ?? false,
      isError: options.isError ?? false,
      error: options.error ?? null,
      refetch: refetchMock,
      updateStage: updateStageMock,
      isUpdating: false,
      updatingVariables: undefined,
    } as unknown as ReturnType<typeof useAdminCreationProjects>);
  };

  it('renders page header and new project action button', () => {
    setup([]);
    render(<AdminCreationProjectsPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'Projets de création' })).toBeInTheDocument();
    expect(
      screen.getByText('Suivez et faites avancer les créations sur mesure des clientes.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Nouveau Projet Sur Mesure/i })).toHaveAttribute(
      'href',
      '/sur-mesure/demande',
    );
  });

  it('displays loading skeleton during initial fetch', () => {
    setup([], { isLoading: true });
    render(<AdminCreationProjectsPage />);

    expect(screen.getByLabelText('Chargement des projets')).toBeInTheDocument();
  });

  it('renders error state and retries on button click', () => {
    setup([], { isError: true, error: new Error('Network error') });
    render(<AdminCreationProjectsPage />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/Network error/i)).toBeInTheDocument();

    const retryBtn = screen.getByRole('button', { name: /Réessayer/i });
    fireEvent.click(retryBtn);
    expect(refetchMock).toHaveBeenCalled();
  });

  it('renders data table with projects, client names, and quote links', () => {
    const project1 = mockProject();
    setup([project1]);
    render(<AdminCreationProjectsPage />);

    expect(screen.getByText('CRP-2026-K3f9a01x')).toBeInTheDocument();
    expect(screen.getByText('Robe de mariée dentelle ivoire')).toBeInTheDocument();
    expect(screen.getByText('Client : Éléonore de Saint-Germain')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'ANG-DEV-2026-014' })).toHaveAttribute(
      'href',
      '/devis/ANG-DEV-2026-014',
    );
    expect(screen.getAllByText('Consultation').length).toBeGreaterThanOrEqual(1);
  });

  it('filters projects when filter chip is clicked', () => {
    const project1 = mockProject({ id: 'p-1', stage: CreationProjectStage.CONSULTATION, title: 'Robe A' });
    const project2 = mockProject({ id: 'p-2', stage: CreationProjectStage.CONFECTION, title: 'Costume B' });
    setup([project1, project2]);

    render(<AdminCreationProjectsPage />);

    expect(screen.getByText('Robe A')).toBeInTheDocument();
    expect(screen.getByText('Costume B')).toBeInTheDocument();

    // Click Confection filter chip
    const confectionChip = screen.getByRole('tab', { name: /Confection/i });
    fireEvent.click(confectionChip);

    expect(screen.queryByText('Robe A')).not.toBeInTheDocument();
    expect(screen.getByText('Costume B')).toBeInTheDocument();
  });

  it('shows empty state when no projects match the active stage', () => {
    const project1 = mockProject({ id: 'p-1', stage: CreationProjectStage.CONSULTATION });
    setup([project1]);

    render(<AdminCreationProjectsPage />);

    // Click Terminée filter
    const termineeChip = screen.getByRole('tab', { name: /Terminée/i });
    fireEvent.click(termineeChip);

    expect(
      screen.getByText('Aucun projet de création pour cette étape.'),
    ).toBeInTheDocument();
  });

  it('allows updating the project stage and clicking Enregistrer', async () => {
    const project1 = mockProject({ id: 'p-1', stage: CreationProjectStage.CONSULTATION });
    setup([project1]);
    updateStageMock.mockResolvedValueOnce({ ...project1, stage: CreationProjectStage.CONCEPTION });

    render(<AdminCreationProjectsPage />);

    const select = screen.getByLabelText("Étape pour CRP-2026-K3f9a01x");
    expect(select).toHaveValue(CreationProjectStage.CONSULTATION);

    const saveButton = screen.getByRole('button', { name: "Enregistrer l'étape de CRP-2026-K3f9a01x" });
    // Initially disabled because nothing changed
    expect(saveButton).toBeDisabled();

    // Change stage to Conception
    fireEvent.change(select, { target: { value: CreationProjectStage.CONCEPTION } });
    expect(saveButton).not.toBeDisabled();

    // Click save
    fireEvent.click(saveButton);

    expect(updateStageMock).toHaveBeenCalledWith({
      id: 'p-1',
      stage: CreationProjectStage.CONCEPTION,
    });

    await waitFor(() => {
      expect(screen.getByText('Enregistré')).toBeInTheDocument();
    });
  });

  it('displays error message when updating stage fails', async () => {
    const project1 = mockProject({ id: 'p-1', stage: CreationProjectStage.CONSULTATION });
    setup([project1]);
    updateStageMock.mockRejectedValueOnce(new Error('Erreur réseau de test'));

    render(<AdminCreationProjectsPage />);

    const select = screen.getByLabelText("Étape pour CRP-2026-K3f9a01x");
    fireEvent.change(select, { target: { value: CreationProjectStage.CONCEPTION } });

    const saveButton = screen.getByRole('button', { name: "Enregistrer l'étape de CRP-2026-K3f9a01x" });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Erreur réseau de test')).toBeInTheDocument();
    });
  });

  it('renders a project without quoteNumber with dash placeholder', () => {
    const project1 = mockProject({ quoteId: null, quoteNumber: null });
    setup([project1]);

    render(<AdminCreationProjectsPage />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('navigates between pages when multiple pages exist', () => {
    const projects = Array.from({ length: 15 }, (_, i) =>
      mockProject({ id: `p-${i}`, reference: `CRP-2026-${i}`, title: `Projet ${i}` }),
    );
    setup(projects);

    render(<AdminCreationProjectsPage />);

    expect(screen.getByText('Projet 0')).toBeInTheDocument();
    expect(screen.queryByText('Projet 11')).not.toBeInTheDocument();

    const nextBtn = screen.getByRole('button', { name: 'Suivant' });
    fireEvent.click(nextBtn);

    expect(screen.getByText('Projet 11')).toBeInTheDocument();
    expect(screen.queryByText('Projet 0')).not.toBeInTheDocument();

    const prevBtn = screen.getByRole('button', { name: 'Précédent' });
    fireEvent.click(prevBtn);

    expect(screen.getByText('Projet 0')).toBeInTheDocument();
  });
});
