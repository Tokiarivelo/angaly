import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { AiProviderConfigView, AiProviderId } from '@angaly/types';
import {
  AI_PROVIDER_CONFIG_REPOSITORY,
  type IAiProviderConfigRepository,
} from '../../domain/repositories/ai-provider-config.repository';
import { SECRET_CIPHER, type ISecretCipher } from '../../domain/services/secret-cipher.service';
import { findCatalogEntry } from '../../domain/constants/ai-provider-catalog';
import type { UpsertAiProviderDto } from '../dtos/upsert-ai-provider.dto';
import { validateProviderBaseUrl } from '../utils/ssrf-validator';

@Injectable()
export class UpsertAiProviderUseCase {
  constructor(
    @Inject(AI_PROVIDER_CONFIG_REPOSITORY)
    private readonly repository: IAiProviderConfigRepository,
    @Inject(SECRET_CIPHER)
    private readonly cipher: ISecretCipher,
  ) {}

  async execute(
    providerId: AiProviderId,
    dto: UpsertAiProviderDto,
    userId: string,
  ): Promise<AiProviderConfigView> {
    const catalogEntry = findCatalogEntry(providerId);
    if (!catalogEntry) {
      throw new NotFoundException(`Fournisseur d’IA inconnu : "${providerId}".`);
    }

    // Base URL validation & SSRF protection
    let baseUrl = dto.baseUrl?.trim() || null;
    if (catalogEntry.requiresBaseUrl && !baseUrl) {
      baseUrl = catalogEntry.defaultBaseUrl || null;
      if (!baseUrl) {
        throw new BadRequestException(
          `Une URL de base est requise pour le fournisseur ${catalogEntry.name}.`,
        );
      }
    }

    if (baseUrl) {
      validateProviderBaseUrl(baseUrl);
    }

    // Existing config lookup
    const existing = await this.repository.findByProvider(providerId);

    // API Key handling
    const apiKeyTrimmed = dto.apiKey?.trim();
    let apiKeyCipher: string | null | undefined = undefined;
    let apiKeyLast4: string | null | undefined = undefined;

    if (apiKeyTrimmed && apiKeyTrimmed.length > 0) {
      apiKeyCipher = await this.cipher.encrypt(apiKeyTrimmed);
      apiKeyLast4 = apiKeyTrimmed.slice(-4);
    } else if (!existing) {
      if (catalogEntry.requiresApiKey) {
        throw new BadRequestException(
          `Une clé API est requise pour initialiser le fournisseur ${catalogEntry.name}.`,
        );
      }
      apiKeyCipher = null;
      apiKeyLast4 = null;
    }
    // If updating and apiKey is omitted, apiKeyCipher remains undefined (preserving existing)

    const updated = await this.repository.upsert({
      provider: providerId,
      model: dto.model.trim() || catalogEntry.defaultModel,
      baseUrl,
      apiKeyCipher,
      apiKeyLast4,
      enabled: dto.enabled ?? true,
      updatedById: userId,
    });

    return {
      provider: updated.provider,
      model: updated.model,
      baseUrl: updated.baseUrl,
      apiKeyMasked: updated.apiKeyLast4 ? `••••••••${updated.apiKeyLast4}` : null,
      status: updated.status,
      lastTestedAt: updated.lastTestedAt ? updated.lastTestedAt.toISOString() : null,
      lastLatencyMs: updated.lastLatencyMs,
      enabled: updated.enabled,
      updatedAt: updated.updatedAt.toISOString(),
    };
  }
}
