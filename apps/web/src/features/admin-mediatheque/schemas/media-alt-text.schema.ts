import { z } from 'zod';

/** Media.altText is required at creation (accessibility/SEO, docs/features/media.md) — editing it must never clear it. */
export const mediaAltTextSchema = z.object({
  altText: z.string().min(1, 'Le texte alternatif est obligatoire.').max(300),
});

export type MediaAltTextFormValues = z.infer<typeof mediaAltTextSchema>;
