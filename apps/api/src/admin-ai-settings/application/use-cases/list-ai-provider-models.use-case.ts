import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { AiProviderId, AiProviderModelsResponse } from '@angaly/types';
import {
  AI_PROVIDER_CONFIG_REPOSITORY,
  type IAiProviderConfigRepository,
} from '../../domain/repositories/ai-provider-config.repository';
import { SECRET_CIPHER, type ISecretCipher } from '../../domain/services/secret-cipher.service';
import {
  PROVIDER_MODELS_FETCHER,
  type IProviderModelsFetcher,
} from '../../domain/services/provider-models-fetcher.service';
import { findCatalogEntry } from '../../domain/constants/ai-provider-catalog';

const DEFAULT_LIMIT = 100;

@Injectable()
export class ListAiProviderModelsUseCase {
  constructor(
    @Inject(AI_PROVIDER_CONFIG_REPOSITORY)
    private readonly repository: IAiProviderConfigRepository,
    @Inject(SECRET_CIPHER)
    private readonly cipher: ISecretCipher,
    @Inject(PROVIDER_MODELS_FETCHER)
    private readonly fetcher: IProviderModelsFetcher,
  ) {}

  async execute(
    providerId: AiProviderId,
    search?: string,
    limit: number = DEFAULT_LIMIT,
  ): Promise<AiProviderModelsResponse> {
    const catalogEntry = findCatalogEntry(providerId);
    if (!catalogEntry) {
      throw new NotFoundException(`Fournisseur d’IA inconnu : "${providerId}".`);
    }
    const config = await this.repository.findByProvider(providerId);
    if (!config) {
      throw new NotFoundException(
        `Le fournisseur "${catalogEntry.name}" n’est pas configuré. Veuillez d’abord renseigner ses paramètres.`,
      );
    }

    const needle = search?.trim().toLowerCase() ?? '';
    const filter = (ids: string[]) =>
      ids.filter((id) => id.toLowerCase().includes(needle)).slice(0, limit).map((id) => ({ id }));

    try {
      const apiKey = config.apiKeyCipher ? await this.cipher.decrypt(config.apiKeyCipher) : undefined;
      const ids = await this.fetcher.fetchModelIds({
        provider: providerId,
        apiKey,
        baseUrl: config.baseUrl,
      });
      return { provider: providerId, models: filter(ids), source: 'remote' };
    } catch (err) {
      return {
        provider: providerId,
        models: filter(catalogEntry.suggestedModels),
        source: 'fallback',
        message: `Liste distante indisponible (${err instanceof Error ? err.message : 'erreur inconnue'}) — suggestions du catalogue affichées.`,
      };
    }
  }
}
