import { ListAiProvidersUseCase } from '../../application/use-cases/list-ai-providers.use-case';
import type { IAiProviderConfigRepository } from '../../domain/repositories/ai-provider-config.repository';
import { AiProviderConfigEntity } from '../../domain/entities/ai-provider-config.entity';
import { AiProviderId, AiProviderStatus } from '@angaly/types';

describe('ListAiProvidersUseCase', () => {
  it('returns catalog and configured providers with masked API keys', async () => {
    const config = new AiProviderConfigEntity(
      'cfg-1',
      AiProviderId.ANTHROPIC,
      'claude-sonnet-5-5',
      null,
      'cipher.tag.encrypted',
      '3f9a',
      AiProviderStatus.OK,
      new Date('2026-10-02T10:00:00Z'),
      840,
      true,
      'admin-1',
      new Date('2026-10-02T10:00:00Z'),
      new Date('2026-10-01T10:00:00Z'),
    );

    const repository: jest.Mocked<IAiProviderConfigRepository> = {
      findAll: jest.fn().mockResolvedValue([config]),
      findByProvider: jest.fn(),
      upsert: jest.fn(),
      deleteByProvider: jest.fn(),
      updateTestResult: jest.fn(),
    };

    const useCase = new ListAiProvidersUseCase(repository);
    const result = await useCase.execute();

    expect(result.catalog.length).toBeGreaterThanOrEqual(12);
    expect(result.configured).toHaveLength(1);

    const anthropicConfig = result.configured[0]!;
    expect(anthropicConfig.provider).toBe(AiProviderId.ANTHROPIC);
    expect(anthropicConfig.model).toBe('claude-sonnet-5-5');
    expect(anthropicConfig.apiKeyMasked).toBe('••••••••3f9a');
    expect((anthropicConfig as any).apiKeyCipher).toBeUndefined(); // NEVER returned
    expect(anthropicConfig.status).toBe(AiProviderStatus.OK);
    expect(anthropicConfig.lastLatencyMs).toBe(840);
  });
});
