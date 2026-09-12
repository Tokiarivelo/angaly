import { z } from 'zod';

export const garmentTypeSchema = z.object({
  garmentType: z.string().min(1, 'Veuillez sélectionner un type de vêtement'),
});

export const occasionSchema = z.object({
  occasion: z.string().min(1, 'Veuillez sélectionner une occasion'),
});

export const styleSchema = z.object({
  style: z.string().min(1, 'Veuillez choisir un style'),
});

export const cutSchema = z.object({
  cutType: z.string().min(1, 'Veuillez choisir une coupe'),
});

export const detailsSchema = z.object({
  details: z.record(z.string()).default({}),
});

export const inspirationSchema = z.object({
  inspirationMediaId: z.string().optional(),
  inspirationImageUrl: z.string().optional(),
  detectedFeatures: z.record(z.string()).optional(),
});

export const measurementsBaseSchema = z.object({
  measurementProfileId: z.string().optional(),
  measurements: z.record(z.number()).optional(),
});

export const measurementsSchema = measurementsBaseSchema.refine(
  (data) => data.measurementProfileId || (data.measurements && Object.keys(data.measurements).length > 0),
  { message: 'Veuillez sélectionner un profil de mesures ou saisir vos mensurations' },
);

export const patternWizardSchema = garmentTypeSchema
  .merge(occasionSchema)
  .merge(styleSchema)
  .merge(cutSchema)
  .merge(detailsSchema)
  .merge(inspirationSchema)
  .merge(measurementsBaseSchema)
  .refine(
    (data) => data.measurementProfileId || (data.measurements && Object.keys(data.measurements).length > 0),
    { message: 'Veuillez sélectionner un profil de mesures ou saisir vos mensurations' }
  );

export type PatternWizardFormValues = z.infer<typeof patternWizardSchema>;
