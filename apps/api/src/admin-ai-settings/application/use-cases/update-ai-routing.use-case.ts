import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { AiProviderId } from '@angaly/types';
import {
  AI_MODEL_SETTING_REPOSITORY,
  type IAiModelSettingRepository,
} from '../../domain/repositories/ai-model-setting.repository';
import {
  AI_PROVIDER_CONFIG_REPOSITORY,
  type IAiProviderConfigRepository,
} from '../../domain/repositories/ai-provider-config.repository';
import type { AiModelSetting } from '../../domain/entities/ai-model-setting.entity';
import type { UpdateAiRoutingDto } from '../dtos/update-ai-routing.dto';

@Injectable()
export class UpdateAiRoutingUseCase {
  constructor(
    @Inject(AI_MODEL_SETTING_REPOSITORY)
    private readonly routingRepository: IAiModelSettingRepository,
    @Inject(AI_PROVIDER_CONFIG_REPOSITORY)
    private readonly configRepository: IAiProviderConfigRepository,
  ) {}

  async execute(dto: UpdateAiRoutingDto, userId: string): Promise<AiModelSetting> {
    if (dto.measurementProvider) {
      await this.validateProvider(
        dto.measurementProvider,
        'l’estimation des mesures',
      );
    }

    if (dto.patternSuggestionProvider) {
      await this.validateProvider(
        dto.patternSuggestionProvider,
        'la suggestion de coupe',
      );
    }

    return this.routingRepository.updateRouting({
      measurementProvider: dto.measurementProvider,
      patternSuggestionProvider: dto.patternSuggestionProvider,
      measurementModel: dto.measurementModel,
      updatedById: userId,
    });
  }

  private async validateProvider(provider: AiProviderId, usageLabel: string): Promise<void> {
    if (provider === AiProviderId.LOCAL_STATISTICAL) {
      return; // Built-in local provider is always available
    }

    const config = await this.configRepository.findByProvider(provider);
    if (!config) {
      throw new BadRequestException(
        `Le fournisseur sélectionné pour ${usageLabel} n'est pas encore configuré. Veuillez d'abord renseigner sa clé API et ses paramètres.`,
      );
    }

    if (!config.enabled) {
      throw new BadRequestException(
        `Le fournisseur sélectionné pour ${usageLabel} est actuellement désactivé. Veuillez d'abord l'activer.`,
      );
    }
  }
}
