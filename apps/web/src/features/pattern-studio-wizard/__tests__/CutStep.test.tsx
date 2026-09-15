import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { CutStep } from '../ui/steps/CutStep';
import { withQueryClient } from '@/lib/test-utils';
import { apiClient } from '@/lib/api-client';

vi.mock('@/lib/api-client');

describe('CutStep', () => {
  const onSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all cut options and highlights the selected one', () => {
    render(
      <CutStep
        selectedCut="SIRENE"
        onSelect={onSelect}
        garmentType="ROBE"
        occasion="Mariage"
        style="Sirène"
      />,
      { wrapper: withQueryClient() },
    );

    expect(screen.getByText('Sirène')).toBeInTheDocument();
    expect(screen.getByText('Droite')).toBeInTheDocument();
  });

  it('selects a cut when its card is clicked', () => {
    render(
      <CutStep selectedCut="" onSelect={onSelect} garmentType="ROBE" occasion={null} style={null} />,
      { wrapper: withQueryClient() },
    );

    fireEvent.click(screen.getByText('Évasée / Trapèze'));
    expect(onSelect).toHaveBeenCalledWith('EVASEE');
  });

  it('requests an AI suggestion and lets the user apply it explicitly', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      suggestion: {
        suggestedCutType: 'PRINCESSE',
        suggestedDetails: {},
        detectedInspirationFeatures: null,
        confidence: 0.6,
        modelVersion: 'gemini-2.5-flash',
      },
      isIndicativeOnly: false,
    });

    render(
      <CutStep
        selectedCut="DROITE"
        onSelect={onSelect}
        garmentType="ROBE"
        occasion="Mariage"
        style="Princesse"
      />,
      { wrapper: withQueryClient() },
    );

    fireEvent.click(screen.getByText('Obtenir une suggestion IA'));

    await waitFor(() => expect(screen.getByText('Princesse', { selector: 'span' })).toBeInTheDocument());
    expect(apiClient.post).toHaveBeenCalledWith(
      '/api/ai-inference/pattern-suggestions',
      { garmentType: 'ROBE', occasion: 'Mariage', style: 'Princesse', measurements: {} },
    );

    // Suggestion is not applied automatically — the user must confirm it.
    expect(onSelect).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText('Appliquer cette coupe'));
    expect(onSelect).toHaveBeenCalledWith('PRINCESSE');
  });
});
