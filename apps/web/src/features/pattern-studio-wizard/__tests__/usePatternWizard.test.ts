import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePatternWizard } from '../hooks/usePatternWizard';
import { withQueryClient } from '@/lib/test-utils';
import { apiClient } from '@/lib/api-client';
import { PatternStatus } from '@angaly/types';

vi.mock('@/lib/api-client');

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
});
