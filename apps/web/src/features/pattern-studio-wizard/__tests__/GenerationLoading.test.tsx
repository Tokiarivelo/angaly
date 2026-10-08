import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GenerationLoadingScreen } from '../ui/GenerationLoadingScreen';
import { WizardFooterNav } from '../ui/WizardFooterNav';
import { GENERATION_STAGES, useGenerationProgress } from '../hooks/useGenerationProgress';
import { renderHook } from '@testing-library/react';

describe('generation loading feedback', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('is announced as a busy status and starts on the first stage', () => {
    render(<GenerationLoadingScreen />);
    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByText('Génération de votre patron en cours…')).toBeInTheDocument();
    const stages = screen.getByTestId('generation-stages');
    expect(stages.querySelector('[aria-current="step"]')).toHaveTextContent(GENERATION_STAGES[0]);
  });

  it('moves through the stages, counts the seconds and warns when it takes long', () => {
    render(<GenerationLoadingScreen />);
    act(() => {
      vi.advanceTimersByTime(5500);
    });
    expect(screen.getByTestId('generation-stages').querySelector('[aria-current="step"]')).toHaveTextContent(
      GENERATION_STAGES[2],
    );
    expect(screen.getByTestId('generation-elapsed')).toHaveTextContent(/5 s/);

    act(() => {
      vi.advanceTimersByTime(12000);
    });
    expect(screen.getByTestId('generation-stages').querySelector('[aria-current="step"]')).toHaveTextContent(
      GENERATION_STAGES[GENERATION_STAGES.length - 1]!,
    );
    expect(screen.getByTestId('generation-elapsed')).toHaveTextContent(/Toujours en cours/);
  });

  it('page-opening variant has no stage list', () => {
    render(<GenerationLoadingScreen showStages={false} title="Ouverture de votre patron…" />);
    expect(screen.getByText('Ouverture de votre patron…')).toBeInTheDocument();
    expect(screen.queryByTestId('generation-stages')).not.toBeInTheDocument();
  });

  it('useGenerationProgress stays idle when inactive', () => {
    const { result } = renderHook(() => useGenerationProgress(false));
    act(() => {
      vi.advanceTimersByTime(10000);
    });
    expect(result.current.elapsedSeconds).toBe(0);
  });

  it('the final-step button shows a spinner, its busy label and is disabled while generating', () => {
    render(
      <WizardFooterNav
        currentStep={7}
        isValid
        isSubmitting
        submittingLabel="Génération…"
        onPrevious={vi.fn()}
        onNext={vi.fn()}
      />,
    );
    const button = screen.getByRole('button', { name: /Génération…/ });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryByText('Générer mon patron')).not.toBeInTheDocument();
  });

  it('keeps "Traitement…" by default and "Générer mon patron" when idle', () => {
    const { rerender } = render(
      <WizardFooterNav currentStep={3} isValid isSubmitting onPrevious={vi.fn()} onNext={vi.fn()} />,
    );
    expect(screen.getByText('Traitement…')).toBeInTheDocument();
    rerender(<WizardFooterNav currentStep={7} isValid onPrevious={vi.fn()} onNext={vi.fn()} />);
    expect(screen.getByText('Générer mon patron')).toBeInTheDocument();
  });
});
