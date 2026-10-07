import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UpsertAiProviderUseCase } from '../../application/use-cases/upsert-ai-provider.use-case';
import type { IAiProviderConfigRepository } from '../../domain/repositories/ai-provider-config.repository';
import type { ISecretCipher } from '../../domain/services/secret-cipher.service';
import { AiProviderConfigEntity } from '../../domain/entities/ai-provider-config.entity';
import { AiProviderId, AiProviderStatus } from '@angaly/types';

describe('UpsertAiProviderUseCase', () => {
  let repository: jest.Mocked<IAiProviderConfigRepository>;
  let cipher: jest.Mocked<ISecretCipher>;
  let useCase: UpsertAiProviderUseCase;

  beforeEach(() => {
    repository = {
      findAll: jest.fn(),
      findByProvider: jest.fn(),
      upsert: jest.fn(),
      deleteByProvider: jest.fn(),
      updateTestResult: jest.fn(),
    };
    cipher = {
      encrypt: jest.fn().mockImplementation(async (text) => `encrypted.${text}`),
      decrypt: jest.fn().mockImplementation(async (text) => text.replace('encrypted.', '')),
    };
    useCase = new UpsertAiProviderUseCase(repository, cipher);
  });

  it('throws NotFoundException for an unknown provider', async () => {
    await expect(
      useCase.execute('UNKNOWN_PROVIDER' as any, { model: 'test' }, 'admin-1'),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws BadRequestException if API key is missing on initial creation of a provider requiring one', async () => {
    repository.findByProvider.mockResolvedValue(null);

    await expect(
      useCase.execute(AiProviderId.ANTHROPIC, { model: 'claude-sonnet-5-5' }, 'admin-1'),
    ).rejects.toThrow(BadRequestException);
  });

  it('encrypts the API key and stores masked last 4 digits on creation', async () => {
    repository.findByProvider.mockResolvedValue(null);
    const createdEntity = new AiProviderConfigEntity(
      'cfg-1',
      AiProviderId.ANTHROPIC,
      'claude-sonnet-5-5',
      null,
      'encrypted.sk-ant-123456783f9a',
      '3f9a',
      AiProviderStatus.UNTESTED,
      null,
      null,
      true,
      'admin-1',
      new Date(),
      new Date(),
    );
    repository.upsert.mockResolvedValue(createdEntity);

    const result = await useCase.execute(
      AiProviderId.ANTHROPIC,
      { model: 'claude-sonnet-5-5', apiKey: 'sk-ant-123456783f9a' },
      'admin-1',
    );

    expect(cipher.encrypt).toHaveBeenCalledWith('sk-ant-123456783f9a');
    expect(repository.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: AiProviderId.ANTHROPIC,
        model: 'claude-sonnet-5-5',
        apiKeyCipher: 'encrypted.sk-ant-123456783f9a',
        apiKeyLast4: '3f9a',
      }),
    );
    expect(result.apiKeyMasked).toBe('••••••••3f9a');
  });

  it('preserves existing key when apiKey is omitted during an update', async () => {
    const existing = new AiProviderConfigEntity(
      'cfg-1',
      AiProviderId.ANTHROPIC,
      'claude-sonnet-5-5',
      null,
      'old-cipher',
      '3f9a',
      AiProviderStatus.OK,
      new Date(),
      800,
      true,
      'admin-1',
      new Date(),
      new Date(),
    );
    repository.findByProvider.mockResolvedValue(existing);

    const updated = new AiProviderConfigEntity(
      'cfg-1',
      AiProviderId.ANTHROPIC,
      'claude-opus-5-5',
      null,
      'old-cipher',
      '3f9a',
      AiProviderStatus.OK,
      new Date(),
      800,
      true,
      'admin-2',
      new Date(),
      new Date(),
    );
    repository.upsert.mockResolvedValue(updated);

    const result = await useCase.execute(
      AiProviderId.ANTHROPIC,
      { model: 'claude-opus-5-5' }, // apiKey omitted
      'admin-2',
    );

    expect(cipher.encrypt).not.toHaveBeenCalled();
    expect(repository.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: AiProviderId.ANTHROPIC,
        model: 'claude-opus-5-5',
        apiKeyCipher: undefined, // preserved
        apiKeyLast4: undefined,
      }),
    );
    expect(result.model).toBe('claude-opus-5-5');
    expect(result.apiKeyMasked).toBe('••••••••3f9a');
  });

  it('rejects SSRF metadata base URLs for custom openai compatible provider', async () => {
    await expect(
      useCase.execute(
        AiProviderId.CUSTOM_OPENAI,
        { model: 'llama3', baseUrl: 'http://169.254.169.254/latest' },
        'admin-1',
      ),
    ).rejects.toThrow(BadRequestException);
  });
});
