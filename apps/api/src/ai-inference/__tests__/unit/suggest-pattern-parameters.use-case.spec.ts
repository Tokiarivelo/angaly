import { Test, TestingModule } from '@nestjs/testing';
import { SuggestPatternParametersUseCase } from '../../application/use-cases/suggest-pattern-parameters.use-case';
import { AiServiceHttpClient } from '../../infrastructure/services/ai-service-http-client';
import { PatternAiSuggestionRequest, PatternAiSuggestionResponse } from '@angaly/types';

describe('SuggestPatternParametersUseCase', () => {
  let useCase: SuggestPatternParametersUseCase;
  let aiClient: AiServiceHttpClient;

  beforeEach(async () => {
    const mockAiClient = {
      suggestPatternParameters: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuggestPatternParametersUseCase,
        { provide: AiServiceHttpClient, useValue: mockAiClient },
      ],
    }).compile();

    useCase = module.get<SuggestPatternParametersUseCase>(SuggestPatternParametersUseCase);
    aiClient = module.get<AiServiceHttpClient>(AiServiceHttpClient);
  });

  it('should return valid suggestion and flag as indicative if confidence is low', async () => {
    const request: PatternAiSuggestionRequest = {
      garmentType: 'JUPE',
      occasion: null,
      style: null,
      measurements: {},
      inspirationImageUrl: null,
    };

    const response: PatternAiSuggestionResponse = {
      suggestedCutType: 'DROITE',
      suggestedDetails: {},
      detectedInspirationFeatures: null,
      confidence: 0.1, // low
      modelVersion: 'placeholder-0.0.0',
    };

    jest.spyOn(aiClient, 'suggestPatternParameters').mockResolvedValue(response);

    const result = await useCase.execute(request);

    expect(result.suggestion).toEqual(response);
    expect(result.isIndicativeOnly).toBe(true);
  });

  it('should return isIndicativeOnly false if confidence is high and model is not placeholder', async () => {
    const request: PatternAiSuggestionRequest = {
      garmentType: 'JUPE',
      occasion: null,
      style: null,
      measurements: {},
      inspirationImageUrl: null,
    };

    const response: PatternAiSuggestionResponse = {
      suggestedCutType: 'DROITE',
      suggestedDetails: {},
      detectedInspirationFeatures: null,
      confidence: 0.9, // high
      modelVersion: 'v1.0.0-final',
    };

    jest.spyOn(aiClient, 'suggestPatternParameters').mockResolvedValue(response);

    const result = await useCase.execute(request);

    expect(result.suggestion).toEqual(response);
    expect(result.isIndicativeOnly).toBe(false);
  });
});
