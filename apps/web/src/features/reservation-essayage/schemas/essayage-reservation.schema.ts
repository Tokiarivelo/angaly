import { z } from 'zod';

export const essayageReservationSchema = z.object({
  size: z.string().min(1, 'Veuillez choisir une taille'),
  atelierId: z.string().min(1, 'Veuillez choisir un atelier'),
  /** YYYY-MM-DD, drives the day-slots query — not sent to the API directly. */
  date: z.string().min(1, 'Veuillez choisir une date'),
  /** ISO datetime of the selected free slot — becomes `scheduledAt`. */
  scheduledAt: z.string().min(1, 'Veuillez choisir un horaire'),
  firstName: z.string().min(1, 'Le prénom est requis'),
  lastName: z.string().min(1, 'Le nom est requis'),
  phone: z.string().min(1, 'Le téléphone est requis'),
  email: z.string().min(1, "L'adresse e-mail est requise").email('Adresse e-mail invalide'),
});

export type EssayageReservationValues = z.infer<typeof essayageReservationSchema>;
