import { z } from 'zod';
import { Locale } from '@angaly/types';

/**
 * All text fields optional (nullable) — a section only fills in the fields it actually uses (hero has
 * CTAs, a text-only block may not), see docs/pages/admin-gestion-contenu.md.
 *
 * `dataJson` carries the structured, catalogue-described extras (eyebrow, chronology, gallery items…);
 * `dataJsonRaw` is the JSON-text fallback for a section the catalogue doesn't describe.
 */
export const sectionEditorSchema = z
  .object({
    locale: z.nativeEnum(Locale),
    titleText: z.string().max(300).optional().nullable(),
    subtitleText: z.string().max(500).optional().nullable(),
    bodyText: z.string().max(5000).optional().nullable(),
    ctaPrimaryLabel: z.string().max(120).optional().nullable(),
    ctaSecondaryLabel: z.string().max(120).optional().nullable(),
    mediaId: z.string().optional().nullable(),
    dataJson: z.record(z.string(), z.unknown()).optional().nullable(),
    dataJsonRaw: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    const raw = values.dataJsonRaw?.trim();
    if (!raw) return;
    try {
      const parsed: unknown = JSON.parse(raw);
      if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
        ctx.addIssue({ code: 'custom', path: ['dataJsonRaw'], message: 'Le JSON doit être un objet ({ … }).' });
      }
    } catch {
      ctx.addIssue({ code: 'custom', path: ['dataJsonRaw'], message: 'JSON invalide.' });
    }
  });

export type SectionEditorFormValues = z.infer<typeof sectionEditorSchema>;

/** The `dataJson` to persist: raw JSON text when used, else the structured object — `undefined` keeps the stored value. */
export function resolveDataJson(values: SectionEditorFormValues): Record<string, unknown> | null | undefined {
  const raw = values.dataJsonRaw?.trim();
  if (values.dataJsonRaw !== undefined) {
    return raw ? (JSON.parse(raw) as Record<string, unknown>) : null;
  }
  return values.dataJson ?? undefined;
}
