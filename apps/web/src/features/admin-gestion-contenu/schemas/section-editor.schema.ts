import { z } from 'zod';
import { Locale } from '@angaly/types';

/**
 * All fields optional (nullable) — a section only fills in the fields it
 * actually uses (hero has CTAs, a text-only block may not), see
 * docs/pages/admin-gestion-contenu.md "champs dynamiques selon les champs
 * remplis de la section".
 */
export const sectionEditorSchema = z.object({
  locale: z.nativeEnum(Locale),
  titleText: z.string().max(300).optional().nullable(),
  subtitleText: z.string().max(500).optional().nullable(),
  bodyText: z.string().max(5000).optional().nullable(),
  ctaPrimaryLabel: z.string().max(120).optional().nullable(),
  ctaSecondaryLabel: z.string().max(120).optional().nullable(),
  mediaId: z.string().optional().nullable(),
});

export type SectionEditorFormValues = z.infer<typeof sectionEditorSchema>;
