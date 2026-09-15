import type { Server } from 'node:http';

import type { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { ACCESS_TOKEN_SERVICE } from '../../../auth/domain/services/access-token.service';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';
import { SuggestPatternParametersUseCase } from '../../application/use-cases/suggest-pattern-parameters.use-case';
import { AiInspirationController } from '../../presentation/controllers/ai-inspiration.controller';

describe('AiInspirationController (integration)', () => {
  let app: INestApplication;
  const suggestPatternParametersUseCase = { execute: jest.fn() };
  const accessTokenService = { sign: jest.fn(), verify: jest.fn() };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AiInspirationController],
      providers: [
        { provide: SuggestPatternParametersUseCase, useValue: suggestPatternParametersUseCase },
        JwtAuthGuard,
        { provide: ACCESS_TOKEN_SERVICE, useValue: accessTokenService },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
    accessTokenService.verify.mockReturnValue({ sub: 'user-1', role: 'CLIENT' });
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
    accessTokenService.verify.mockReturnValue({ sub: 'user-1', role: 'CLIENT' });
  });

  function server(): Server {
    return app.getHttpServer() as Server;
  }

  it('POST /ai-inference/inspiration-analysis calls the real AI suggestion pipeline, not a stub', async () => {
    suggestPatternParametersUseCase.execute.mockResolvedValue({
      suggestion: {
        suggestedCutType: 'SIRENE',
        suggestedDetails: { encolure: 'Décolleté en V' },
        detectedInspirationFeatures: { silhouette: 'Ajustée' },
        confidence: 0.7,
        modelVersion: 'gemini-2.5-flash',
      },
      isIndicativeOnly: false,
    });

    const response = await request(server())
      .post('/ai-inference/inspiration-analysis')
      .set('Authorization', 'Bearer valid-token')
      .send({ inspirationImageUrl: 'https://cdn.angaly.test/inspiration.jpg' })
      .expect(201);

    expect(suggestPatternParametersUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ inspirationImageUrl: 'https://cdn.angaly.test/inspiration.jpg' }),
    );
    expect(response.body).toMatchObject({
      suggestedCutType: 'SIRENE',
      detectedInspirationFeatures: { silhouette: 'Ajustée' },
      isIndicativeOnly: false,
    });
  });

  it('rejects an invalid inspiration URL with 400', async () => {
    await request(server())
      .post('/ai-inference/inspiration-analysis')
      .set('Authorization', 'Bearer valid-token')
      .send({ inspirationImageUrl: 'not-a-url' })
      .expect(400);

    expect(suggestPatternParametersUseCase.execute).not.toHaveBeenCalled();
  });
});
