import type { InspirationAnalysisResponse } from '@angaly/types';
import { CollectAiTrainingSampleUseCase } from '../../application/use-cases/collect-ai-training-sample.use-case';

describe('CollectAiTrainingSampleUseCase', () => {
  const analysis: InspirationAnalysisResponse = {
    features: { silhouette: 'sirène' },
    profile: {
      isGarment: true,
      garmentType: 'ROBE',
      occasion: null,
      style: null,
      cutType: 'SIRENE',
      details: {},
    },
    suggestedCutType: 'SIRENE',
    confidence: 0.8,
    modelVersion: 'claude-haiku-4-5-20251001',
  };
  const input = { imageHash: 'h1', imageUrl: 'https://cdn/p.jpg', providerId: 'ANTHROPIC', analysis };
  const label = { garmentType: 'ROBE', occasion: 'SOIREE', style: null, cutType: 'SIRENE', details: {} };

  const build = (enabled = 'true') => {
    const repository = {
      saveIfAbsent: jest.fn().mockResolvedValue(undefined),
      confirmLabelByMediaId: jest.fn().mockResolvedValue(undefined),
    };
    const config = { get: jest.fn().mockReturnValue(enabled) };
    return { repository, useCase: new CollectAiTrainingSampleUseCase(repository, config as never) };
  };

  it('stores the external model input reference and output', async () => {
    const { repository, useCase } = build();
    await useCase.collectInspirationAnalysis(input);
    expect(repository.saveIfAbsent).toHaveBeenCalledWith(
      expect.objectContaining({
        task: 'INSPIRATION_ANALYSIS',
        inputHash: 'h1',
        imageUrl: 'https://cdn/p.jpg',
        providerId: 'ANTHROPIC',
        output: { profile: analysis.profile, features: analysis.features },
      }),
    );
  });

  it.each([
    ['a fallback answer', { ...analysis, modelVersion: 'fallback-0.0.0' }],
    ['a zero-confidence answer', { ...analysis, confidence: 0 }],
    ['an answer without profile', { ...analysis, profile: null }],
  ])('does not store %s', async (_name, bad) => {
    const { repository, useCase } = build();
    await useCase.collectInspirationAnalysis({ ...input, analysis: bad });
    expect(repository.saveIfAbsent).not.toHaveBeenCalled();
  });

  it('collects nothing when switched off', async () => {
    const { repository, useCase } = build('false');
    await useCase.collectInspirationAnalysis(input);
    await useCase.confirmInspirationLabel('media-1', label);
    expect(repository.saveIfAbsent).not.toHaveBeenCalled();
    expect(repository.confirmLabelByMediaId).not.toHaveBeenCalled();
  });

  it('labels the sample of the photo with the customer final choices', async () => {
    const { repository, useCase } = build();
    await useCase.confirmInspirationLabel('media-1', label);
    expect(repository.confirmLabelByMediaId).toHaveBeenCalledWith(
      'INSPIRATION_ANALYSIS',
      'media-1',
      { isGarment: true, ...label },
    );
  });

  it('ignores projects without a photo and never throws', async () => {
    const { repository, useCase } = build();
    await useCase.confirmInspirationLabel(null, label);
    expect(repository.confirmLabelByMediaId).not.toHaveBeenCalled();

    repository.saveIfAbsent.mockRejectedValue(new Error('db down'));
    await expect(useCase.collectInspirationAnalysis(input)).resolves.toBeUndefined();
  });
});
