export class MeasurementValue {
  constructor(public readonly valueCm: number) {
    if (valueCm <= 0) {
      throw new Error('Measurement value must be positive');
    }
  }
}
