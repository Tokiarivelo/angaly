import { z } from 'zod';

import { CONTACT_SUBJECTS, type ContactSubjectValue } from '../consts/contact-subjects.const';

const SUBJECT_VALUES = CONTACT_SUBJECTS.map((subject) => subject.value) as [
  ContactSubjectValue,
  ...ContactSubjectValue[],
];

export const contactFormSchema = z.object({
  prenom: z.string().min(1, 'Le prénom est requis'),
  nom: z.string().min(1, 'Le nom est requis'),
  email: z.string().min(1, "L'adresse e-mail est requise").email('Adresse e-mail invalide'),
  telephone: z.string().optional(),
  sujet: z.enum(SUBJECT_VALUES, { message: 'Veuillez sélectionner un sujet' }),
  message: z.string().min(10, 'Votre message doit contenir au moins 10 caractères'),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;
