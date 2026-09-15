import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  IAiModelSettingRepository,
} from '../../domain/repositories/ai-model-setting.repository';
import { AiModelSetting, MeasurementModelPreference } from '../../domain/entities/ai-model-setting.entity';

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
    const row = await this.prisma.aiModelSetting.upsert({
      where: { id: SINGLETON_ID },
      create: { id: SINGLETON_ID, measurementModel, updatedById },
      update: { measurementModel, updatedById },
    });
    return this.toDomain(row);
  }

  private toDomain(row: {
    id: string;
    measurementModel: string;
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
    );
  }
}
