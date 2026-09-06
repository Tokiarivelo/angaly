import { z } from 'zod';

export const newsletterSchema = z.object({
  email: z.string().min(1, "L'adresse e-mail est requise").email('Adresse e-mail invalide'),
  consent: z.boolean().refine((value) => value === true, {
    message: 'Vous devez accepter de recevoir nos actualités',
  }),
});

export type NewsletterFormValues = z.infer<typeof newsletterSchema>;
