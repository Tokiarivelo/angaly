import { z } from 'zod';

import { MIN_PASSWORD_LENGTH } from '../consts/queryKeys';

export const signupSchema = z
  .object({
    firstName: z.string().min(1, 'Le prénom est requis'),
    lastName: z.string().min(1, 'Le nom est requis'),
    email: z.string().min(1, "L'adresse e-mail est requise").email('Adresse e-mail invalide'),
    // Optional: verified against the real Stitch markup (no `required` on the
    // telephone input, unlike every other field) and matches RegisterDto.phone?.
    phone: z.string().optional(),
    password: z
      .string()
      .min(MIN_PASSWORD_LENGTH, `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères`),
    confirmPassword: z.string().min(1, 'Veuillez confirmer votre mot de passe'),
    acceptTerms: z.boolean().refine((value) => value === true, {
      message: 'Vous devez accepter les conditions générales et la politique de confidentialité',
    }),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

export type SignupFormValues = z.infer<typeof signupSchema>;
