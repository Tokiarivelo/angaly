import type { Server } from 'node:http';

import type { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { ACCESS_TOKEN_SERVICE } from '../../../auth/domain/services/access-token.service';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';
import { AnalyzeInspirationImageUseCase } from '../../application/use-cases/analyze-inspiration-image.use-case';
import { AiProviderResolverService } from '../../application/services/ai-provider-resolver.service';
import { AiInspirationController } from '../../presentation/controllers/ai-inspiration.controller';

describe('AiInspirationController (integration)', () => {
  let app: INestApplication;
  const analyzeInspirationImage = { execute: jest.fn() };
  const providerResolver = { resolveSelected: jest.fn() };
  const accessTokenService = { sign: jest.fn(), verify: jest.fn() };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AiInspirationController],
      providers: [
        { provide: AnalyzeInspirationImageUseCase, useValue: analyzeInspirationImage },
        { provide: AiProviderResolverService, useValue: providerResolver },
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

  const profile = {
    isGarment: true,
    garmentType: 'ROBE',
    occasion: 'SOIREE',
    style: 'ELEGANT',
    cutType: 'SIRENE',
    details: { longueur: 'SOL' },
  };

  it('POST /ai-inference/inspiration-analysis returns the wizard-ready garment profile', async () => {
    analyzeInspirationImage.execute.mockResolvedValue({
      features: { silhouette: 'Ajustée' },
      profile,
      suggestedCutType: 'SIRENE',
      confidence: 0.8,
      modelVersion: 'gemini-2.5-flash',
    });

    const response = await request(server())
      .post('/ai-inference/inspiration-analysis')
      .set('Authorization', 'Bearer valid-token')
      .send({ inspirationImageUrl: 'https://cdn.angaly.test/inspiration.jpg' })
      .expect(201);

    expect(analyzeInspirationImage.execute).toHaveBeenCalledWith(
      'https://cdn.angaly.test/inspiration.jpg',
      undefined,
    );
    expect(response.body).toMatchObject({
      suggestedCutType: 'SIRENE',
      detectedInspirationFeatures: { silhouette: 'Ajustée' },
      profile,
      isIndicativeOnly: false,
    });
  });

  it('analyses the photo with the model chosen in the wizard', async () => {
    const credentials = { provider: 'ANTHROPIC', model: 'claude-haiku-4-5-20251001', apiKey: 'k' };
    providerResolver.resolveSelected.mockResolvedValue(credentials);
    analyzeInspirationImage.execute.mockResolvedValue({
      features: {},
      profile,
      suggestedCutType: null,
      confidence: 0.8,
      modelVersion: 'claude-haiku-4-5-20251001',
    });

    await request(server())
      .post('/ai-inference/inspiration-analysis')
      .set('Authorization', 'Bearer valid-token')
      .send({ inspirationImageUrl: 'https://cdn.angaly.test/inspiration.jpg', aiProvider: 'ANTHROPIC' })
      .expect(201);

    expect(providerResolver.resolveSelected).toHaveBeenCalledWith('ANTHROPIC', 'PATTERN_SUGGESTION');
    expect(analyzeInspirationImage.execute).toHaveBeenCalledWith(
      'https://cdn.angaly.test/inspiration.jpg',
      credentials,
    );
  });

  it('degrades to an empty indicative answer when the photo cannot be analysed', async () => {
    analyzeInspirationImage.execute.mockRejectedValue(new Error('image unreachable'));

    const response = await request(server())
      .post('/ai-inference/inspiration-analysis')
      .set('Authorization', 'Bearer valid-token')
      .send({ inspirationImageUrl: 'https://cdn.angaly.test/inspiration.jpg' })
      .expect(201);

    expect(response.body).toMatchObject({ profile: null, confidence: 0, isIndicativeOnly: true });
  });

  it('accepts a local MinIO URL without a TLD (http://localhost:9000/…) in development', async () => {
    analyzeInspirationImage.execute.mockResolvedValue({
      features: {},
      profile,
      suggestedCutType: null,
      confidence: 0.8,
      modelVersion: 'm',
    });

    await request(server())
      .post('/ai-inference/inspiration-analysis')
      .set('Authorization', 'Bearer valid-token')
      .send({ inspirationImageUrl: 'http://localhost:9000/angaly-media/patterns/a.jpg' })
      .expect(201);
  });

  it('rejects an invalid inspiration URL with 400', async () => {
    await request(server())
      .post('/ai-inference/inspiration-analysis')
      .set('Authorization', 'Bearer valid-token')
      .send({ inspirationImageUrl: 'not-a-url' })
      .expect(400);

    expect(analyzeInspirationImage.execute).not.toHaveBeenCalled();
  });
});
