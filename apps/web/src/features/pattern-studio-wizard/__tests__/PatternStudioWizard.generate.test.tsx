import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PatternStudioWizard } from '../ui/PatternStudioWizard';
import * as wizardHook from '../hooks/usePatternWizard';
import * as generateHook from '../hooks/useGeneratePattern';

vi.mock('next/link', () => ({ default: ({ children }: { children: React.ReactNode }) => <a>{children}</a> }));
vi.mock('../hooks/usePatternWizard');
vi.mock('../hooks/useGeneratePattern');
vi.mock('../hooks/useSelectableAiProviders', () => ({
  useSelectableAiProviders: () => ({ data: { providers: [] } }),
}));
vi.mock('../hooks/useMeasurementProfiles', () => ({ useMeasurementProfiles: () => ({ data: [] }) }));
vi.mock('../hooks/useSizeCharts', () => ({ useSizeCharts: () => ({ data: [], isLoading: false }) }));

const generate = vi.fn();

const mockWizard = () =>
  vi.mocked(wizardHook.usePatternWizard).mockReturnValue({
    currentStep: 7,
    formData: { garmentType: 'ROBE', occasion: '', style: '', cutType: '', details: {}, measurements: { TOUR_TAILLE: 70 } },
    projectRef: 'ANG-PAT-1',
    updateField: vi.fn(),
    updateDetail: vi.fn(),
    applyInspiration: vi.fn(),
    isStepValid: () => true,
    goToNextStep: vi.fn(),
    goToPreviousStep: vi.fn(),
    goToStep: vi.fn(),
  } as never);

const mockGenerate = (state: Record<string, unknown>) =>
  vi.mocked(generateHook.useGeneratePattern).mockReturnValue({
    mutate: generate,
    isPending: false,
    isSuccess: false,
    isError: false,
    error: null,
    ...state,
  } as never);

describe('PatternStudioWizard — "Générer mon patron" feedback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWizard();
  });

  it('starts the generation from the last step', () => {
    mockGenerate({});
    render(<PatternStudioWizard projectId="p1" />);
    fireEvent.click(screen.getByRole('button', { name: /Générer mon patron/ }));
    expect(generate).toHaveBeenCalledWith({ measurements: { TOUR_TAILLE: 70 }, aiProvider: undefined });
  });

  it('shows the loading screen while the request is running', () => {
    mockGenerate({ isPending: true });
    render(<PatternStudioWizard projectId="p1" />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByText('Génération de votre patron en cours…')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Générer mon patron/ })).not.toBeInTheDocument();
  });

  it('keeps the loading screen after success, while the redirect to the preview happens', () => {
    mockGenerate({ isSuccess: true });
    render(<PatternStudioWizard projectId="p1" />);
    expect(screen.getByText('Génération de votre patron en cours…')).toBeInTheDocument();
  });

  it('brings the wizard back with a clear error when the generation fails', () => {
    mockGenerate({ isError: true, error: new Error('Missing required measurements for "ROBE": TOUR_BASSIN') });
    render(<PatternStudioWizard projectId="p1" />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('La génération du patron a échoué.');
    expect(alert).toHaveTextContent('TOUR_BASSIN');
    expect(screen.getByRole('button', { name: /Générer mon patron/ })).toBeEnabled();
  });
});
