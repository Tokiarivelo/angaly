import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { CreationProjectStage, Role, type CreationProjectDetailDto } from '@angaly/types';
import { AdminCreationProjectDetailPage } from '../ui/AdminCreationProjectDetailPage';
import { useAdminCreationProject } from '../hooks/useAdminCreationProject';

vi.mock('../hooks/useAdminCreationProject', () => ({ useAdminCreationProject: vi.fn() }));

const detail = (overrides: Partial<CreationProjectDetailDto> = {}): CreationProjectDetailDto => ({
  id: 'p-1',
  reference: 'CRP-2026-K3f9a01x',
  title: 'Robe de mariée dentelle ivoire',
  customerName: 'Éléonore de Saint-Germain',
  description: 'Dentelle ivoire',
  stage: CreationProjectStage.PATRON,
  quoteId: 'q-1',
  quoteNumber: 'ANG-DEV-2026-014',
  creationId: null,
  completedAt: null,
  assignedTo: null,
  stageHistory: [
    {
      id: 'e-1',
      fromStage: CreationProjectStage.CONCEPTION,
      toStage: CreationProjectStage.PATRON,
      changedByEmail: 'manager@angaly.mg',
      createdAt: '2026-01-20T10:00:00.000Z',
    },
  ],
  createdAt: '2026-01-14T10:00:00.000Z',
  updatedAt: '2026-01-14T10:00:00.000Z',
  ...overrides,
});

describe('AdminCreationProjectDetailPage', () => {
  const assign = vi.fn();
  const updateStage = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    assign.mockResolvedValue(undefined);
    updateStage.mockResolvedValue(undefined);
  });

  const setup = (project: CreationProjectDetailDto | undefined, extra: { isError?: boolean } = {}) => {
    vi.mocked(useAdminCreationProject).mockReturnValue({
      project,
      isLoading: false,
      isError: extra.isError ?? false,
      error: null,
      refetch: vi.fn(),
      assignees: [{ id: 'u-2', email: 'couturiere@angaly.mg', role: Role.COUTURIERE }],
      updateStage,
      isUpdatingStage: false,
      assign,
      isAssigning: false,
    } as unknown as ReturnType<typeof useAdminCreationProject>);
    render(<AdminCreationProjectDetailPage projectId="p-1" />);
  };

  it('renders the project, its stepper, info and history', () => {
    setup(detail());

    expect(screen.getByRole('heading', { name: 'Robe de mariée dentelle ivoire' })).toBeInTheDocument();
    expect(screen.getByText('Éléonore de Saint-Germain')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Voir le devis' })).toHaveAttribute('href', '/devis/ANG-DEV-2026-014');
    expect(screen.getByLabelText('Étapes du projet').querySelector('[aria-current="step"]')).toHaveTextContent(
      'Patron',
    );
    expect(screen.getByText(/manager@angaly.mg/)).toBeInTheDocument();
    expect(screen.getByText('Non assignée', { selector: 'p' })).toBeInTheDocument();
  });

  it('assigns the selected staff member', async () => {
    setup(detail());

    fireEvent.change(screen.getByLabelText("Choisir un membre de l'atelier"), { target: { value: 'u-2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Assigner' }));

    await waitFor(() => expect(assign).toHaveBeenCalledWith('u-2'));
  });

  it('keeps Assigner disabled until the selection changes', () => {
    setup(detail());
    expect(screen.getByRole('button', { name: 'Assigner' })).toBeDisabled();
  });

  it('changes the stage', async () => {
    setup(detail());

    fireEvent.change(screen.getByLabelText('Nouvelle étape'), { target: { value: CreationProjectStage.CONFECTION } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

    await waitFor(() => expect(updateStage).toHaveBeenCalledWith(CreationProjectStage.CONFECTION));
  });

  it('shows an error alert when the project cannot be loaded', () => {
    setup(undefined, { isError: true });
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
