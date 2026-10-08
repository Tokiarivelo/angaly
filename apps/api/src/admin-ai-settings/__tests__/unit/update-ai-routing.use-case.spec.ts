import { BadRequestException } from '@nestjs/common';
import { UpdateAiRoutingUseCase } from '../../application/use-cases/update-ai-routing.use-case';
import type { IAiModelSettingRepository } from '../../domain/repositories/ai-model-setting.repository';
import type { IAiProviderConfigRepository } from '../../domain/repositories/ai-provider-config.repository';
import { AiProviderConfigEntity } from '../../domain/entities/ai-provider-config.entity';
import { AiModelSetting } from '../../domain/entities/ai-model-setting.entity';
import { AiProviderId, AiProviderStatus } from '@angaly/types';

describe('UpdateAiRoutingUseCase', () => {
  let routingRepo: jest.Mocked<IAiModelSettingRepository>;
  let configRepo: jest.Mocked<IAiProviderConfigRepository>;
  let useCase: UpdateAiRoutingUseCase;

  beforeEach(() => {
    routingRepo = {
      get: jest.fn(),
      update: jest.fn(),
      updateRouting: jest.fn(),
    };
    configRepo = {
      findAll: jest.fn(),
      findByProvider: jest.fn(),
      upsert: jest.fn(),
      deleteByProvider: jest.fn(),
      updateTestResult: jest.fn(),
    };
    useCase = new UpdateAiRoutingUseCase(routingRepo, configRepo);
  });

  it('rejects routing to an unconfigured provider', async () => {
    configRepo.findByProvider.mockResolvedValue(null);

    await expect(
      useCase.execute({ measurementProvider: AiProviderId.OPENAI }, 'admin-1'),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects routing to a disabled provider', async () => {
    const disabled = new AiProviderConfigEntity(
      'cfg-1',
      AiProviderId.OPENAI,
      'gpt-4o',
      null,
      'cipher',
      '1111',
      AiProviderStatus.OK,
      null,
      null,
      false, // disabled!
      null,
      new Date(),
      new Date(),
    );
    configRepo.findByProvider.mockResolvedValue(disabled);

    await expect(
      useCase.execute({ patternSuggestionProvider: AiProviderId.OPENAI }, 'admin-1'),
    ).rejects.toThrow(BadRequestException);
  });

  it('allows routing to the built-in local statistical model without db config check', async () => {
    const updated = new AiModelSetting(
      'singleton',
      'LOCAL_STATISTICAL',
      'admin-1',
      new Date(),
      new Date(),
      AiProviderId.LOCAL_STATISTICAL,
      AiProviderId.GEMINI,
    );
    routingRepo.updateRouting.mockResolvedValue(updated);

    const result = await useCase.execute(
      { measurementProvider: AiProviderId.LOCAL_STATISTICAL },
      'admin-1',
    );

    expect(configRepo.findByProvider).not.toHaveBeenCalled();
    expect(routingRepo.updateRouting).toHaveBeenCalledWith(
      expect.objectContaining({
        measurementProvider: AiProviderId.LOCAL_STATISTICAL,
        updatedById: 'admin-1',
      }),
    );
    expect(result).toBe(updated);
  });

  it('updates routing when target providers are valid and enabled', async () => {
    const claudeConfig = new AiProviderConfigEntity(
      'cfg-1',
      AiProviderId.ANTHROPIC,
      'claude-sonnet-5-5',
      null,
      'cipher',
      '3f9a',
      AiProviderStatus.OK,
      null,
      null,
      true, // enabled
      null,
      new Date(),
      new Date(),
    );
    configRepo.findByProvider.mockResolvedValue(claudeConfig);

    const updated = new AiModelSetting(
      'singleton',
      'GEMINI',
      'admin-1',
      new Date(),
      new Date(),
      AiProviderId.ANTHROPIC,
      AiProviderId.ANTHROPIC,
    );
    routingRepo.updateRouting.mockResolvedValue(updated);

    const result = await useCase.execute(
      {
        measurementProvider: AiProviderId.ANTHROPIC,
        patternSuggestionProvider: AiProviderId.ANTHROPIC,
      },
      'admin-1',
    );

    expect(result.measurementProvider).toBe(AiProviderId.ANTHROPIC);
    expect(result.patternSuggestionProvider).toBe(AiProviderId.ANTHROPIC);
  });

  it('rejects the local model as a photo fallback (it cannot read images)', async () => {
    await expect(
      useCase.execute({ patternSuggestionFallbacks: [AiProviderId.LOCAL_STATISTICAL] }, 'admin-1'),
    ).rejects.toThrow('ne sait pas lire une photo');
    expect(routingRepo.updateRouting).not.toHaveBeenCalled();
  });

  it('rejects an unconfigured fallback and saves a valid ordered list', async () => {
    configRepo.findByProvider.mockResolvedValueOnce(null);
    await expect(
      useCase.execute({ patternSuggestionFallbacks: [AiProviderId.OPENAI] }, 'admin-1'),
    ).rejects.toThrow(BadRequestException);

    const enabled = { enabled: true } as never;
    configRepo.findByProvider.mockResolvedValue(enabled);
    routingRepo.updateRouting.mockResolvedValue({} as never);
    await useCase.execute(
      { patternSuggestionFallbacks: [AiProviderId.OPENAI, AiProviderId.ANTHROPIC] },
      'admin-1',
    );
    expect(routingRepo.updateRouting).toHaveBeenCalledWith(
      expect.objectContaining({ patternSuggestionFallbacks: [AiProviderId.OPENAI, AiProviderId.ANTHROPIC] }),
    );
  });
});
