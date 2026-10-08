import { Inject, Injectable, Logger } from '@nestjs/common';
import { AiProviderId, AiUsage, type ProviderCredentials } from '@angaly/types';
import { GetAiModelSettingUseCase } from '../../../admin-ai-settings/application/use-cases/get-ai-model-setting.use-case';
import {
  AI_PROVIDER_CONFIG_REPOSITORY,
  type IAiProviderConfigRepository,
} from '../../../admin-ai-settings/domain/repositories/ai-provider-config.repository';
import {
  SECRET_CIPHER,
  type ISecretCipher,
} from '../../../admin-ai-settings/domain/services/secret-cipher.service';
import { findCatalogEntry } from '../../../admin-ai-settings/domain/constants/ai-provider-catalog';

@Injectable()
export class AiProviderResolverService {
  private readonly logger = new Logger(AiProviderResolverService.name);

  constructor(
    private readonly getAiModelSetting: GetAiModelSettingUseCase,
    @Inject(AI_PROVIDER_CONFIG_REPOSITORY)
    private readonly providerConfigRepo: IAiProviderConfigRepository,
    @Inject(SECRET_CIPHER)
    private readonly cipher: ISecretCipher,
  ) {}

  /**
   * Resolves the active provider credentials for a given atelier usage.
   * Decrypts the secret API key internally before delegating to apps/ai-service.
   * Specified in docs/features/ai-providers.md §5.
   */
  async resolveCredentials(usage: AiUsage): Promise<ProviderCredentials | undefined> {
    try {
      const setting = await this.getAiModelSetting.execute();
      const providerId =
        usage === AiUsage.MEASUREMENT_ESTIMATION
          ? setting.measurementProvider
          : setting.patternSuggestionProvider;

      if (!providerId) {
        return undefined;
      }

      return await this.credentialsFor(providerId, usage);
    } catch (err: unknown) {
      this.logger.error(
        `Erreur lors de la résolution du fournisseur IA pour l'usage "${usage}": ${err instanceof Error ? err.message : String(err)}`,
      );
      return undefined;
    }
  }

  /**
   * Backup models for photo analysis, in the admin's order. Providers that are disabled, not
   * configured or unable to read a photo (local statistical) are skipped — never an error.
   */
  async resolveFallbackChain(usage: AiUsage): Promise<ProviderCredentials[]> {
    try {
      const setting = await this.getAiModelSetting.execute();
      const chain: ProviderCredentials[] = [];
      for (const providerId of setting.patternSuggestionFallbacks ?? []) {
        if (providerId === AiProviderId.LOCAL_STATISTICAL) continue;
        const credentials = await this.credentialsFor(providerId, usage);
        if (credentials) chain.push(credentials);
      }
      return chain;
    } catch (err: unknown) {
      this.logger.error(
        `Erreur lors de la résolution des modèles de repli : ${err instanceof Error ? err.message : String(err)}`,
      );
      return [];
    }
  }

  /**
   * Resolves credentials for an explicitly chosen provider (Pattern Studio model picker).
   * Returns undefined when the provider is not usable, so callers fall back to the atelier default.
   */
  async resolveSelected(
    providerId: AiProviderId | undefined,
    usage: AiUsage,
  ): Promise<ProviderCredentials | undefined> {
    if (!providerId) return undefined;
    try {
      return await this.credentialsFor(providerId, usage);
    } catch (err: unknown) {
      this.logger.error(
        `Erreur lors de la résolution du fournisseur choisi "${providerId}": ${err instanceof Error ? err.message : String(err)}`,
      );
      return undefined;
    }
  }

  private async credentialsFor(
    providerId: AiProviderId,
    usage: AiUsage,
  ): Promise<ProviderCredentials | undefined> {
    if (providerId === AiProviderId.LOCAL_STATISTICAL) {
      return {
        provider: AiProviderId.LOCAL_STATISTICAL,
        model: 'ansur2-ridge-v1',
      };
    }

    const catalogEntry = findCatalogEntry(providerId);
    const config = await this.providerConfigRepo.findByProvider(providerId);

    if (!config?.enabled) {
      this.logger.warn(
        `Fournisseur "${providerId}" pour l'usage "${usage}" non configuré ou désactivé. Repli par défaut.`,
      );
      return undefined;
    }

    let apiKey: string | undefined;
    if (catalogEntry?.requiresApiKey && config.apiKeyCipher) {
      try {
        apiKey = await this.cipher.decrypt(config.apiKeyCipher);
      } catch (decryptErr: unknown) {
        this.logger.error(
          `Échec du déchiffrement de la clé API pour "${providerId}": ${decryptErr instanceof Error ? decryptErr.message : String(decryptErr)}`,
        );
        return undefined;
      }
    }

    this.logger.log(`Fournisseur résolu pour "${usage}" : ${providerId}/${config.model}`);
    return {
      provider: providerId,
      model: config.model,
      apiKey,
      baseUrl: config.baseUrl ?? undefined,
    };
  }
}
