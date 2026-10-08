import { z } from 'zod';
import { MeasurementUnit, validateMeasurementValues } from '@angaly/types';

// An empty number input registers as NaN: treat it as "not provided" so 28 optional fields don't
// block the form.
const optionalMeasurement = z.preprocess(
  (v) => (typeof v === 'number' && Number.isNaN(v) ? undefined : v),
  z.number().positive('La valeur doit être positive.').optional(),
);

export const measurementProfileSchema = z
  .object({
    label: z.string().min(1, 'Le nom du profil est requis.').max(100),
    unit: z.nativeEnum(MeasurementUnit),
    values: z.record(z.string(), optionalMeasurement),
  })
  .superRefine((data, ctx) => {
    // Plausibility bounds are in cm.
    const factor = data.unit === MeasurementUnit.INCH ? 2.54 : 1;
    const provided = Object.fromEntries(
      Object.entries(data.values)
        .filter((entry): entry is [string, number] => typeof entry[1] === 'number')
        .map(([key, val]) => [key, val * factor]),
    );
    for (const issue of validateMeasurementValues(provided).issues) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['values', issue.key], message: issue.message });
    }
  });

export type MeasurementProfileFormValues = z.infer<typeof measurementProfileSchema>;
