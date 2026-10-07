import { BadRequestException, NotFoundException } from '@nestjs/common';
import { RemoveAiProviderUseCase } from '../../application/use-cases/remove-ai-provider.use-case';
import type { IAiProviderConfigRepository } from '../../domain/repositories/ai-provider-config.repository';
import type { IAiModelSettingRepository } from '../../domain/repositories/ai-model-setting.repository';
import { AiProviderConfigEntity } from '../../domain/entities/ai-provider-config.entity';
import { AiModelSetting } from '../../domain/entities/ai-model-setting.entity';
import { AiProviderId, AiProviderStatus } from '@angaly/types';

describe('RemoveAiProviderUseCase', () => {
  let configRepo: jest.Mocked<IAiProviderConfigRepository>;
  let routingRepo: jest.Mocked<IAiModelSettingRepository>;
  let useCase: RemoveAiProviderUseCase;

  beforeEach(() => {
    configRepo = {
      findAll: jest.fn(),
      findByProvider: jest.fn(),
      upsert: jest.fn(),
      deleteByProvider: jest.fn(),
      updateTestResult: jest.fn(),
    };
    routingRepo = {
      get: jest.fn(),
      update: jest.fn(),
      updateRouting: jest.fn(),
    };
    useCase = new RemoveAiProviderUseCase(configRepo, routingRepo);
  });

  it('rejects deleting the local statistical provider', async () => {
    await expect(useCase.execute(AiProviderId.LOCAL_STATISTICAL)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('throws NotFoundException if the provider has no saved config', async () => {
    configRepo.findByProvider.mockResolvedValue(null);

    await expect(useCase.execute(AiProviderId.ANTHROPIC)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('rejects deleting a provider that is currently active for measurement estimation', async () => {
    const config = new AiProviderConfigEntity(
      'cfg-1',
      AiProviderId.ANTHROPIC,
      'claude-sonnet-5-5',
      null,
      'cipher',
      '3f9a',
      AiProviderStatus.OK,
      null,
      null,
      true,
      null,
      new Date(),
      new Date(),
    );
    configRepo.findByProvider.mockResolvedValue(config);

    routingRepo.get.mockResolvedValue(
      new AiModelSetting(
        'singleton',
        'GEMINI',
        null,
        new Date(),
        new Date(),
        AiProviderId.ANTHROPIC, // measurementProvider is ANTHROPIC!
        AiProviderId.GEMINI,
      ),
    );

    await expect(useCase.execute(AiProviderId.ANTHROPIC)).rejects.toThrow(
      BadRequestException,
    );
    expect(configRepo.deleteByProvider).not.toHaveBeenCalled();
  });

  it('deletes the config when not active in routing', async () => {
    const config = new AiProviderConfigEntity(
      'cfg-1',
      AiProviderId.GROQ,
      'llama-3.3-70b-versatile',
      null,
      'cipher',
      '1111',
      AiProviderStatus.OK,
      null,
      null,
      true,
      null,
      new Date(),
      new Date(),
    );
    configRepo.findByProvider.mockResolvedValue(config);

    routingRepo.get.mockResolvedValue(
      new AiModelSetting(
        'singleton',
        'GEMINI',
        null,
        new Date(),
        new Date(),
        AiProviderId.GEMINI,
        AiProviderId.GEMINI,
      ),
    );

    await useCase.execute(AiProviderId.GROQ);
    expect(configRepo.deleteByProvider).toHaveBeenCalledWith(AiProviderId.GROQ);
  });
});
