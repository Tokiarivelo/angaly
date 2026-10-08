import {
  CONSTRUCTION_APPROACH_LABELS,
  MANNEQUIN_SHEET_SECTION_IDS,
  type ConstructionApproach,
  type MannequinSheet,
} from '@angaly/types';

export interface GenerationNotices {
  warnings: string[];
  approach: { id: ConstructionApproach; label: string; reason: string | null } | null;
  mannequinSheet: MannequinSheet | null;
  yardageMm: number | null;
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

function parseSheet(raw: unknown): MannequinSheet | null {
  if (!isRecord(raw) || typeof raw['title'] !== 'string' || !Array.isArray(raw['sections'])) return null;
  const sections = raw['sections'].filter(
    (s): s is MannequinSheet['sections'][number] =>
      isRecord(s) &&
      typeof s['title'] === 'string' &&
      typeof s['body'] === 'string' &&
      (MANNEQUIN_SHEET_SECTION_IDS as readonly unknown[]).includes(s['id']),
  );
  if (sections.length === 0) return null;
  const approach = raw['approach'] === 'MANNEQUIN_ONLY' ? 'MANNEQUIN_ONLY' : 'FLAT_BASE_PLUS_MANNEQUIN';
  return { approach, title: raw['title'], sections, indicative: true };
}

/** Reads what the engine / API recorded on a version (`parametersJson`), tolerating older versions. */
export function parseGenerationNotices(parametersJson: Record<string, unknown> | null | undefined): GenerationNotices {
  const json = parametersJson ?? {};
  const warnings = Array.isArray(json['warnings'])
    ? json['warnings'].filter((w): w is string => typeof w === 'string' && w.trim().length > 0)
    : [];
  const rawApproach = json['constructionApproach'];
  const approach =
    typeof rawApproach === 'string' && rawApproach in CONSTRUCTION_APPROACH_LABELS
      ? {
          id: rawApproach as ConstructionApproach,
          label: CONSTRUCTION_APPROACH_LABELS[rawApproach as ConstructionApproach],
          reason: typeof json['constructionApproachReason'] === 'string' ? json['constructionApproachReason'] : null,
        }
      : null;
  const metadata = isRecord(json['metadata']) ? json['metadata'] : {};
  const yardage = isRecord(metadata['yardage']) ? metadata['yardage'] : {};
  return {
    warnings,
    approach,
    mannequinSheet: parseSheet(json['mannequinSheet']),
    yardageMm: typeof yardage['lengthMm'] === 'number' ? yardage['lengthMm'] : null,
  };
}
