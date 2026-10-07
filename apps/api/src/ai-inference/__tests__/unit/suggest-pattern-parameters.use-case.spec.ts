import { Test, TestingModule } from '@nestjs/testing';
import { SuggestPatternParametersUseCase } from '../../application/use-cases/suggest-pattern-parameters.use-case';
import { AiServiceHttpClient } from '../../infrastructure/services/ai-service-http-client';
import { PatternAiSuggestionRequest, PatternAiSuggestionResponse } from '@angaly/types';
import { AiProviderResolverService } from '../../application/services/ai-provider-resolver.service';
import { AnalyzeInspirationImageUseCase } from '../../application/use-cases/analyze-inspiration-image.use-case';

describe('SuggestPatternParametersUseCase', () => {
  let useCase: SuggestPatternParametersUseCase;
  let aiClient: AiServiceHttpClient;
  const analyzeInspirationImage = { execute: jest.fn() };

  beforeEach(async () => {
    const mockAiClient = {
      suggestPatternParameters: jest.fn(),
    };
    const mockProviderResolver = {
      resolveCredentials: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuggestPatternParametersUseCase,
        { provide: AiServiceHttpClient, useValue: mockAiClient },
        { provide: AiProviderResolverService, useValue: mockProviderResolver },
        { provide: AnalyzeInspirationImageUseCase, useValue: analyzeInspirationImage },
      ],
    }).compile();

    useCase = module.get<SuggestPatternParametersUseCase>(SuggestPatternParametersUseCase);
    aiClient = module.get<AiServiceHttpClient>(AiServiceHttpClient);
  });

  beforeEach(() => analyzeInspirationImage.execute.mockReset());

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

  const baseRequest: PatternAiSuggestionRequest = {
    garmentType: 'ROBE',
    occasion: null,
    style: null,
    measurements: {},
    inspirationImageUrl: 'https://cdn.angaly.test/photo.jpg',
  };
  const okResponse: PatternAiSuggestionResponse = {
    suggestedCutType: 'EVASEE',
    suggestedDetails: {},
    detectedInspirationFeatures: { neckline: 'col bateau' },
    confidence: 0.8,
    modelVersion: 'v1',
  };

  it('replaces the inspiration image by its extracted features before the text-only suggestion call', async () => {
    analyzeInspirationImage.execute.mockResolvedValue({
      features: { neckline: 'col bateau' },
      suggestedCutType: 'EVASEE',
      confidence: 0.8,
      modelVersion: 'v1',
    });
    const spy = jest.spyOn(aiClient, 'suggestPatternParameters').mockResolvedValue(okResponse);

    await useCase.execute(baseRequest);

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        inspirationImageUrl: null,
        inspirationFeatures: { neckline: 'col bateau' },
      }),
    );
  });

  it('still produces a suggestion when the image cannot be analysed', async () => {
    analyzeInspirationImage.execute.mockRejectedValue(new Error('Image trop volumineuse.'));
    const spy = jest.spyOn(aiClient, 'suggestPatternParameters').mockResolvedValue(okResponse);

    const result = await useCase.execute(baseRequest);

    expect(result.suggestion).toEqual(okResponse);
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ inspirationImageUrl: null, inspirationFeatures: null }),
    );
  });

  it('does not analyse again when features are already provided', async () => {
    jest.spyOn(aiClient, 'suggestPatternParameters').mockResolvedValue(okResponse);

    await useCase.execute({ ...baseRequest, inspirationFeatures: { sleeves: 'longues' } });

    expect(analyzeInspirationImage.execute).not.toHaveBeenCalled();
  });
});
