import type { AiProviderId, AiProviderStatus } from '@angaly/types';
import type { AiProviderConfigEntity } from '../entities/ai-provider-config.entity';

export const AI_PROVIDER_CONFIG_REPOSITORY = 'IAiProviderConfigRepository';

export interface UpsertAiProviderConfigData {
  provider: AiProviderId;
  model: string;
  baseUrl?: string | null;
  apiKeyCipher?: string | null;
  apiKeyLast4?: string | null;
  status?: AiProviderStatus;
  enabled?: boolean;
  updatedById?: string | null;
}

export interface IAiProviderConfigRepository {
  findAll(): Promise<AiProviderConfigEntity[]>;
  findByProvider(provider: AiProviderId): Promise<AiProviderConfigEntity | null>;
  upsert(data: UpsertAiProviderConfigData): Promise<AiProviderConfigEntity>;
  deleteByProvider(provider: AiProviderId): Promise<void>;
  updateTestResult(
    provider: AiProviderId,
    status: AiProviderStatus,
    latencyMs: number,
    testedAt: Date,
  ): Promise<AiProviderConfigEntity>;
}
