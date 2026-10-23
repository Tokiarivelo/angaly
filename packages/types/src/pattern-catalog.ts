/** « Catalogue des patrons » (API `GET /api/pattern-catalog`): the dresses the pattern engine can make. */
export type PatternCatalogGroup = 'MODERNE' | 'HISTORIQUE' | 'MARIEE';

export const PATTERN_CATALOG_GROUP_LABELS: Record<PatternCatalogGroup, string> = {
  MODERNE: 'Modernes',
  HISTORIQUE: 'Historiques',
  MARIEE: 'Mariée',
};

export interface PatternCatalogCredit {
  title: string;
  date: string;
  /** Museum or archive, with the photographer when known. */
  source: string;
  page: string;
  license: string;
}

export interface PatternCatalogEntryDto {
  id: string;
  title: string;
  era: string;
  notes: string;
  group: PatternCatalogGroup;
  garmentType: string;
  pieceCount: number;
  yardageM: number | null;
  pieces: Array<{ name: string; quantity: number }>;
  /** The inspiration photo (MinIO), null until seeded. */
  imageUrl: string | null;
  credit: PatternCatalogCredit | null;
}
