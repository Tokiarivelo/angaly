import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePatternSuggestion } from '../hooks/usePatternSuggestion';
import { withQueryClient } from '@/lib/test-utils';
import { apiClient } from '@/lib/api-client';

vi.mock('@/lib/api-client');

describe('usePatternSuggestion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('requests a suggestion and returns it', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      suggestion: {
        suggestedCutType: 'SIRENE',
        suggestedDetails: {},
        detectedInspirationFeatures: null,
        confidence: 0.7,
        modelVersion: 'gemini-2.5-flash',
      },
      isIndicativeOnly: false,
    });

    const { result } = renderHook(() => usePatternSuggestion(), {
      wrapper: withQueryClient(),
    });

    act(() => {
      result.current.mutate({ garmentType: 'ROBE', occasion: 'Mariage', style: 'Sirène' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(apiClient.post).toHaveBeenCalledWith(
      '/api/ai-inference/pattern-suggestions',
      { garmentType: 'ROBE', occasion: 'Mariage', style: 'Sirène', measurements: {} },
    );
    expect(result.current.data?.suggestion.suggestedCutType).toBe('SIRENE');
  });

  it('resolves to a graceful fallback instead of rejecting on failure', async () => {
    vi.mocked(apiClient.post).mockRejectedValueOnce(new Error('network error'));

    const { result } = renderHook(() => usePatternSuggestion(), {
      wrapper: withQueryClient(),
    });

    act(() => {
      result.current.mutate({ garmentType: 'ROBE', occasion: null, style: null });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.isIndicativeOnly).toBe(true);
    expect(result.current.data?.suggestion.modelVersion).toBe('fallback-0.0.0');
  });
});
