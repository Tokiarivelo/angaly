import type { AiProviderId, AiProviderStatus } from '@angaly/types';

export class AiProviderConfigEntity {
  constructor(
    public readonly id: string,
    public readonly provider: AiProviderId,
    public readonly model: string,
    public readonly baseUrl: string | null,
    public readonly apiKeyCipher: string | null,
    public readonly apiKeyLast4: string | null,
    public readonly status: AiProviderStatus,
    public readonly lastTestedAt: Date | null,
    public readonly lastLatencyMs: number | null,
    public readonly enabled: boolean,
    public readonly updatedById: string | null,
    public readonly updatedAt: Date,
    public readonly createdAt: Date,
  ) {}
}
