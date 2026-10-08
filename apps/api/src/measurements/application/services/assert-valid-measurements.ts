import { BadRequestException } from '@nestjs/common';
import { MeasurementUnit, validateMeasurementValues } from '@angaly/types';

const CM_PER_INCH = 2.54;

/**
 * Rejects (400) implausible measurements. Plausibility bounds are in cm, so values stored in
 * inches are converted for the check only. Zeros are "not provided" and ignored (the use cases
 * already drop them).
 */
export function assertValidMeasurements(values: Record<string, number>, unit: MeasurementUnit): void {
  const factor = unit === MeasurementUnit.INCH ? CM_PER_INCH : 1;
  const inCm: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(values)) {
    if (val === 0) continue;
    inCm[key] = typeof val === 'number' ? val * factor : val;
  }
  const { issues } = validateMeasurementValues(inCm);
  if (issues.length > 0) {
    throw new BadRequestException({
      message: 'Mesures invalides',
      errors: issues.map((issue) => issue.message),
    });
  }
}
