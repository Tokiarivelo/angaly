import type { Server } from 'node:http';
import type { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { ACCESS_TOKEN_SERVICE } from '../../../auth/domain/services/access-token.service';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import { ListAiProvidersUseCase } from '../../application/use-cases/list-ai-providers.use-case';
import { UpsertAiProviderUseCase } from '../../application/use-cases/upsert-ai-provider.use-case';
import { RemoveAiProviderUseCase } from '../../application/use-cases/remove-ai-provider.use-case';
import { ListAiProviderModelsUseCase } from '../../application/use-cases/list-ai-provider-models.use-case';
import { TestAiProviderUseCase } from '../../application/use-cases/test-ai-provider.use-case';
import { AdminAiProvidersController } from '../../presentation/controllers/admin-ai-providers.controller';
import { AiProviderId, AiProviderStatus } from '@angaly/types';

describe('AdminAiProvidersController (integration)', () => {
  let app: INestApplication;
  const listAiProvidersUseCase = { execute: jest.fn() };
  const upsertAiProviderUseCase = { execute: jest.fn() };
  const removeAiProviderUseCase = { execute: jest.fn() };
  const testAiProviderUseCase = { execute: jest.fn() };
  const listAiProviderModelsUseCase = { execute: jest.fn() };
  const accessTokenService = { sign: jest.fn(), verify: jest.fn() };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AdminAiProvidersController],
      providers: [
        { provide: ListAiProvidersUseCase, useValue: listAiProvidersUseCase },
        { provide: UpsertAiProviderUseCase, useValue: upsertAiProviderUseCase },
        { provide: RemoveAiProviderUseCase, useValue: removeAiProviderUseCase },
        { provide: TestAiProviderUseCase, useValue: testAiProviderUseCase },
        { provide: ListAiProviderModelsUseCase, useValue: listAiProviderModelsUseCase },
        JwtAuthGuard,
        RolesGuard,
        Reflector,
        { provide: ACCESS_TOKEN_SERVICE, useValue: accessTokenService },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();
    accessTokenService.verify.mockReturnValue({ sub: 'admin-1', role: 'ADMIN' });
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
    accessTokenService.verify.mockReturnValue({ sub: 'admin-1', role: 'ADMIN' });
  });

  function server(): Server {
    return app.getHttpServer() as Server;
  }

  it('GET /admin/ai-settings/providers returns 403 for non-ADMIN role', async () => {
    accessTokenService.verify.mockReturnValue({ sub: 'client-1', role: 'CLIENT' });

    await request(server())
      .get('/admin/ai-settings/providers')
      .set('Authorization', 'Bearer valid-token')
      .expect(403);

    expect(listAiProvidersUseCase.execute).not.toHaveBeenCalled();
  });

  it('GET /admin/ai-settings/providers returns catalog and configs for ADMIN', async () => {
    listAiProvidersUseCase.execute.mockResolvedValue({
      catalog: [],
      configured: [
        {
          provider: AiProviderId.ANTHROPIC,
          model: 'claude-sonnet-5-5',
          baseUrl: null,
          apiKeyMasked: '••••••••3f9a',
          status: AiProviderStatus.OK,
          lastTestedAt: '2026-10-02T10:00:00.000Z',
          lastLatencyMs: 900,
          enabled: true,
          updatedAt: '2026-10-02T10:00:00.000Z',
        },
      ],
    });

    const response = await request(server())
      .get('/admin/ai-settings/providers')
      .set('Authorization', 'Bearer valid-token')
      .expect(200);

    expect(response.body.configured).toHaveLength(1);
    expect(response.body.configured[0].apiKeyMasked).toBe('••••••••3f9a');
  });

  it('PUT /admin/ai-settings/providers/:provider updates config', async () => {
    upsertAiProviderUseCase.execute.mockResolvedValue({
      provider: AiProviderId.ANTHROPIC,
      model: 'claude-sonnet-5-5',
      baseUrl: null,
      apiKeyMasked: '••••••••3f9a',
      status: AiProviderStatus.UNTESTED,
      lastTestedAt: null,
      lastLatencyMs: null,
      enabled: true,
      updatedAt: '2026-10-02T10:00:00.000Z',
    });

    const response = await request(server())
      .put(`/admin/ai-settings/providers/${AiProviderId.ANTHROPIC}`)
      .set('Authorization', 'Bearer valid-token')
      .send({
        model: 'claude-sonnet-5-5',
        apiKey: 'sk-ant-test-key-3f9a',
      })
      .expect(200);

    expect(upsertAiProviderUseCase.execute).toHaveBeenCalledWith(
      AiProviderId.ANTHROPIC,
      expect.objectContaining({ model: 'claude-sonnet-5-5' }),
      'admin-1',
    );
    expect(response.body.provider).toBe(AiProviderId.ANTHROPIC);
  });

  it('DELETE /admin/ai-settings/providers/:provider removes config', async () => {
    removeAiProviderUseCase.execute.mockResolvedValue(undefined);

    await request(server())
      .delete(`/admin/ai-settings/providers/${AiProviderId.GROQ}`)
      .set('Authorization', 'Bearer valid-token')
      .expect(200);

    expect(removeAiProviderUseCase.execute).toHaveBeenCalledWith(AiProviderId.GROQ);
  });

  it('POST /admin/ai-settings/providers/:provider/test triggers test', async () => {
    testAiProviderUseCase.execute.mockResolvedValue({
      provider: AiProviderId.ANTHROPIC,
      status: AiProviderStatus.OK,
      latencyMs: 820,
      testedAt: '2026-10-02T10:00:00.000Z',
      message: 'Connexion réussie',
    });

    const response = await request(server())
      .post(`/admin/ai-settings/providers/${AiProviderId.ANTHROPIC}/test`)
      .set('Authorization', 'Bearer valid-token')
      .expect(201); // default Nest POST status

    expect(testAiProviderUseCase.execute).toHaveBeenCalledWith(AiProviderId.ANTHROPIC);
    expect(response.body.status).toBe(AiProviderStatus.OK);
    expect(response.body.latencyMs).toBe(820);
  });

  it('GET /admin/ai-settings/providers/:provider/models forwards the search term', async () => {
    listAiProviderModelsUseCase.execute.mockResolvedValue({
      provider: AiProviderId.ANTHROPIC,
      models: [{ id: 'claude-sonnet-5-5' }],
      source: 'remote',
    });

    const response = await request(server())
      .get(`/admin/ai-settings/providers/${AiProviderId.ANTHROPIC}/models?q=sonnet`)
      .set('Authorization', 'Bearer valid-token')
      .expect(200);

    expect(listAiProviderModelsUseCase.execute).toHaveBeenCalledWith(AiProviderId.ANTHROPIC, 'sonnet');
    expect(response.body.models).toEqual([{ id: 'claude-sonnet-5-5' }]);
  });
});
