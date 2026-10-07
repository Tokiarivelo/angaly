import { AiProviderId } from '@angaly/types';
import { HttpProviderModelsFetcher } from '../../infrastructure/services/http-provider-models-fetcher';

const mockFetch = (body: unknown, ok = true) =>
  jest.spyOn(global, 'fetch').mockResolvedValue({
    ok,
    status: ok ? 200 : 401,
    json: async () => body,
  } as Response);

describe('HttpProviderModelsFetcher', () => {
  afterEach(() => jest.restoreAllMocks());

  it('lists Anthropic models', async () => {
    const spy = mockFetch({ data: [{ id: 'claude-b' }, { id: 'claude-a' }] });
    const ids = await new HttpProviderModelsFetcher().fetchModelIds({
      provider: AiProviderId.ANTHROPIC,
      apiKey: 'k',
    });
    expect(ids).toEqual(['claude-a', 'claude-b']);
    expect(spy.mock.calls[0]?.[0]).toContain('api.anthropic.com');
  });

  it('keeps only generateContent Gemini models and drops legacy ones', async () => {
    mockFetch({
      models: [
        { name: 'models/gemini-2.5-flash', supportedGenerationMethods: ['generateContent'] },
        { name: 'models/gemini-1.5-pro', supportedGenerationMethods: ['generateContent'] },
        { name: 'models/text-embedding-004', supportedGenerationMethods: ['embedContent'] },
      ],
    });
    const ids = await new HttpProviderModelsFetcher().fetchModelIds({
      provider: AiProviderId.GEMINI,
      apiKey: 'k',
    });
    expect(ids).toEqual(['gemini-2.5-flash']);
  });

  it('filters embeddings, deprecated and legacy models on OpenAI-compatible APIs', async () => {
    mockFetch({
      data: [
        { id: 'gpt-4o' },
        { id: 'text-embedding-3-small' },
        { id: 'gpt-3.5-turbo' },
        { id: 'whisper-1' },
        { id: 'old-model', deprecated: true },
      ],
    });
    const ids = await new HttpProviderModelsFetcher().fetchModelIds({
      provider: AiProviderId.OPENAI,
      apiKey: 'k',
    });
    expect(ids).toEqual(['gpt-4o']);
  });

  it('caches results between calls', async () => {
    const spy = mockFetch({ data: [{ id: 'gpt-4o' }] });
    const fetcher = new HttpProviderModelsFetcher();
    const query = { provider: AiProviderId.OPENAI, apiKey: 'k' };
    await fetcher.fetchModelIds(query);
    await fetcher.fetchModelIds(query);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('throws when the provider rejects the request', async () => {
    mockFetch({}, false);
    await expect(
      new HttpProviderModelsFetcher().fetchModelIds({ provider: AiProviderId.ANTHROPIC, apiKey: 'bad' }),
    ).rejects.toThrow('HTTP 401');
  });
});
