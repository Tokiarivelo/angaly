import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  IAiModelSettingRepository,
  UpdateAiRoutingData,
} from '../../domain/repositories/ai-model-setting.repository';
import { AiModelSetting, MeasurementModelPreference } from '../../domain/entities/ai-model-setting.entity';
import { AiProviderId } from '@angaly/types';

const SINGLETON_ID = 'singleton';

@Injectable()
export class PrismaAiModelSettingRepository implements IAiModelSettingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async get(): Promise<AiModelSetting> {
    const row = await this.prisma.aiModelSetting.upsert({
      where: { id: SINGLETON_ID },
      create: { id: SINGLETON_ID },
      update: {},
    });
    return this.toDomain(row);
  }

  async update(
    measurementModel: MeasurementModelPreference,
    updatedById: string,
  ): Promise<AiModelSetting> {
    const measurementProvider =
      measurementModel === 'LOCAL_STATISTICAL'
        ? AiProviderId.LOCAL_STATISTICAL
        : AiProviderId.GEMINI;

    const row = await this.prisma.aiModelSetting.upsert({
      where: { id: SINGLETON_ID },
      create: { id: SINGLETON_ID, measurementModel, measurementProvider, updatedById },
      update: { measurementModel, measurementProvider, updatedById },
    });
    return this.toDomain(row);
  }

  async updateRouting(data: UpdateAiRoutingData): Promise<AiModelSetting> {
    const updatePayload: Record<string, unknown> = {
      updatedById: data.updatedById,
    };

    if (data.measurementProvider !== undefined) {
      updatePayload.measurementProvider = data.measurementProvider;
      updatePayload.measurementModel =
        data.measurementProvider === AiProviderId.LOCAL_STATISTICAL
          ? 'LOCAL_STATISTICAL'
          : 'GEMINI';
    }
    if (data.patternSuggestionProvider !== undefined) {
      updatePayload.patternSuggestionProvider = data.patternSuggestionProvider;
    }
    if (data.measurementModel !== undefined) {
      updatePayload.measurementModel = data.measurementModel;
      if (data.measurementProvider === undefined) {
        updatePayload.measurementProvider =
          data.measurementModel === 'LOCAL_STATISTICAL'
            ? AiProviderId.LOCAL_STATISTICAL
            : AiProviderId.GEMINI;
      }
    }

    const row = await this.prisma.aiModelSetting.upsert({
      where: { id: SINGLETON_ID },
      create: {
        id: SINGLETON_ID,
        ...updatePayload,
      },
      update: updatePayload,
    });

    return this.toDomain(row);
  }

  private toDomain(row: {
    id: string;
    measurementModel: string;
    measurementProvider?: string;
    patternSuggestionProvider?: string;
    updatedById: string | null;
    updatedAt: Date;
    createdAt: Date;
  }): AiModelSetting {
    return new AiModelSetting(
      row.id,
      row.measurementModel as MeasurementModelPreference,
      row.updatedById,
      row.updatedAt,
      row.createdAt,
      (row.measurementProvider as AiProviderId) ?? AiProviderId.GEMINI,
      (row.patternSuggestionProvider as AiProviderId) ?? AiProviderId.GEMINI,
    );
  }
}
