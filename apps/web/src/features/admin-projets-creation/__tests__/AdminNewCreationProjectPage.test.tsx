import { fireEvent, render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreationProjectStage, Role } from '@angaly/types';
import { AdminNewCreationProjectPage } from '../ui/AdminNewCreationProjectPage';
import { useAdminNewCreationProject } from '../hooks/useAdminNewCreationProject';

vi.mock('../hooks/useAdminNewCreationProject', () => ({
  useAdminNewCreationProject: vi.fn(),
  GARMENT_TYPE_OPTIONS: ['Robe de mariée', 'Costume', 'Robe de soirée', 'Tenue traditionnelle', 'Autre'],
  OCCASION_OPTIONS: ['Mariage', 'Soirée', 'Cérémonie', 'Professionnel', 'Quotidien', 'Autre'],
  BUDGET_RANGE_OPTIONS: ['< 500 000 Ar', '500 000–1 000 000 Ar', '1 000 000–2 000 000 Ar', 'Sur devis'],
}));

const mockCustomer = {
  id: 'c-1',
  firstName: 'Hanitra',
  lastName: 'Rakoto',
  email: 'hanitra@angaly.mg',
  phone: '+261340012345',
};

const mockQuote = {
  id: 'q-1',
  quoteNumber: 'DEV-2026-0042',
  total: '1500000',
  customerName: 'Hanitra Rakoto',
};

const mockStaff = {
  id: 'u-1',
  email: 'marie@angaly.mg',
  role: Role.COUTURIERE,
};

describe('AdminNewCreationProjectPage', () => {
  const handleSubmitMock = vi.fn();
  const setTitleMock = vi.fn();
  const setGarmentTypeMock = vi.fn();
  const setSelectedCustomerIdMock = vi.fn();
  const setIsCreatingNewCustomerMock = vi.fn();
  const setNewCustomerMock = vi.fn();
  const setBudgetRangeMock = vi.fn();
  const setOccasionMock = vi.fn();
  const setEventDateMock = vi.fn();
  const setDescriptionMock = vi.fn();
  const setSelectedQuoteIdMock = vi.fn();
  const setAssignedToIdMock = vi.fn();
  const setInitialStageMock = vi.fn();
  const removeInspirationPhotoMock = vi.fn();
  const addInspirationPhotosMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setup = (overrides: Record<string, unknown> = {}) => {
    vi.mocked(useAdminNewCreationProject).mockReturnValue({
      customerSearchQuery: '',
      setCustomerSearchQuery: vi.fn(),
      selectedCustomerId: 'c-1',
      setSelectedCustomerId: setSelectedCustomerIdMock,
      isCreatingNewCustomer: false,
      setIsCreatingNewCustomer: setIsCreatingNewCustomerMock,
      newCustomer: { firstName: '', lastName: '', email: '', phone: '' },
      setNewCustomer: setNewCustomerMock,
      title: 'Robe de mariée — Mme Rakoto',
      setTitle: setTitleMock,
      garmentType: 'Robe de mariée',
      setGarmentType: setGarmentTypeMock,
      occasion: 'Mariage',
      setOccasion: setOccasionMock,
      eventDate: '2026-12-14',
      setEventDate: setEventDateMock,
      description: 'Notes de consultation',
      setDescription: setDescriptionMock,
      budgetRange: '1 000 000–2 000 000 Ar',
      setBudgetRange: setBudgetRangeMock,
      selectedQuoteId: 'q-1',
      setSelectedQuoteId: setSelectedQuoteIdMock,
      assignedToId: 'u-1',
      setAssignedToId: setAssignedToIdMock,
      initialStage: CreationProjectStage.CONSULTATION,
      setInitialStage: setInitialStageMock,
      inspirationPhotos: [],
      removeInspirationPhoto: removeInspirationPhotoMock,
      addInspirationPhotos: addInspirationPhotosMock,
      customers: [mockCustomer],
      quotes: [mockQuote],
      assignees: [mockStaff],
      errors: {},
      isSubmitting: false,
      submitError: null,
      handleSubmit: handleSubmitMock,
      summaryClientName: 'Hanitra Rakoto',
      summaryGarment: 'Robe de mariée',
      summaryEvent: 'Mariage · 2026-12-14',
      summaryBudget: '1 000 000–2 000 000 Ar',
      summaryAssigneeName: 'marie@angaly.mg',
      currentStageIndex: 0,
      ...overrides,
    } as unknown as ReturnType<typeof useAdminNewCreationProject>);
  };

  it('renders page header with title, subtitle, and breadcrumb link', () => {
    setup();
    render(<AdminNewCreationProjectPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'Nouveau Projet Sur Mesure' })).toBeInTheDocument();
    expect(
      screen.getByText("Ouvrez un dossier de création pour une cliente et lancez le suivi de l'atelier."),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Annuler/i })).toHaveAttribute('href', '/projets-creation');
    expect(screen.getByRole('link', { name: /Projets de création/i })).toHaveAttribute('href', '/projets-creation');
  });

  it('renders all four form cards and the summary column', () => {
    setup();
    render(<AdminNewCreationProjectPage />);

    expect(screen.getByRole('heading', { level: 2, name: /Cliente/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /Création/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /Budget & devis/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /Atelier/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /Récapitulatif/i })).toBeInTheDocument();
  });

  it('displays live summary information matching filled state', () => {
    setup();
    render(<AdminNewCreationProjectPage />);

    expect(screen.getAllByText('Hanitra Rakoto').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Mariage · 2026-12-14')).toBeInTheDocument();
    expect(screen.getByText('marie@angaly.mg')).toBeInTheDocument();
    expect(screen.getByText('La référence CRP-… sera générée à la création.')).toBeInTheDocument();
  });

  it('renders validation error message when present', () => {
    setup({ errors: { title: 'Le titre du projet est requis' } });
    render(<AdminNewCreationProjectPage />);

    expect(screen.getByText('Le titre du projet est requis')).toBeInTheDocument();
  });

  it('toggles new customer creation fields when clicking the link', () => {
    setup({ isCreatingNewCustomer: true });
    render(<AdminNewCreationProjectPage />);

    expect(screen.getByLabelText('Prénom *')).toBeInTheDocument();
    expect(screen.getByLabelText('Nom *')).toBeInTheDocument();
    expect(screen.getByLabelText('Email *')).toBeInTheDocument();
    expect(screen.getByLabelText('Téléphone')).toBeInTheDocument();
  });

  it('calls handleSubmit with false when clicking Créer le projet', () => {
    setup();
    render(<AdminNewCreationProjectPage />);

    const createBtn = screen.getByRole('button', { name: 'Créer le projet' });
    fireEvent.click(createBtn);

    expect(handleSubmitMock).toHaveBeenCalledWith(false);
  });

  it('calls handleSubmit with true when clicking Enregistrer comme brouillon', () => {
    setup();
    render(<AdminNewCreationProjectPage />);

    const draftBtn = screen.getByRole('button', { name: 'Enregistrer comme brouillon' });
    fireEvent.click(draftBtn);

    expect(handleSubmitMock).toHaveBeenCalledWith(true);
  });
});
