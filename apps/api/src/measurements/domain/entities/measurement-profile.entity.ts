import { MeasurementUnit } from '@angaly/types';

export class MeasurementProfile {
  constructor(
    public readonly id: string,
    public readonly customerId: string,
    public readonly label: string,
    public readonly unit: MeasurementUnit,
    public readonly values: Map<string, number>,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  public static create(
    id: string,
    customerId: string,
    label: string,
    unit: MeasurementUnit,
    values: Map<string, number>,
    createdAt: Date = new Date(),
    updatedAt: Date = new Date(),
  ): MeasurementProfile {
    if (!label || label.trim() === '') {
      throw new Error('MeasurementProfile label cannot be empty');
    }
    return new MeasurementProfile(id, customerId, label, unit, values, createdAt, updatedAt);
  }
}
