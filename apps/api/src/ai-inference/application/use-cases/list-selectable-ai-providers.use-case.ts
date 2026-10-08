import { Inject, Injectable } from '@nestjs/common';
import {
  AiProviderId,
  AiProviderStatus,
  type SelectableAiProvider,
  type SelectableAiProvidersResponse,
} from '@angaly/types';
import {
  AI_PROVIDER_CONFIG_REPOSITORY,
  type IAiProviderConfigRepository,
} from '../../../admin-ai-settings/domain/repositories/ai-provider-config.repository';
import { GetAiModelSettingUseCase } from '../../../admin-ai-settings/application/use-cases/get-ai-model-setting.use-case';
import { findCatalogEntry } from '../../../admin-ai-settings/domain/constants/ai-provider-catalog';

/**
 * Providers a Pattern Studio user may pick for one generation: the built-in local model plus every
 * enabled provider whose last connection test did not fail. Only public facts are returned
 * (id, display name, model) — never keys, base URLs or error details.
 */
@Injectable()
export class ListSelectableAiProvidersUseCase {
  constructor(
    @Inject(AI_PROVIDER_CONFIG_REPOSITORY)
    private readonly repository: IAiProviderConfigRepository,
    private readonly getAiModelSetting: GetAiModelSettingUseCase,
  ) {}

  async execute(): Promise<SelectableAiProvidersResponse> {
    const [configs, setting] = await Promise.all([
      this.repository.findAll(),
      this.getAiModelSetting.execute(),
    ]);

    const providers: SelectableAiProvider[] = [];
    const local = findCatalogEntry(AiProviderId.LOCAL_STATISTICAL);
    if (local) {
      providers.push({
        provider: local.id,
        name: local.name,
        model: local.defaultModel,
        readsPhotos: false,
      });
    }

    for (const config of configs) {
      if (!config.enabled || config.status === AiProviderStatus.INVALID) continue;
      const entry = findCatalogEntry(config.provider);
      if (!entry || entry.id === AiProviderId.LOCAL_STATISTICAL) continue;
      providers.push({ provider: config.provider, name: entry.name, model: config.model, readsPhotos: true });
    }

    return { providers, defaultProvider: setting.patternSuggestionProvider ?? null };
  }
}
