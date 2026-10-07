import { Test, TestingModule } from '@nestjs/testing';
import { AiProviderId, AiProviderStatus, AiUsage } from '@angaly/types';
import { AiProviderResolverService } from '../../application/services/ai-provider-resolver.service';
import { GetAiModelSettingUseCase } from '../../../admin-ai-settings/application/use-cases/get-ai-model-setting.use-case';
import { AI_PROVIDER_CONFIG_REPOSITORY } from '../../../admin-ai-settings/domain/repositories/ai-provider-config.repository';
import { SECRET_CIPHER } from '../../../admin-ai-settings/domain/services/secret-cipher.service';
import { AiModelSetting } from '../../../admin-ai-settings/domain/entities/ai-model-setting.entity';
import { AiProviderConfigEntity } from '../../../admin-ai-settings/domain/entities/ai-provider-config.entity';

describe('AiProviderResolverService', () => {
  let service: AiProviderResolverService;
  let getAiModelSetting: jest.Mocked<GetAiModelSettingUseCase>;
  let providerRepo: {
    findByProvider: jest.Mock;
  };
  let cipher: {
    encrypt: jest.Mock;
    decrypt: jest.Mock;
  };

  beforeEach(async () => {
    getAiModelSetting = {
      execute: jest.fn().mockResolvedValue(
        new AiModelSetting(
          'singleton',
          'GEMINI',
          null,
          new Date(),
          new Date(),
          AiProviderId.LOCAL_STATISTICAL,
          AiProviderId.ANTHROPIC,
        ),
      ),
    } as any;

    providerRepo = {
      findByProvider: jest.fn(),
    };

    cipher = {
      encrypt: jest.fn(),
      decrypt: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiProviderResolverService,
        { provide: GetAiModelSettingUseCase, useValue: getAiModelSetting },
        { provide: AI_PROVIDER_CONFIG_REPOSITORY, useValue: providerRepo },
        { provide: SECRET_CIPHER, useValue: cipher },
      ],
    }).compile();

    service = module.get<AiProviderResolverService>(AiProviderResolverService);
  });

  it('resolves LOCAL_STATISTICAL immediately without database config lookup', async () => {
    const creds = await service.resolveCredentials(AiUsage.MEASUREMENT_ESTIMATION);

    expect(creds).toEqual({
      provider: AiProviderId.LOCAL_STATISTICAL,
      model: 'ansur2-ridge-v1',
    });
    expect(providerRepo.findByProvider).not.toHaveBeenCalled();
  });

  it('resolves and decrypts credentials for an active Anthropic provider', async () => {
    providerRepo.findByProvider.mockResolvedValueOnce(
      new AiProviderConfigEntity(
        'cfg-1',
        AiProviderId.ANTHROPIC,
        'claude-sonnet-5-5',
        null,
        'iv.tag.ciphertext',
        '3f9a',
        AiProviderStatus.OK,
        new Date(),
        120,
        true,
        'admin-1',
        new Date(),
        new Date(),
      ),
    );
    cipher.decrypt.mockResolvedValueOnce('sk-ant-real-decrypted-key');

    const creds = await service.resolveCredentials(AiUsage.PATTERN_SUGGESTION);

    expect(creds).toEqual({
      provider: AiProviderId.ANTHROPIC,
      model: 'claude-sonnet-5-5',
      apiKey: 'sk-ant-real-decrypted-key',
      baseUrl: undefined,
    });
    expect(cipher.decrypt).toHaveBeenCalledWith('iv.tag.ciphertext');
  });

  it('returns undefined when the provider is disabled or not found', async () => {
    providerRepo.findByProvider.mockResolvedValueOnce(null);

    const creds = await service.resolveCredentials(AiUsage.PATTERN_SUGGESTION);
    expect(creds).toBeUndefined();
  });

  it('returns undefined gracefully when decryption fails', async () => {
    providerRepo.findByProvider.mockResolvedValueOnce(
      new AiProviderConfigEntity(
        'cfg-1',
        AiProviderId.ANTHROPIC,
        'claude-sonnet-5-5',
        null,
        'bad-cipher',
        '3f9a',
        AiProviderStatus.OK,
        null,
        null,
        true,
        null,
        new Date(),
        new Date(),
      ),
    );
    cipher.decrypt.mockRejectedValueOnce(new Error('Tag mismatch'));

    const creds = await service.resolveCredentials(AiUsage.PATTERN_SUGGESTION);
    expect(creds).toBeUndefined();
  });
});
