import { Injectable } from '@nestjs/common';
import { AiProviderId } from '@angaly/types';
import type {
  IProviderModelsFetcher,
  ProviderModelsQuery,
} from '../../domain/services/provider-models-fetcher.service';
import { findCatalogEntry } from '../../domain/constants/ai-provider-catalog';
import { validateProviderBaseUrl } from '../../application/utils/ssrf-validator';

const REQUEST_TIMEOUT_MS = 8000;
const CACHE_TTL_MS = 5 * 60 * 1000;
const OPENAI_BASE_URL = 'https://api.openai.com/v1';

/** Non-chat / legacy families that must not be proposed for JSON-structured inference. */
const EXCLUDED_MODEL_PATTERN =
  /embed|whisper|tts|dall-e|moderation|babbage|davinci|realtime|transcribe|image|rerank|guard|aqa|bison|gecko|gpt-3\.5|gpt-4-(0|1)|gemini-(1\.|pro-vision)|^text-|instruct$/i;

interface CacheEntry {
  expiresAt: number;
  ids: string[];
}

/**
 * Lists models through each provider's `/models` endpoint (Anthropic, Gemini, OpenAI-compatible)
 * and drops obsolete / non-chat ones. Results are cached briefly so debounced searches
 * do not hit the upstream API on every keystroke.
 */
@Injectable()
export class HttpProviderModelsFetcher implements IProviderModelsFetcher {
  private readonly cache = new Map<string, CacheEntry>();

  async fetchModelIds(query: ProviderModelsQuery): Promise<string[]> {
    const cacheKey = `${query.provider}|${query.baseUrl ?? ''}|${query.apiKey?.slice(-6) ?? ''}`;
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return cached.ids;

    const raw = await this.fetchRaw(query);
    const ids = [...new Set(raw)]
      .filter((id) => !EXCLUDED_MODEL_PATTERN.test(id))
      .sort((a, b) => a.localeCompare(b));

    this.cache.set(cacheKey, { ids, expiresAt: Date.now() + CACHE_TTL_MS });
    return ids;
  }

  private async fetchRaw({ provider, apiKey, baseUrl }: ProviderModelsQuery): Promise<string[]> {
    if (provider === AiProviderId.ANTHROPIC) {
      const body = await this.getJson('https://api.anthropic.com/v1/models?limit=1000', {
        'x-api-key': apiKey ?? '',
        'anthropic-version': '2023-06-01',
      });
      return this.pick(body, 'data', 'id');
    }

    if (provider === AiProviderId.GEMINI) {
      const body = (await this.getJson(
        'https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000',
        { 'x-goog-api-key': apiKey ?? '' },
      )) as { models?: Array<{ name?: string; supportedGenerationMethods?: string[] }> };
      return (body.models ?? [])
        .filter((m) => m.supportedGenerationMethods?.includes('generateContent'))
        .map((m) => (m.name ?? '').replace(/^models\//, ''))
        .filter(Boolean);
    }

    const resolvedBase =
      baseUrl || findCatalogEntry(provider)?.defaultBaseUrl || (provider === AiProviderId.OPENAI ? OPENAI_BASE_URL : null);
    if (!resolvedBase) {
      throw new Error('Liste des modèles non disponible pour ce fournisseur.');
    }
    validateProviderBaseUrl(resolvedBase);

    const headers: Record<string, string> = apiKey ? { Authorization: `Bearer ${apiKey}` } : {};
    const body = await this.getJson(`${resolvedBase.replace(/\/+$/, '')}/models`, headers);
    // OpenAI-compatible payload: { data: [{ id }] }; some servers flag `deprecated`.
    const data = ((body as { data?: Array<{ id?: string; deprecated?: boolean }> }).data ?? []).filter(
      (m) => !m.deprecated,
    );
    return data.map((m) => m.id ?? '').filter(Boolean);
  }

  private pick(body: unknown, listKey: string, idKey: string): string[] {
    const list = ((body as Record<string, unknown>)[listKey] ?? []) as Array<Record<string, string>>;
    return list.map((item) => item[idKey] ?? '').filter(Boolean);
  }

  private async getJson(url: string, headers: Record<string, string>): Promise<unknown> {
    const response = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) {
      throw new Error(`Le fournisseur a répondu HTTP ${response.status}.`);
    }
    return response.json();
  }
}
