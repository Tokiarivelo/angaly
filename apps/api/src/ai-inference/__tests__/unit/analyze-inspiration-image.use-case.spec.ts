/* eslint-disable @typescript-eslint/unbound-method -- jest.Mocked ports are asserted on directly */
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
    profile: {
      isGarment: true,
      garmentType: 'ROBE',
      occasion: null,
      style: null,
      cutType: 'EVASEE',
      details: {},
    },
    suggestedCutType: 'EVASEE',
    confidence: 0.8,
    modelVersion: 'claude-haiku-4-5-20251001',
  };

  let preprocessor: jest.Mocked<IInspirationImagePreprocessor>;
  let repository: jest.Mocked<IInspirationAnalysisRepository>;
  const aiClient = { analyzeInspiration: jest.fn() };
  const resolver = { resolveCredentials: jest.fn(), resolveFallbackChain: jest.fn() };
  const collector = { collectInspirationAnalysis: jest.fn().mockResolvedValue(undefined) };
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
    resolver.resolveCredentials.mockResolvedValue({ provider: 'ANTHROPIC', model: 'claude-haiku-4-5-20251001' });
    resolver.resolveFallbackChain.mockResolvedValue([]);
    aiClient.analyzeInspiration.mockResolvedValue(analysis);
    collector.collectInspirationAnalysis.mockClear();
    useCase = new AnalyzeInspirationImageUseCase(
      preprocessor,
      repository,
      aiClient as never,
      resolver as never,
      collector as never,
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

  it('keeps a fresh external answer as a training pair, but not a cache hit', async () => {
    await useCase.execute('https://cdn.angaly.test/p.jpg');
    expect(collector.collectInspirationAnalysis).toHaveBeenCalledWith(
      expect.objectContaining({ imageHash: hash, providerId: 'ANTHROPIC', analysis }),
    );

    collector.collectInspirationAnalysis.mockClear();
    repository.findByHash.mockResolvedValue(analysis);
    await useCase.execute('https://cdn.angaly.test/p.jpg');
    expect(collector.collectInspirationAnalysis).not.toHaveBeenCalled();
  });

  it('does not reuse an answer produced by a different model than the selected one', async () => {
    repository.findByHash.mockResolvedValue({ ...analysis, modelVersion: 'gemini-2.5-flash' });

    await useCase.execute('https://cdn.angaly.test/p.jpg');

    expect(aiClient.analyzeInspiration).toHaveBeenCalledTimes(1);
  });

  it('re-reads a legacy cached row that has no garment profile yet', async () => {
    repository.findByHash.mockResolvedValue({ ...analysis, profile: null });

    await useCase.execute('https://cdn.angaly.test/p.jpg');

    expect(aiClient.analyzeInspiration).toHaveBeenCalledTimes(1);
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

  describe('fallback models', () => {
    const claude = { provider: 'ANTHROPIC', model: 'claude-haiku-4-5-20251001' };
    const openai = { provider: 'OPENAI', model: 'gpt-4o-mini' };
    const failed = { features: {}, suggestedCutType: null, confidence: 0, modelVersion: 'fallback-0.0.0' };

    it('skips the local statistical model (no vision) and uses the atelier default', async () => {
      const result = await useCase.executeWithAttempts('https://cdn.angaly.test/p.jpg', {
        provider: 'LOCAL_STATISTICAL',
        model: 'ansur2-ridge-v1',
      } as never);

      expect(aiClient.analyzeInspiration).toHaveBeenCalledTimes(1);
      expect(aiClient.analyzeInspiration.mock.calls[0][0].provider).toEqual(claude);
      expect(result.attempts).toEqual([
        { provider: 'LOCAL_STATISTICAL', model: 'ansur2-ridge-v1', outcome: 'SKIPPED_NO_VISION' },
        { ...claude, outcome: 'OK' },
      ]);
      expect(result.analysis).toEqual(analysis);
    });

    it('tries the next fallback when the first model fails or throws', async () => {
      resolver.resolveFallbackChain.mockResolvedValue([openai]);
      aiClient.analyzeInspiration
        .mockRejectedValueOnce(new Error('boom'))
        .mockResolvedValueOnce({ ...analysis, modelVersion: 'gpt-4o-mini' });

      const result = await useCase.executeWithAttempts('https://cdn.angaly.test/p.jpg');

      expect(aiClient.analyzeInspiration).toHaveBeenCalledTimes(2);
      expect(result.attempts.map((a) => a.outcome)).toEqual(['FAILED', 'OK']);
      expect(result.analysis.modelVersion).toBe('gpt-4o-mini');
      expect(repository.save).toHaveBeenCalledTimes(1);
      expect(collector.collectInspirationAnalysis).toHaveBeenCalledWith(
        expect.objectContaining({ providerId: 'OPENAI' }),
      );
    });

    it('does not retry the same model twice and gives up cleanly when all fail', async () => {
      resolver.resolveFallbackChain.mockResolvedValue([claude, openai]);
      aiClient.analyzeInspiration.mockResolvedValue(failed);

      const result = await useCase.executeWithAttempts('https://cdn.angaly.test/p.jpg');

      expect(aiClient.analyzeInspiration).toHaveBeenCalledTimes(2); // claude (deduped) + openai
      expect(result.attempts.map((a) => a.outcome)).toEqual(['FAILED', 'FAILED']);
      expect(result.analysis.confidence).toBe(0);
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('returns a neutral fallback answer when every model throws', async () => {
      aiClient.analyzeInspiration.mockRejectedValue(new Error('down'));
      const result = await useCase.executeWithAttempts('https://cdn.angaly.test/p.jpg');
      expect(result.analysis.modelVersion).toBe('fallback-0.0.0');
      expect(result.analysis.profile).toBeNull();
    });

    it('reuses a cached answer made by a fallback model', async () => {
      resolver.resolveFallbackChain.mockResolvedValue([openai]);
      repository.findByHash.mockResolvedValue({ ...analysis, modelVersion: 'gpt-4o-mini' });
      await useCase.execute('https://cdn.angaly.test/p.jpg');
      expect(aiClient.analyzeInspiration).not.toHaveBeenCalled();
    });

    it('falls back to the ai-service default when no model is configured at all', async () => {
      resolver.resolveCredentials.mockResolvedValue(undefined);
      await useCase.execute('https://cdn.angaly.test/p.jpg');
      expect(aiClient.analyzeInspiration.mock.calls[0][0]).not.toHaveProperty('provider');
    });
  });
});
