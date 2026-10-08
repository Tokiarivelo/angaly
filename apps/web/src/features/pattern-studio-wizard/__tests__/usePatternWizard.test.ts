import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePatternWizard } from '../hooks/usePatternWizard';
import { withQueryClient } from '@/lib/test-utils';
import { apiClient } from '@/lib/api-client';
import { PatternStatus } from '@angaly/types';
import { WIZARD_STEPS } from '../types/wizard-state.types';

vi.mock('@/lib/api-client');

const nav = vi.hoisted(() => ({ replace: vi.fn(), query: '' }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: nav.replace, push: vi.fn() }),
  usePathname: () => '/pattern-studio/wizard/proj-1',
  useSearchParams: () => new URLSearchParams(nav.query),
}));

const MOCK_PROJECT = {
  id: 'proj-1',
  projectRef: 'ANG-PAT-2026-00001',
  customerId: 'cust-1',
  measurementProfileId: 'profile-1',
  garmentType: 'ROBE',
  occasion: 'MARIAGE',
  style: 'CLASSIQUE',
  cutType: 'SIRENE',
  detailsJson: { manches: 'LONGUES' },
  inspirationMediaId: null,
  status: PatternStatus.DRAFT,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('usePatternWizard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    nav.query = '';
  });

  it('initializes with fetched project data', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce(MOCK_PROJECT);

    const { result } = renderHook(() => usePatternWizard('proj-1'), {
      wrapper: withQueryClient(),
    });

    await waitFor(() => {
      expect(result.current.projectRef).toBe('ANG-PAT-2026-00001');
    });

    expect(result.current.formData.garmentType).toBe('ROBE');
    expect(result.current.currentStep).toBe(1);
    expect(result.current.isStepValid(1)).toBe(true);
  });

  it('updates form fields and navigates between steps', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce(MOCK_PROJECT);
    vi.mocked(apiClient.patch).mockResolvedValueOnce(MOCK_PROJECT);

    const { result } = renderHook(() => usePatternWizard('proj-1'), {
      wrapper: withQueryClient(),
    });

    await waitFor(() => {
      expect(result.current.formData.garmentType).toBe('ROBE');
    });

    act(() => {
      result.current.goToNextStep();
    });

    expect(result.current.currentStep).toBe(2);

    act(() => {
      result.current.updateField('occasion', 'SOIREE');
    });

    expect(result.current.formData.occasion).toBe('SOIREE');

    act(() => {
      result.current.goToPreviousStep();
    });

    expect(result.current.currentStep).toBe(1);
  });

  describe('step in the URL', () => {
    it('resumes on the step named by ?step= after a refresh', () => {
      nav.query = 'step=style';
      vi.mocked(apiClient.get).mockResolvedValueOnce(MOCK_PROJECT);
      const { result } = renderHook(() => usePatternWizard('proj-1'), { wrapper: withQueryClient() });
      expect(result.current.currentStep).toBe(4);
    });

    it('ignores an unknown ?step= and starts on inspiration', () => {
      nav.query = 'step=nope';
      vi.mocked(apiClient.get).mockResolvedValueOnce(MOCK_PROJECT);
      const { result } = renderHook(() => usePatternWizard('proj-1'), { wrapper: withQueryClient() });
      expect(result.current.currentStep).toBe(1);
    });

    it('writes the current step key into the URL when navigating', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce(MOCK_PROJECT);
      const { result } = renderHook(() => usePatternWizard('proj-1'), { wrapper: withQueryClient() });
      act(() => result.current.goToNextStep());
      await waitFor(() =>
        expect(nav.replace).toHaveBeenLastCalledWith(
          '/pattern-studio/wizard/proj-1?step=garmentType',
          { scroll: false },
        ),
      );
    });
  });

  it('restores the saved photo analysis and preview after a refresh', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      ...MOCK_PROJECT,
      inspirationMediaId: 'media-1',
      inspirationMediaUrl: 'https://cdn/p.jpg',
      inspirationAnalysisJson: {
        features: { tissu: 'tulle' },
        profile: {
          isGarment: true,
          garmentType: 'ROBE',
          occasion: null,
          style: null,
          cutType: 'SIRENE',
          details: {},
          constructionMethod: 'DRAPING',
        },
      },
    });
    const { result } = renderHook(() => usePatternWizard('proj-1'), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.formData.inspirationIsGarment).toBe(true));
    expect(result.current.formData).toMatchObject({
      detectedFeatures: { tissu: 'tulle' },
      inspirationImageUrl: 'https://cdn/p.jpg',
      inspirationProfile: { constructionMethod: 'DRAPING' },
    });
  });

  describe('inspiration first', () => {
    const PHOTO = { mediaId: 'media-1', url: 'https://cdn/p.jpg', detectedFeatures: { silhouette: 'sirène' } };

    const setup = async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        ...MOCK_PROJECT,
        garmentType: 'ROBE',
        occasion: null,
        style: null,
        cutType: null,
        detailsJson: {},
      });
      vi.mocked(apiClient.patch).mockResolvedValue(MOCK_PROJECT);
      const hook = renderHook(() => usePatternWizard('proj-1'), { wrapper: withQueryClient() });
      await waitFor(() => expect(hook.result.current.projectRef).toBe('ANG-PAT-2026-00001'));
      return hook;
    };

    it('orders the steps Inspiration → Vêtement → Occasion → Style → Coupe → Détails → Mesures', () => {
      expect(WIZARD_STEPS.map((step) => step.label)).toEqual([
        'Inspiration',
        'Vêtement',
        'Occasion',
        'Style',
        'Coupe',
        'Détails',
        'Mesures',
      ]);
    });

    it('lets the customer skip the photo, but still requires occasion on step 3', async () => {
      const { result } = await setup();
      expect(result.current.isStepValid(1)).toBe(true);
      expect(result.current.isStepValid(3)).toBe(false);
      expect(result.current.isStepValid(5)).toBe(false);
    });

    it('pre-fills every step from a recognised garment and autosaves once', async () => {
      const { result } = await setup();
      vi.mocked(apiClient.patch).mockClear();

      act(() => {
        result.current.applyInspiration({
          ...PHOTO,
          suggestedCutType: 'SIRENE',
          profile: {
            isGarment: true,
            garmentType: 'ROBE_MARIEE',
            occasion: 'MARIAGE',
            style: 'GLAMOUR',
            cutType: 'SIRENE',
            details: { manches: 'SANS_MANCHES', longueur: 'SOL' },
          },
        });
      });

      expect(result.current.formData).toMatchObject({
        garmentType: 'ROBE_MARIEE',
        occasion: 'MARIAGE',
        style: 'GLAMOUR',
        cutType: 'SIRENE',
        details: { manches: 'SANS_MANCHES', longueur: 'SOL' },
        inspirationMediaId: 'media-1',
        inspirationIsGarment: true,
      });
      expect(result.current.isStepValid(3)).toBe(true);
      expect(result.current.isStepValid(5)).toBe(true);
      await waitFor(() => expect(apiClient.patch).toHaveBeenCalledTimes(1));
      expect(apiClient.patch).toHaveBeenCalledWith(
        '/api/pattern-projects/proj-1',
        expect.objectContaining({
          inspirationAnalysisJson: {
            features: PHOTO.detectedFeatures,
            profile: expect.objectContaining({ garmentType: 'ROBE_MARIEE' }),
          },
        }),
      );
    });

    it('keeps existing choices when the model could not tell a field', async () => {
      const { result } = await setup();
      act(() => result.current.updateField('occasion', 'QUOTIDIEN'));

      act(() => {
        result.current.applyInspiration({
          ...PHOTO,
          suggestedCutType: null,
          profile: {
            isGarment: true,
            garmentType: 'JUPE',
            occasion: null,
            style: null,
            cutType: null,
            details: {},
          },
        });
      });

      expect(result.current.formData.garmentType).toBe('JUPE');
      expect(result.current.formData.occasion).toBe('QUOTIDIEN');
    });

    it('pre-fills nothing when the photo is not a garment', async () => {
      const { result } = await setup();

      act(() => {
        result.current.applyInspiration({
          ...PHOTO,
          suggestedCutType: null,
          profile: {
            isGarment: false,
            garmentType: null,
            occasion: null,
            style: null,
            cutType: null,
            details: {},
          },
        });
      });

      expect(result.current.formData.inspirationIsGarment).toBe(false);
      expect(result.current.formData.garmentType).toBe('ROBE');
      expect(result.current.formData.cutType).toBe('');
      expect(result.current.isStepValid(5)).toBe(false);
    });
  });
});
