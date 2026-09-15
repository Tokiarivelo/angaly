// ANGALY Pattern Studio — tables de tailles standard (AFNOR / ISO 8559-1)
// Source des valeurs : apps/ai-service/ml/data/standard_measurements.json
// (clés renommées vers le vocabulaire canonique des mesures — voir
// apps/web/src/features/mes-mesures/consts/measurement-fields.const.ts)

export type SizeChartGender = 'FEMME' | 'HOMME';

export type StandardSizeLabel =
  | 'XXS'
  | 'XS'
  | 'S'
  | 'M'
  | 'L'
  | 'XL'
  | 'XXL'
  | '3XL'
  | '4XL'
  | '5XL';

/** One standard size row: FR numeric size + its cm measurements (canonical keys). */
export interface SizeChartEntry {
  label: StandardSizeLabel;
  frSize: string;
  measurements: {
    TOUR_POITRINE: number;
    TOUR_TAILLE: number;
    TOUR_BASSIN: number;
    LONGUEUR_DOS: number;
    CARRURE_DOS: number;
    TOUR_COU: number;
  };
}

const FEMME_CHART: SizeChartEntry[] = [
  { label: 'XXS', frSize: '34', measurements: { TOUR_POITRINE: 80, TOUR_TAILLE: 62, TOUR_BASSIN: 86, LONGUEUR_DOS: 40.5, CARRURE_DOS: 34, TOUR_COU: 33 } },
  { label: 'XS', frSize: '36', measurements: { TOUR_POITRINE: 84, TOUR_TAILLE: 66, TOUR_BASSIN: 90, LONGUEUR_DOS: 41.0, CARRURE_DOS: 35, TOUR_COU: 34 } },
  { label: 'S', frSize: '38', measurements: { TOUR_POITRINE: 88, TOUR_TAILLE: 70, TOUR_BASSIN: 94, LONGUEUR_DOS: 41.5, CARRURE_DOS: 36, TOUR_COU: 35 } },
  { label: 'M', frSize: '40', measurements: { TOUR_POITRINE: 92, TOUR_TAILLE: 74, TOUR_BASSIN: 98, LONGUEUR_DOS: 42.0, CARRURE_DOS: 37, TOUR_COU: 36 } },
  { label: 'L', frSize: '42', measurements: { TOUR_POITRINE: 96, TOUR_TAILLE: 78, TOUR_BASSIN: 102, LONGUEUR_DOS: 42.5, CARRURE_DOS: 38, TOUR_COU: 37 } },
  { label: 'XL', frSize: '44', measurements: { TOUR_POITRINE: 100, TOUR_TAILLE: 82, TOUR_BASSIN: 106, LONGUEUR_DOS: 43.0, CARRURE_DOS: 39, TOUR_COU: 38 } },
  { label: 'XXL', frSize: '46', measurements: { TOUR_POITRINE: 104, TOUR_TAILLE: 86, TOUR_BASSIN: 110, LONGUEUR_DOS: 43.5, CARRURE_DOS: 40, TOUR_COU: 39 } },
  { label: '3XL', frSize: '48', measurements: { TOUR_POITRINE: 110, TOUR_TAILLE: 92, TOUR_BASSIN: 116, LONGUEUR_DOS: 44.0, CARRURE_DOS: 41.5, TOUR_COU: 40.5 } },
  { label: '4XL', frSize: '50', measurements: { TOUR_POITRINE: 116, TOUR_TAILLE: 98, TOUR_BASSIN: 122, LONGUEUR_DOS: 44.5, CARRURE_DOS: 43, TOUR_COU: 42 } },
  { label: '5XL', frSize: '52', measurements: { TOUR_POITRINE: 122, TOUR_TAILLE: 104, TOUR_BASSIN: 128, LONGUEUR_DOS: 45.0, CARRURE_DOS: 44.5, TOUR_COU: 43.5 } },
];

const HOMME_CHART: SizeChartEntry[] = [
  { label: 'XS', frSize: '44', measurements: { TOUR_POITRINE: 88, TOUR_TAILLE: 76, TOUR_BASSIN: 92, LONGUEUR_DOS: 44, CARRURE_DOS: 41, TOUR_COU: 37 } },
  { label: 'S', frSize: '46', measurements: { TOUR_POITRINE: 92, TOUR_TAILLE: 80, TOUR_BASSIN: 96, LONGUEUR_DOS: 44.5, CARRURE_DOS: 42, TOUR_COU: 38 } },
  { label: 'M', frSize: '48', measurements: { TOUR_POITRINE: 96, TOUR_TAILLE: 84, TOUR_BASSIN: 100, LONGUEUR_DOS: 45, CARRURE_DOS: 43, TOUR_COU: 39 } },
  { label: 'L', frSize: '50', measurements: { TOUR_POITRINE: 100, TOUR_TAILLE: 88, TOUR_BASSIN: 104, LONGUEUR_DOS: 45.5, CARRURE_DOS: 44, TOUR_COU: 40 } },
  { label: 'XL', frSize: '52', measurements: { TOUR_POITRINE: 104, TOUR_TAILLE: 92, TOUR_BASSIN: 108, LONGUEUR_DOS: 46, CARRURE_DOS: 45, TOUR_COU: 41 } },
  { label: 'XXL', frSize: '54', measurements: { TOUR_POITRINE: 108, TOUR_TAILLE: 96, TOUR_BASSIN: 112, LONGUEUR_DOS: 46.5, CARRURE_DOS: 46, TOUR_COU: 42 } },
  { label: '3XL', frSize: '56', measurements: { TOUR_POITRINE: 112, TOUR_TAILLE: 100, TOUR_BASSIN: 116, LONGUEUR_DOS: 47, CARRURE_DOS: 47, TOUR_COU: 43 } },
  { label: '4XL', frSize: '58', measurements: { TOUR_POITRINE: 116, TOUR_TAILLE: 104, TOUR_BASSIN: 120, LONGUEUR_DOS: 47.5, CARRURE_DOS: 48, TOUR_COU: 44 } },
];

export const STANDARD_SIZE_CHARTS: Record<SizeChartGender, SizeChartEntry[]> = {
  FEMME: FEMME_CHART,
  HOMME: HOMME_CHART,
};

export function getSizeChart(gender: SizeChartGender): SizeChartEntry[] {
  return STANDARD_SIZE_CHARTS[gender];
}

export function findSizeChartEntry(
  gender: SizeChartGender,
  label: StandardSizeLabel,
): SizeChartEntry | undefined {
  return STANDARD_SIZE_CHARTS[gender].find((entry) => entry.label === label);
}

// ============================================================
// AI-assisted estimation of missing measurements (apps/ai-service)
// ============================================================

/** Admin-controlled choice of AI backend for measurement estimation — see
 * docs/features/ai-model-settings.md. Mirrors Prisma's AiMeasurementModel enum. */
export type MeasurementModelPreference = 'GEMINI' | 'LOCAL_STATISTICAL';

export interface PatternMeasurementEstimationRequest {
  garmentType: string;
  gender: SizeChartGender | null;
  knownMeasurements: Record<string, number>;
  requiredKeys: string[];
  modelPreference?: MeasurementModelPreference;
}

export interface PatternMeasurementEstimationResponse {
  estimatedMeasurements: Record<string, number>;
  estimatedKeys: string[];
  confidence: number; // 0..1 — always indicative, never a substitute for a real measurement
  modelVersion: string;
}

/** Which model backends apps/ai-service can actually serve right now (an
 * admin may have selected LOCAL_STATISTICAL while its artifact isn't loaded). */
export interface AvailableModelsResponse {
  measurementEstimation: MeasurementModelPreference[];
}
