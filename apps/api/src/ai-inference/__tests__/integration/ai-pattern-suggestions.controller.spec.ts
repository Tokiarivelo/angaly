import type { Server } from 'node:http';

import type { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { ACCESS_TOKEN_SERVICE } from '../../../auth/domain/services/access-token.service';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';
import { SuggestPatternParametersUseCase } from '../../application/use-cases/suggest-pattern-parameters.use-case';
import { AiPatternSuggestionsController } from '../../presentation/controllers/ai-pattern-suggestions.controller';

describe('AiPatternSuggestionsController (integration)', () => {
  let app: INestApplication;
  const suggestPatternParametersUseCase = { execute: jest.fn() };
  const accessTokenService = { sign: jest.fn(), verify: jest.fn() };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AiPatternSuggestionsController],
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

  it('POST /ai-inference/pattern-suggestions returns a suggestion marked as indicative-only', async () => {
    suggestPatternParametersUseCase.execute.mockResolvedValue({
      suggestion: {
        suggestedCutType: 'DROITE',
        suggestedDetails: {},
        detectedInspirationFeatures: null,
        confidence: 0.2,
        modelVersion: 'gemini-2.5-flash',
      },
      isIndicativeOnly: true,
    });

    const response = await request(server())
      .post('/ai-inference/pattern-suggestions')
      .set('Authorization', 'Bearer valid-token')
      .send({ garmentType: 'ROBE', occasion: 'Mariage', style: 'Sirène', measurements: { TOUR_POITRINE: 88 } })
      .expect(201);

    expect(suggestPatternParametersUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ garmentType: 'ROBE', measurements: { TOUR_POITRINE: 88 } }),
    );
    expect(response.body).toMatchObject({ isIndicativeOnly: true });
  });

  it('rejects a request missing garmentType with 400', async () => {
    await request(server())
      .post('/ai-inference/pattern-suggestions')
      .set('Authorization', 'Bearer valid-token')
      .send({ measurements: {} })
      .expect(400);

    expect(suggestPatternParametersUseCase.execute).not.toHaveBeenCalled();
  });
});
