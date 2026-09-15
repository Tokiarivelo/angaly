import { Inject, Injectable } from '@nestjs/common';
import {
  AI_MODEL_SETTING_REPOSITORY,
  IAiModelSettingRepository,
} from '../../domain/repositories/ai-model-setting.repository';
import { AiModelSetting, MeasurementModelPreference } from '../../domain/entities/ai-model-setting.entity';

@Injectable()
export class UpdateAiModelSettingUseCase {
  constructor(
    @Inject(AI_MODEL_SETTING_REPOSITORY)
    private readonly repository: IAiModelSettingRepository,
  ) {}

  async execute(
    measurementModel: MeasurementModelPreference,
    updatedById: string,
  ): Promise<AiModelSetting> {
    return this.repository.update(measurementModel, updatedById);
  }
}
