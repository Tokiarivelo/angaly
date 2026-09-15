export type MeasurementModelPreference = 'GEMINI' | 'LOCAL_STATISTICAL';

export class AiModelSetting {
  constructor(
    public readonly id: string,
    public readonly measurementModel: MeasurementModelPreference,
    public readonly updatedById: string | null,
    public readonly updatedAt: Date,
    public readonly createdAt: Date,
  ) {}
}
