import { Inject, Injectable } from '@nestjs/common';
import type { AiProviderConfigView } from '@angaly/types';
import {
  AI_PROVIDER_CONFIG_REPOSITORY,
  type IAiProviderConfigRepository,
} from '../../domain/repositories/ai-provider-config.repository';
import { AI_PROVIDER_CATALOG } from '../../domain/constants/ai-provider-catalog';
import type { AiProvidersListResponseDto } from '../dtos/ai-provider-response.dto';

@Injectable()
export class ListAiProvidersUseCase {
  constructor(
    @Inject(AI_PROVIDER_CONFIG_REPOSITORY)
    private readonly repository: IAiProviderConfigRepository,
  ) {}

  async execute(): Promise<AiProvidersListResponseDto> {
    const configs = await this.repository.findAll();

    const configured: AiProviderConfigView[] = configs.map((config) => ({
      provider: config.provider,
      model: config.model,
      baseUrl: config.baseUrl,
      apiKeyMasked: config.apiKeyLast4 ? `••••••••${config.apiKeyLast4}` : null,
      status: config.status,
      lastTestedAt: config.lastTestedAt ? config.lastTestedAt.toISOString() : null,
      lastLatencyMs: config.lastLatencyMs,
      enabled: config.enabled,
      updatedAt: config.updatedAt.toISOString(),
    }));

    return {
      catalog: AI_PROVIDER_CATALOG,
      configured,
    };
  }
}
