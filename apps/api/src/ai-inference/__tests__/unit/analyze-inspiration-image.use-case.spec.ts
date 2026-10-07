import { createHash } from 'node:crypto';
import type { InspirationAnalysisResponse } from '@angaly/types';
import { AnalyzeInspirationImageUseCase } from '../../application/use-cases/analyze-inspiration-image.use-case';
import type { IInspirationAnalysisRepository } from '../../domain/repositories/inspiration-analysis.repository';
import type { IInspirationImagePreprocessor } from '../../domain/services/inspiration-image-preprocessor.service';

describe('AnalyzeInspirationImageUseCase', () => {
  const original = Buffer.from('original-photo-bytes');
  const hash = createHash('sha256').update(original).digest('hex');
  const analysis: InspirationAnalysisResponse = {
    features: { neckline: 'col bateau' },
    suggestedCutType: 'EVASEE',
    confidence: 0.8,
    modelVersion: 'claude-haiku-4-5-20251001',
  };

  let preprocessor: jest.Mocked<IInspirationImagePreprocessor>;
  let repository: jest.Mocked<IInspirationAnalysisRepository>;
  const aiClient = { analyzeInspiration: jest.fn() };
  const resolver = { resolveCredentials: jest.fn() };
  let useCase: AnalyzeInspirationImageUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    preprocessor = {
      fetchOriginal: jest.fn().mockResolvedValue(original),
      downscale: jest.fn().mockResolvedValue({
        buffer: Buffer.from('small'),
        mimeType: 'image/jpeg',
        width: 768,
        height: 1024,
      }),
    };
    repository = { findByHash: jest.fn().mockResolvedValue(null), save: jest.fn() };
    resolver.resolveCredentials.mockResolvedValue({ provider: 'ANTHROPIC', model: 'm' });
    aiClient.analyzeInspiration.mockResolvedValue(analysis);
    useCase = new AnalyzeInspirationImageUseCase(
      preprocessor,
      repository,
      aiClient as never,
      resolver as never,
    );
  });

  it('returns the cached analysis without downscaling or calling the vision model', async () => {
    repository.findByHash.mockResolvedValue(analysis);

    const result = await useCase.execute('https://cdn.angaly.test/p.jpg');

    expect(repository.findByHash).toHaveBeenCalledWith(hash);
    expect(result).toEqual(analysis);
    expect(preprocessor.downscale).not.toHaveBeenCalled();
    expect(aiClient.analyzeInspiration).not.toHaveBeenCalled();
  });

  it('sends the downscaled image once and caches the result by original hash', async () => {
    const result = await useCase.execute('https://cdn.angaly.test/p.jpg');

    expect(aiClient.analyzeInspiration).toHaveBeenCalledWith(
      expect.objectContaining({
        imageBase64: Buffer.from('small').toString('base64'),
        mimeType: 'image/jpeg',
      }),
    );
    expect(repository.save).toHaveBeenCalledWith(hash, analysis);
    expect(result).toEqual(analysis);
  });

  it('does not cache a fallback analysis', async () => {
    aiClient.analyzeInspiration.mockResolvedValue({
      features: {},
      suggestedCutType: null,
      confidence: 0,
      modelVersion: 'fallback-0.0.0',
    });

    await useCase.execute('https://cdn.angaly.test/p.jpg');

    expect(repository.save).not.toHaveBeenCalled();
  });

  it('propagates download errors', async () => {
    preprocessor.fetchOriginal.mockRejectedValue(new Error('Image trop volumineuse.'));
    await expect(useCase.execute('https://cdn.angaly.test/p.jpg')).rejects.toThrow('trop volumineuse');
  });
});
