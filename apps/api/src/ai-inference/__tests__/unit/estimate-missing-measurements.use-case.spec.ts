import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import { EstimateMissingMeasurementsUseCase } from '../../application/use-cases/estimate-missing-measurements.use-case';
import { AiServiceHttpClient } from '../../infrastructure/services/ai-service-http-client';
import { AiProviderResolverService } from '../../application/services/ai-provider-resolver.service';
import {
  AiProviderId,
  type PatternMeasurementEstimationRequest,
  type PatternMeasurementEstimationResponse,
} from '@angaly/types';

describe('EstimateMissingMeasurementsUseCase', () => {
  let useCase: EstimateMissingMeasurementsUseCase;
  let aiClient: AiServiceHttpClient;
  let providerResolver: AiProviderResolverService;

  beforeEach(async () => {
    const mockAiClient = {
      estimateMissingMeasurements: jest.fn(),
    };
    const mockProviderResolver = {
      resolveCredentials: jest.fn().mockResolvedValue({
        provider: AiProviderId.GEMINI,
        model: 'gemini-2.5-flash',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EstimateMissingMeasurementsUseCase,
        { provide: AiServiceHttpClient, useValue: mockAiClient },
        { provide: AiProviderResolverService, useValue: mockProviderResolver },
      ],
    }).compile();

    useCase = module.get<EstimateMissingMeasurementsUseCase>(EstimateMissingMeasurementsUseCase);
    aiClient = module.get<AiServiceHttpClient>(AiServiceHttpClient);
    providerResolver = module.get<AiProviderResolverService>(AiProviderResolverService);
  });

  it('flags low-confidence estimations as indicative-only', async () => {
    const request: PatternMeasurementEstimationRequest = {
      garmentType: 'ROBE',
      gender: null,
      knownMeasurements: { TOUR_POITRINE: 88 },
      requiredKeys: ['TOUR_BASSIN'],
    };
    const response: PatternMeasurementEstimationResponse = {
      estimatedMeasurements: { TOUR_BASSIN: 94 },
      estimatedKeys: ['TOUR_BASSIN'],
      confidence: 0.3,
      modelVersion: 'gemini-2.5-flash',
    };
    jest.spyOn(aiClient, 'estimateMissingMeasurements').mockResolvedValue(response);

    const result = await useCase.execute(request);

    expect(result.estimation).toEqual(response);
    expect(result.isIndicativeOnly).toBe(true);
  });

  it('flags fallback model responses as indicative-only regardless of confidence', async () => {
    const request: PatternMeasurementEstimationRequest = {
      garmentType: 'ROBE',
      gender: null,
      knownMeasurements: {},
      requiredKeys: ['TOUR_BASSIN'],
    };
    const response: PatternMeasurementEstimationResponse = {
      estimatedMeasurements: {},
      estimatedKeys: [],
      confidence: 0,
      modelVersion: 'fallback-0.0.0',
    };
    jest.spyOn(aiClient, 'estimateMissingMeasurements').mockResolvedValue(response);

    const result = await useCase.execute(request);

    expect(result.isIndicativeOnly).toBe(true);
  });

  it('defaults modelPreference to the admin-configured setting when the caller does not specify one', async () => {
    jest.spyOn(providerResolver, 'resolveCredentials').mockResolvedValueOnce({
      provider: AiProviderId.LOCAL_STATISTICAL,
      model: 'ansur2-ridge-v1',
    });
    jest.spyOn(aiClient, 'estimateMissingMeasurements').mockResolvedValue({
      estimatedMeasurements: { TOUR_BASSIN: 95 },
      estimatedKeys: ['TOUR_BASSIN'],
      confidence: 0.5,
      modelVersion: 'local-measurement-imputer-ansur2-1.0.0',
    });

    await useCase.execute({
      garmentType: 'ROBE',
      gender: 'FEMME',
      knownMeasurements: {},
      requiredKeys: ['TOUR_BASSIN'],
    });

    expect(aiClient.estimateMissingMeasurements).toHaveBeenCalledWith(
      expect.objectContaining({ modelPreference: 'LOCAL_STATISTICAL' }),
    );
  });

  it('respects an explicit modelPreference from the caller over the provider resolver default', async () => {
    jest.spyOn(aiClient, 'estimateMissingMeasurements').mockResolvedValue({
      estimatedMeasurements: { TOUR_BASSIN: 95 },
      estimatedKeys: ['TOUR_BASSIN'],
      confidence: 0.3,
      modelVersion: 'gemini-2.5-flash',
    });

    await useCase.execute({
      garmentType: 'ROBE',
      gender: 'FEMME',
      knownMeasurements: {},
      requiredKeys: ['TOUR_BASSIN'],
      modelPreference: 'GEMINI',
    });

    expect(aiClient.estimateMissingMeasurements).toHaveBeenCalledWith(
      expect.objectContaining({ modelPreference: 'GEMINI' }),
    );
  });
});
