import { z } from 'zod';
import { MeasurementUnit } from '@angaly/types';

export const measurementProfileSchema = z.object({
  label: z.string().min(1, 'Le nom du profil est requis.').max(100),
  unit: z.nativeEnum(MeasurementUnit),
  values: z.record(z.string(), z.number().positive('La valeur doit être positive.').optional()),
});

export type MeasurementProfileFormValues = z.infer<typeof measurementProfileSchema>;
