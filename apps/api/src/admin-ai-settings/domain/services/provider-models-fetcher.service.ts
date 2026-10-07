import type { AiProviderId } from '@angaly/types';

export const PROVIDER_MODELS_FETCHER = Symbol('PROVIDER_MODELS_FETCHER');

export interface ProviderModelsQuery {
  provider: AiProviderId;
  apiKey?: string | undefined;
  baseUrl?: string | null | undefined;
}

/** Port : interroge l'API d'un fournisseur et renvoie les identifiants de modèles non obsolètes. */
export interface IProviderModelsFetcher {
  fetchModelIds(query: ProviderModelsQuery): Promise<string[]>;
}
