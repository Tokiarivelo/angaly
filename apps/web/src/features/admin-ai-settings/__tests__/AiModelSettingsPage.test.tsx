import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { AiModelSettingsPage } from '../ui/AiModelSettingsPage';
import * as useAiModelSettingModule from '../hooks/useAiModelSetting';
import * as useAvailableAiModelsModule from '../hooks/useAvailableAiModels';
import * as useUpdateAiModelSettingModule from '../hooks/useUpdateAiModelSetting';

vi.mock('../hooks/useAiModelSetting');
vi.mock('../hooks/useAvailableAiModels');
vi.mock('../hooks/useUpdateAiModelSetting');

describe('AiModelSettingsPage', () => {
  const mutate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAiModelSettingModule.useAiModelSetting).mockReturnValue({
      data: { measurementModel: 'GEMINI', updatedAt: '2026-01-01T00:00:00.000Z', updatedById: null },
      isLoading: false,
    } as any);
    vi.mocked(useAvailableAiModelsModule.useAvailableAiModels).mockReturnValue({
      data: { measurementEstimation: ['GEMINI'] },
    } as any);
    vi.mocked(useUpdateAiModelSettingModule.useUpdateAiModelSetting).mockReturnValue({
      mutate,
      isPending: false,
    } as any);
  });

  it('marks the currently selected model', () => {
    render(<AiModelSettingsPage />);

    const geminiCard = screen.getByRole('button', { name: /IA générative \(Gemini\)/ });
    expect(geminiCard).not.toBeDisabled();
  });

  it('disables an option the AI service has not loaded and shows why', () => {
    render(<AiModelSettingsPage />);

    const localCard = screen.getByRole('button', { name: /Modèle statistique entraîné/ });
    expect(localCard).toBeDisabled();
    expect(screen.getByText(/Indisponible/)).toBeInTheDocument();
  });

  it('calls the update mutation when an available option is picked', () => {
    vi.mocked(useAvailableAiModelsModule.useAvailableAiModels).mockReturnValue({
      data: { measurementEstimation: ['GEMINI', 'LOCAL_STATISTICAL'] },
    } as any);

    render(<AiModelSettingsPage />);

    fireEvent.click(screen.getByRole('button', { name: /Modèle statistique entraîné/ }));

    expect(mutate).toHaveBeenCalledWith('LOCAL_STATISTICAL');
  });
});
