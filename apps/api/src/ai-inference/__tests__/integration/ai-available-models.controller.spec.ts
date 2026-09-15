import type { Server } from 'node:http';

import type { INestApplication } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { ACCESS_TOKEN_SERVICE } from '../../../auth/domain/services/access-token.service';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import { AiServiceHttpClient } from '../../infrastructure/services/ai-service-http-client';
import { AiAvailableModelsController } from '../../presentation/controllers/ai-available-models.controller';

describe('AiAvailableModelsController (integration)', () => {
  let app: INestApplication;
  const aiServiceHttpClient = { getAvailableModels: jest.fn() };
  const accessTokenService = { sign: jest.fn(), verify: jest.fn() };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AiAvailableModelsController],
      providers: [
        { provide: AiServiceHttpClient, useValue: aiServiceHttpClient },
        JwtAuthGuard,
        RolesGuard,
        Reflector,
        { provide: ACCESS_TOKEN_SERVICE, useValue: accessTokenService },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
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

  it('GET /ai-inference/available-models returns the list for an ADMIN', async () => {
    aiServiceHttpClient.getAvailableModels.mockResolvedValue({
      measurementEstimation: ['GEMINI', 'LOCAL_STATISTICAL'],
    });

    const response = await request(server())
      .get('/ai-inference/available-models')
      .set('Authorization', 'Bearer valid-token')
      .expect(200);

    expect(response.body).toEqual({ measurementEstimation: ['GEMINI', 'LOCAL_STATISTICAL'] });
  });

  it('returns 403 for a non-ADMIN role', async () => {
    accessTokenService.verify.mockReturnValue({ sub: 'couturiere-1', role: 'COUTURIERE' });

    await request(server())
      .get('/ai-inference/available-models')
      .set('Authorization', 'Bearer valid-token')
      .expect(403);

    expect(aiServiceHttpClient.getAvailableModels).not.toHaveBeenCalled();
  });
});
