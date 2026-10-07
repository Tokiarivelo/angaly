import { NotFoundException } from '@nestjs/common';
import { AiProviderId, AiProviderStatus } from '@angaly/types';
import { ListAiProviderModelsUseCase } from '../../application/use-cases/list-ai-provider-models.use-case';
import type { IAiProviderConfigRepository } from '../../domain/repositories/ai-provider-config.repository';
import type { ISecretCipher } from '../../domain/services/secret-cipher.service';
import type { IProviderModelsFetcher } from '../../domain/services/provider-models-fetcher.service';
import { AiProviderConfigEntity } from '../../domain/entities/ai-provider-config.entity';

describe('ListAiProviderModelsUseCase', () => {
  let repository: jest.Mocked<IAiProviderConfigRepository>;
  let cipher: jest.Mocked<ISecretCipher>;
  let fetcher: jest.Mocked<IProviderModelsFetcher>;
  let useCase: ListAiProviderModelsUseCase;

  const config = new AiProviderConfigEntity(
    'id', AiProviderId.ANTHROPIC, 'claude-sonnet-5-5', null, 'cipher', '3f9a',
    AiProviderStatus.OK, null, null, true, null, new Date(), new Date(),
  );

  beforeEach(() => {
    repository = {
      findAll: jest.fn(), findByProvider: jest.fn(), upsert: jest.fn(),
      deleteByProvider: jest.fn(), updateTestResult: jest.fn(),
    };
    cipher = { encrypt: jest.fn(), decrypt: jest.fn().mockResolvedValue('sk-key') };
    fetcher = { fetchModelIds: jest.fn() };
    useCase = new ListAiProviderModelsUseCase(repository, cipher, fetcher);
  });

  it('throws NotFoundException when the provider is not configured', async () => {
    repository.findByProvider.mockResolvedValue(null);
    await expect(useCase.execute(AiProviderId.ANTHROPIC)).rejects.toThrow(NotFoundException);
  });

  it('returns remote models filtered by the search term', async () => {
    repository.findByProvider.mockResolvedValue(config);
    fetcher.fetchModelIds.mockResolvedValue(['claude-opus-5-5', 'claude-sonnet-5-5', 'claude-haiku-4-5']);

    const result = await useCase.execute(AiProviderId.ANTHROPIC, 'SONNET');

    expect(fetcher.fetchModelIds).toHaveBeenCalledWith(
      expect.objectContaining({ provider: AiProviderId.ANTHROPIC, apiKey: 'sk-key' }),
    );
    expect(result).toEqual({
      provider: AiProviderId.ANTHROPIC,
      models: [{ id: 'claude-sonnet-5-5' }],
      source: 'remote',
    });
  });

  it('falls back to catalog suggestions when the remote call fails', async () => {
    repository.findByProvider.mockResolvedValue(config);
    fetcher.fetchModelIds.mockRejectedValue(new Error('HTTP 401'));

    const result = await useCase.execute(AiProviderId.ANTHROPIC);

    expect(result.source).toBe('fallback');
    expect(result.models.map((m) => m.id)).toContain('claude-sonnet-5-5');
    expect(result.message).toContain('HTTP 401');
  });
});
