import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import type { AiProviderId, AiProviderStatus } from '@angaly/types';
import { AiProviderConfigEntity } from '../../domain/entities/ai-provider-config.entity';
import type {
  IAiProviderConfigRepository,
  UpsertAiProviderConfigData,
} from '../../domain/repositories/ai-provider-config.repository';

interface PrismaAiProviderConfigRow {
  id: string;
  provider: string;
  model: string;
  baseUrl: string | null;
  apiKeyCipher: string | null;
  apiKeyLast4: string | null;
  status: string;
  lastTestedAt: Date | null;
  lastLatencyMs: number | null;
  enabled: boolean;
  updatedById: string | null;
  updatedAt: Date;
  createdAt: Date;
}

@Injectable()
export class PrismaAiProviderConfigRepository implements IAiProviderConfigRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toEntity(row: PrismaAiProviderConfigRow): AiProviderConfigEntity {
    return new AiProviderConfigEntity(
      row.id,
      row.provider as AiProviderId,
      row.model,
      row.baseUrl,
      row.apiKeyCipher,
      row.apiKeyLast4,
      row.status as AiProviderStatus,
      row.lastTestedAt,
      row.lastLatencyMs,
      row.enabled,
      row.updatedById,
      row.updatedAt,
      row.createdAt,
    );
  }

  async findAll(): Promise<AiProviderConfigEntity[]> {
    const rows = await this.prisma.aiProviderConfig.findMany({
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((row) => this.toEntity(row as unknown as PrismaAiProviderConfigRow));
  }

  async findByProvider(provider: AiProviderId): Promise<AiProviderConfigEntity | null> {
    const row = await this.prisma.aiProviderConfig.findUnique({
      where: { provider: provider as any },
    });
    return row ? this.toEntity(row as unknown as PrismaAiProviderConfigRow) : null;
  }

  async upsert(data: UpsertAiProviderConfigData): Promise<AiProviderConfigEntity> {
    const updatePayload: Record<string, unknown> = {
      model: data.model,
      baseUrl: data.baseUrl ?? null,
      updatedById: data.updatedById ?? null,
    };

    if (data.apiKeyCipher !== undefined) {
      updatePayload.apiKeyCipher = data.apiKeyCipher;
    }
    if (data.apiKeyLast4 !== undefined) {
      updatePayload.apiKeyLast4 = data.apiKeyLast4;
    }
    if (data.status !== undefined) {
      updatePayload.status = data.status;
    }
    if (data.enabled !== undefined) {
      updatePayload.enabled = data.enabled;
    }

    const row = await this.prisma.aiProviderConfig.upsert({
      where: { provider: data.provider as any },
      create: {
        provider: data.provider as any,
        model: data.model,
        baseUrl: data.baseUrl ?? null,
        apiKeyCipher: data.apiKeyCipher ?? null,
        apiKeyLast4: data.apiKeyLast4 ?? null,
        status: (data.status ?? 'UNTESTED') as any,
        enabled: data.enabled ?? true,
        updatedById: data.updatedById ?? null,
      },
      update: updatePayload,
    });

    return this.toEntity(row as unknown as PrismaAiProviderConfigRow);
  }

  async deleteByProvider(provider: AiProviderId): Promise<void> {
    await this.prisma.aiProviderConfig.delete({
      where: { provider: provider as any },
    });
  }

  async updateTestResult(
    provider: AiProviderId,
    status: AiProviderStatus,
    latencyMs: number,
    testedAt: Date,
  ): Promise<AiProviderConfigEntity> {
    const row = await this.prisma.aiProviderConfig.update({
      where: { provider: provider as any },
      data: {
        status: status as any,
        lastLatencyMs: latencyMs,
        lastTestedAt: testedAt,
      },
    });

    return this.toEntity(row as unknown as PrismaAiProviderConfigRow);
  }
}
