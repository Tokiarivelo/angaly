import { NotFoundException } from '@nestjs/common';
import { TestAiProviderUseCase } from '../../application/use-cases/test-ai-provider.use-case';
import type { IAiProviderConfigRepository } from '../../domain/repositories/ai-provider-config.repository';
import type { ISecretCipher } from '../../domain/services/secret-cipher.service';
import { AiProviderConfigEntity } from '../../domain/entities/ai-provider-config.entity';
import { AiProviderId, AiProviderStatus } from '@angaly/types';

describe('TestAiProviderUseCase', () => {
  let repository: jest.Mocked<IAiProviderConfigRepository>;
  let cipher: jest.Mocked<ISecretCipher>;
  let useCase: TestAiProviderUseCase;

  beforeEach(() => {
    repository = {
      findAll: jest.fn(),
      findByProvider: jest.fn(),
      upsert: jest.fn(),
      deleteByProvider: jest.fn(),
      updateTestResult: jest.fn(),
    };
    cipher = {
      encrypt: jest.fn(),
      decrypt: jest.fn(),
    };
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'OK', message: 'Connexion réussie', latencyMs: 50 }),
    } as any);
    useCase = new TestAiProviderUseCase(repository, cipher);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('tests the built-in local statistical model without requiring database config', async () => {
    const result = await useCase.execute(AiProviderId.LOCAL_STATISTICAL);

    expect(result.status).toBe(AiProviderStatus.OK);
    expect(result.provider).toBe(AiProviderId.LOCAL_STATISTICAL);
    expect(result.latencyMs).toBeGreaterThan(0);
  });

  it('throws NotFoundException if the provider has never been configured', async () => {
    repository.findByProvider.mockResolvedValue(null);

    await expect(useCase.execute(AiProviderId.ANTHROPIC)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('returns INVALID if key decryption fails', async () => {
    const config = new AiProviderConfigEntity(
      'cfg-1',
      AiProviderId.ANTHROPIC,
      'claude-sonnet-5-5',
      null,
      'corrupted.cipher.text',
      '3f9a',
      AiProviderStatus.UNTESTED,
      null,
      null,
      true,
      null,
      new Date(),
      new Date(),
    );
    repository.findByProvider.mockResolvedValue(config);
    cipher.decrypt.mockRejectedValue(new Error('Tag mismatch'));

    const result = await useCase.execute(AiProviderId.ANTHROPIC);

    expect(result.status).toBe(AiProviderStatus.INVALID);
    expect(repository.updateTestResult).toHaveBeenCalledWith(
      AiProviderId.ANTHROPIC,
      AiProviderStatus.INVALID,
      0,
      expect.any(Date),
    );
  });

  it('tests valid configured provider successfully and updates latency in repository', async () => {
    const config = new AiProviderConfigEntity(
      'cfg-1',
      AiProviderId.ANTHROPIC,
      'claude-sonnet-5-5',
      null,
      'valid.cipher.text',
      '3f9a',
      AiProviderStatus.UNTESTED,
      null,
      null,
      true,
      null,
      new Date(),
      new Date(),
    );
    repository.findByProvider.mockResolvedValue(config);
    cipher.decrypt.mockResolvedValue('sk-ant-valid-long-secret-key-123456');

    const result = await useCase.execute(AiProviderId.ANTHROPIC);

    expect(result.status).toBe(AiProviderStatus.OK);
    expect(result.latencyMs).toBeGreaterThan(0);
    expect(repository.updateTestResult).toHaveBeenCalledWith(
      AiProviderId.ANTHROPIC,
      AiProviderStatus.OK,
      expect.any(Number),
      expect.any(Date),
    );
  });
});
