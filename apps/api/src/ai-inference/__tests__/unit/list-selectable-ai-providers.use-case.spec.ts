import { AiProviderId, AiProviderStatus } from '@angaly/types';
import { ListSelectableAiProvidersUseCase } from '../../application/use-cases/list-selectable-ai-providers.use-case';

const config = (provider: AiProviderId, enabled: boolean, status: AiProviderStatus) => ({
  provider,
  model: `${provider.toLowerCase()}-model`,
  enabled,
  status,
});

describe('ListSelectableAiProvidersUseCase', () => {
  it('lists the local model plus enabled, non-failing providers, without secrets', async () => {
    const findAll = jest.fn().mockResolvedValue([
      config(AiProviderId.ANTHROPIC, true, AiProviderStatus.OK),
      config(AiProviderId.GEMINI, true, AiProviderStatus.UNTESTED),
      config(AiProviderId.OPENAI, true, AiProviderStatus.INVALID),
      config(AiProviderId.GROQ, false, AiProviderStatus.OK),
    ]);
    const useCase = new ListSelectableAiProvidersUseCase(
      { findAll } as never,
      { execute: jest.fn().mockResolvedValue({ patternSuggestionProvider: AiProviderId.GEMINI }) } as never,
    );

    const result = await useCase.execute();

    expect(result.providers.map((p) => p.provider)).toEqual([
      AiProviderId.LOCAL_STATISTICAL,
      AiProviderId.ANTHROPIC,
      AiProviderId.GEMINI,
    ]);
    expect(result.defaultProvider).toBe(AiProviderId.GEMINI);
    expect(Object.keys(result.providers[1]!).sort()).toEqual(['model', 'name', 'provider']);
  });
});
