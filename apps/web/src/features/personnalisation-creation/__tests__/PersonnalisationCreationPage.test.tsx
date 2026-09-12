import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PersonnalisationCreationPage } from '../ui/PersonnalisationCreationPage';
import { useCreationReference } from '../hooks/useCreationReference';

vi.mock('../hooks/useCreationReference', () => ({
  useCreationReference: vi.fn(),
}));

vi.mock('../hooks/useSubmitDesignBrief', () => ({
  useSubmitDesignBrief: () => ({
    handleSaveDraft: vi.fn(),
    handleSubmit: vi.fn(),
    isSavingDraft: false,
    isSubmitting: false,
    draftId: undefined,
  }),
}));

vi.mock('../hooks/useInspirationUpload', () => ({
  useInspirationUpload: () => ({
    uploadedMediaIds: [],
    previews: [],
    isUploading: false,
    handleUpload: vi.fn(),
    removeUpload: vi.fn(),
  }),
}));

describe('PersonnalisationCreationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state', () => {
    vi.mocked(useCreationReference).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any);

    render(<PersonnalisationCreationPage slug="test-robe" />);
    expect(screen.getByText('Chargement...')).toBeInTheDocument();
  });

  it('renders creation not found state', () => {
    vi.mocked(useCreationReference).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Not found'),
    } as any);

    render(<PersonnalisationCreationPage slug="test-robe" />);
    expect(screen.getByText('Création introuvable')).toBeInTheDocument();
  });

  it('renders the configurator and handles option selection', () => {
    vi.mocked(useCreationReference).mockReturnValue({
      data: { id: '1', slug: 'test-robe', title: 'Test Robe', media: [] },
      isLoading: false,
      error: null,
    } as any);

    render(<PersonnalisationCreationPage slug="test-robe" />);
    
    // Check main title
    expect(screen.getByText('Personnalisez votre Robe Éternelle')).toBeInTheDocument();
    
    // Select an option
    const coupeOption = screen.getByText('Droite');
    fireEvent.click(coupeOption);
    
    // Check if summary bar shows the option
    expect(screen.getAllByText('Droite').length).toBeGreaterThan(1); // One in option group, one in summary bar
    
    // Check submit button is enabled because coupe is selected
    const submitBtn = screen.getByText('Continuer vers la prise de rendez-vous');
    expect(submitBtn).not.toBeDisabled();
  });
});
