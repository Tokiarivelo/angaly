import { z } from 'zod';
import { AppointmentType } from '@angaly/types';

const APPOINTMENT_TYPE_VALUES = Object.values(AppointmentType) as [AppointmentType, ...AppointmentType[]];

export const appointmentFormSchema = z.object({
  type: z.enum(APPOINTMENT_TYPE_VALUES, { message: 'Veuillez choisir un type de création' }),
  atelierId: z.string().min(1, 'Veuillez choisir un atelier'),
  /** YYYY-MM-DD, drives the day-slots query — not sent to the API directly. */
  date: z.string().min(1, 'Veuillez choisir une date'),
  /** ISO datetime of the selected free slot — becomes `scheduledAt`. */
  scheduledAt: z.string().min(1, 'Veuillez choisir un horaire'),
  firstName: z.string().min(1, 'Le prénom est requis'),
  lastName: z.string().min(1, 'Le nom est requis'),
  phone: z.string().min(1, 'Le téléphone est requis'),
  email: z.string().min(1, "L'adresse e-mail est requise").email('Adresse e-mail invalide'),
  message: z.string().optional(),
});

export type AppointmentFormValues = z.infer<typeof appointmentFormSchema>;
