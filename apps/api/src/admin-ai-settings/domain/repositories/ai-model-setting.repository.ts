import type { AiModelSetting, MeasurementModelPreference } from '../entities/ai-model-setting.entity';

export const AI_MODEL_SETTING_REPOSITORY = 'IAiModelSettingRepository';

export interface IAiModelSettingRepository {
  /** Returns the singleton setting row, creating it with defaults on first read. */
  get(): Promise<AiModelSetting>;
  update(measurementModel: MeasurementModelPreference, updatedById: string): Promise<AiModelSetting>;
}
