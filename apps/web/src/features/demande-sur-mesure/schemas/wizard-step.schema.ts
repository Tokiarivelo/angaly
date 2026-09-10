import { z } from 'zod';

/**
 * Single flat schema (not one schema per step composed) — mirrors
 * `appointmentFormSchema` (prendre-rendez-vous), and `SurMesureRequestDto`
 * (apps/api/src/quotes/application/dtos/sur-mesure-request.dto.ts) makes only
 * `garmentType` mandatory server-side; everything else is `@IsOptional()`.
 * Per-step validation still works via `trigger(STEP_1_FIELDS)`.
 */
export const demandeSurMesureSchema = z.object({
  garmentType: z.string().min(1, 'Veuillez choisir un type de vêtement'),
  occasion: z.string().optional(),
  eventDate: z.string().optional(),
  budgetRange: z.string().optional(),
  details: z.string().optional(),
  fabricPreference: z.string().optional(),
  message: z.string().optional(),
});

export type DemandeSurMesureFormValues = z.infer<typeof demandeSurMesureSchema>;

export const STEP_1_FIELDS = ['garmentType', 'occasion', 'eventDate', 'budgetRange', 'details'] as const;
export const STEP_3_FIELDS = ['fabricPreference', 'message'] as const;
