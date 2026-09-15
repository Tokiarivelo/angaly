import { AiServiceHttpClient } from '../../infrastructure/services/ai-service-http-client';

describe('AiServiceHttpClient', () => {
  let client: AiServiceHttpClient;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    const configService = { get: () => undefined } as any;
    client = new AiServiceHttpClient(configService);
    fetchMock = jest.fn();
    global.fetch = fetchMock as any;
  });

  it('uses AI_SERVICE_URL/AI_SERVICE_TIMEOUT_MS from config when provided', async () => {
    const configService = {
      get: (key: string) => (key === 'AI_SERVICE_URL' ? 'https://ai.angaly.test' : 5000),
    } as any;
    const configuredClient = new AiServiceHttpClient(configService);
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ response: 'ok' }),
    });

    await configuredClient.sendMessageToAssistant('Bonjour');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://ai.angaly.test/v1/chat/assistant',
      expect.any(Object),
    );
  });

  describe('suggestPatternParameters', () => {
    it('posts the request to /v1/pattern/suggest-parameters and returns the suggestion', async () => {
      const suggestion = {
        suggestedCutType: 'SIRENE',
        suggestedDetails: {},
        detectedInspirationFeatures: null,
        confidence: 0.7,
        modelVersion: 'gemini-2.5-flash',
      };
      fetchMock.mockResolvedValue({ ok: true, json: () => Promise.resolve(suggestion) });

      const result = await client.suggestPatternParameters({
        garmentType: 'ROBE',
        occasion: null,
        style: null,
        measurements: {},
        inspirationImageUrl: null,
      });

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/v1/pattern/suggest-parameters'),
        expect.objectContaining({ method: 'POST' }),
      );
      expect(result).toEqual(suggestion);
    });

    it('degrades gracefully to a fallback suggestion when the AI service errors', async () => {
      fetchMock.mockResolvedValue({ ok: false, status: 500 });

      const result = await client.suggestPatternParameters({
        garmentType: 'ROBE',
        occasion: null,
        style: null,
        measurements: {},
        inspirationImageUrl: null,
      });

      expect(result).toEqual({
        suggestedCutType: 'DROITE',
        suggestedDetails: {},
        detectedInspirationFeatures: null,
        confidence: 0,
        modelVersion: 'fallback-0.0.0',
      });
    });
  });

  describe('sendMessageToAssistant', () => {
    it('calls the real /v1/chat/assistant endpoint and returns its response', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ response: 'Bonjour, comment puis-je vous aider ?' }),
      });

      const result = await client.sendMessageToAssistant('Bonjour');

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/v1/chat/assistant'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ message: 'Bonjour' }),
        }),
      );
      expect(result).toBe('Bonjour, comment puis-je vous aider ?');
    });

    it('degrades gracefully instead of throwing when the AI service is unreachable', async () => {
      fetchMock.mockRejectedValue(new Error('ECONNREFUSED'));

      const result = await client.sendMessageToAssistant('Bonjour');

      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('estimateMissingMeasurements', () => {
    it('posts the request and returns the estimation', async () => {
      const response = {
        estimatedMeasurements: { TOUR_BASSIN: 94 },
        estimatedKeys: ['TOUR_BASSIN'],
        confidence: 0.4,
        modelVersion: 'gemini-2.5-flash',
      };
      fetchMock.mockResolvedValue({ ok: true, json: () => Promise.resolve(response) });

      const result = await client.estimateMissingMeasurements({
        garmentType: 'ROBE',
        gender: null,
        knownMeasurements: { TOUR_POITRINE: 88 },
        requiredKeys: ['TOUR_BASSIN'],
      });

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/v1/pattern/estimate-measurements'),
        expect.any(Object),
      );
      expect(result).toEqual(response);
    });

    it('degrades gracefully on failure instead of throwing', async () => {
      fetchMock.mockRejectedValue(new Error('timeout'));

      const result = await client.estimateMissingMeasurements({
        garmentType: 'ROBE',
        gender: null,
        knownMeasurements: {},
        requiredKeys: ['TOUR_BASSIN'],
      });

      expect(result).toEqual({
        estimatedMeasurements: {},
        estimatedKeys: [],
        confidence: 0,
        modelVersion: 'fallback-0.0.0',
      });
    });
  });

  describe('getAvailableModels', () => {
    it('fetches /v1/models and returns the list of usable backends', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ measurementEstimation: ['GEMINI', 'LOCAL_STATISTICAL'] }),
      });

      const result = await client.getAvailableModels();

      expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/v1/models'), expect.any(Object));
      expect(result).toEqual({ measurementEstimation: ['GEMINI', 'LOCAL_STATISTICAL'] });
    });

    it('degrades to GEMINI-only instead of throwing when the AI service is unreachable', async () => {
      fetchMock.mockRejectedValue(new Error('ECONNREFUSED'));

      const result = await client.getAvailableModels();

      expect(result).toEqual({ measurementEstimation: ['GEMINI'] });
    });
  });
});
