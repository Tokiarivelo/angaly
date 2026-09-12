import { z } from 'zod';

export const CustomizationOptionsSchema = z.object({
  coupe: z.string().optional(), // In the checklist it says "Continuer vers la prise de rendez-vous bloqué tant qu'au moins la coupe n'est pas choisie". The form schema itself might allow optional for drafts.
  longueur: z.string().optional(),
  manches: z.string().optional(),
  decollete: z.string().optional(),
  dos: z.string().optional(),
  couleur: z.string().optional(),
  tissu: z.string().optional(),
  broderies: z.string().optional(),
  boutons: z.string().optional(),
  ceinture: z.string().optional(),
  traine: z.string().optional(),
  detailsDecoratifs: z.string().optional(),
  notes: z.string().optional(),
});

export type CustomizationOptions = z.infer<typeof CustomizationOptionsSchema>;

export const SubmitDesignBriefSchema = CustomizationOptionsSchema.extend({
  coupe: z.string().min(1, 'La coupe est requise pour continuer'),
  creationSlug: z.string(),
  inspirationMediaIds: z.array(z.string()).optional(),
});

export type SubmitDesignBriefPayload = z.infer<typeof SubmitDesignBriefSchema>;
