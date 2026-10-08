import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { AiProviderId } from '@angaly/types';
import {
  AI_PROVIDER_CONFIG_REPOSITORY,
  type IAiProviderConfigRepository,
} from '../../domain/repositories/ai-provider-config.repository';
import {
  AI_MODEL_SETTING_REPOSITORY,
  type IAiModelSettingRepository,
} from '../../domain/repositories/ai-model-setting.repository';

@Injectable()
export class RemoveAiProviderUseCase {
  constructor(
    @Inject(AI_PROVIDER_CONFIG_REPOSITORY)
    private readonly configRepository: IAiProviderConfigRepository,
    @Inject(AI_MODEL_SETTING_REPOSITORY)
    private readonly routingRepository: IAiModelSettingRepository,
  ) {}

  async execute(providerId: AiProviderId): Promise<void> {
    if (providerId === AiProviderId.LOCAL_STATISTICAL) {
      throw new BadRequestException(
        'Le modèle statistique local intégré ne peut pas être supprimé.',
      );
    }

    const existing = await this.configRepository.findByProvider(providerId);
    if (!existing) {
      throw new NotFoundException(`Aucune configuration trouvée pour le fournisseur "${providerId}".`);
    }

    const routing = await this.routingRepository.get();
    if (
      routing.measurementProvider === providerId ||
      routing.patternSuggestionProvider === providerId ||
      routing.patternSuggestionFallbacks.includes(providerId)
    ) {
      throw new BadRequestException(
        'Impossible de supprimer ce fournisseur car il est actuellement actif pour l’atelier. Modifiez d’abord l’affectation du modèle actif.',
      );
    }

    await this.configRepository.deleteByProvider(providerId);
  }
}
