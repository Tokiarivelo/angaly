import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import { EstimateMissingMeasurementsUseCase } from '../../application/use-cases/estimate-missing-measurements.use-case';
import { AiServiceHttpClient } from '../../infrastructure/services/ai-service-http-client';
import { GetAiModelSettingUseCase } from '../../../admin-ai-settings/application/use-cases/get-ai-model-setting.use-case';
import { AiModelSetting } from '../../../admin-ai-settings/domain/entities/ai-model-setting.entity';
import type {
  PatternMeasurementEstimationRequest,
  PatternMeasurementEstimationResponse,
} from '@angaly/types';

describe('EstimateMissingMeasurementsUseCase', () => {
  let useCase: EstimateMissingMeasurementsUseCase;
  let aiClient: AiServiceHttpClient;
  let getAiModelSetting: GetAiModelSettingUseCase;

  beforeEach(async () => {
    const mockAiClient = {
      estimateMissingMeasurements: jest.fn(),
    };
    const mockGetAiModelSetting = {
      execute: jest.fn().mockResolvedValue(
        new AiModelSetting('singleton', 'GEMINI', null, new Date(), new Date()),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EstimateMissingMeasurementsUseCase,
        { provide: AiServiceHttpClient, useValue: mockAiClient },
        { provide: GetAiModelSettingUseCase, useValue: mockGetAiModelSetting },
      ],
    }).compile();

    useCase = module.get<EstimateMissingMeasurementsUseCase>(EstimateMissingMeasurementsUseCase);
    aiClient = module.get<AiServiceHttpClient>(AiServiceHttpClient);
    getAiModelSetting = module.get<GetAiModelSettingUseCase>(GetAiModelSettingUseCase);
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
    jest.spyOn(getAiModelSetting, 'execute').mockResolvedValueOnce(
      new AiModelSetting('singleton', 'LOCAL_STATISTICAL', 'admin-1', new Date(), new Date()),
    );
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

  it('respects an explicit modelPreference from the caller over the admin default', async () => {
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

    expect(getAiModelSetting.execute).not.toHaveBeenCalled();
    expect(aiClient.estimateMissingMeasurements).toHaveBeenCalledWith(
      expect.objectContaining({ modelPreference: 'GEMINI' }),
    );
  });
});
