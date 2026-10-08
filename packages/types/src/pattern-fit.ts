/**
 * Single source of truth for everything the pattern-engine needs to FIT a garment to a body:
 *  - the measurement catalogue (keys, French labels, how to take them, plausible bounds, which
 *    garments need / benefit from them),
 *  - the extended pattern parameters (ease, fullness, lengths — Phase 5b S1) with their bounds.
 *
 * Consumed by apps/api (validation), apps/web (measurement form, ease selector) and checked by
 * tests against `packages/pattern-engine` (required keys must not drift). Pure data + pure
 * functions, no I/O.
 */

export type FitGarmentType =
  | 'ROBE'
  | 'JUPE'
  | 'PANTALON'
  | 'VESTE'
  | 'COSTUME'
  | 'CHEMISE'
  | 'ROBE_MARIEE'
  | 'AUTRE';

export const FIT_GARMENT_TYPES: readonly FitGarmentType[] = [
  'ROBE',
  'JUPE',
  'PANTALON',
  'VESTE',
  'COSTUME',
  'CHEMISE',
  'ROBE_MARIEE',
  'AUTRE',
];

// ============================================================
// Measurement catalogue
// ============================================================

export type MeasurementGroup = 'CIRCONFERENCES' | 'LARGEURS' | 'LONGUEURS_TORSE' | 'BRAS' | 'BAS_DU_CORPS';

export const MEASUREMENT_GROUP_LABELS: Record<MeasurementGroup, string> = {
  CIRCONFERENCES: 'Tours (circonférences)',
  LARGEURS: 'Largeurs',
  LONGUEURS_TORSE: 'Longueurs du buste',
  BRAS: 'Bras',
  BAS_DU_CORPS: 'Bas du corps',
};

export interface MeasurementDefinition {
  key: string;
  label: string;
  /** How to take the measurement (shown in the form). */
  help: string;
  group: MeasurementGroup;
  /** Plausible adult range in cm — outside = rejected as a typing error. */
  minCm: number;
  maxCm: number;
  /** Garments for which the engine refuses to generate without it (mirrors the rules). */
  requiredFor: readonly FitGarmentType[];
  /** Garments whose fit clearly improves with it (asked, never blocking). */
  recommendedFor: readonly FitGarmentType[];
}

const TOPS: readonly FitGarmentType[] = ['ROBE', 'VESTE', 'COSTUME', 'CHEMISE', 'ROBE_MARIEE', 'AUTRE'];
const BOTTOMS: readonly FitGarmentType[] = ['JUPE', 'PANTALON', 'COSTUME'];
const SLEEVED: readonly FitGarmentType[] = ['ROBE', 'VESTE', 'COSTUME', 'CHEMISE', 'ROBE_MARIEE'];
const DRESSES: readonly FitGarmentType[] = ['ROBE', 'ROBE_MARIEE'];
const NONE: readonly FitGarmentType[] = [];

export const MEASUREMENT_CATALOG: readonly MeasurementDefinition[] = [
  // --- Tours ---
  {
    key: 'TOUR_POITRINE',
    label: 'Tour de poitrine',
    help: 'Mesurez horizontalement au point le plus fort de la poitrine.',
    group: 'CIRCONFERENCES',
    minCm: 60,
    maxCm: 170,
    requiredFor: ['ROBE', 'VESTE', 'COSTUME', 'CHEMISE', 'ROBE_MARIEE', 'AUTRE'],
    recommendedFor: NONE,
  },
  {
    key: 'TOUR_SOUS_POITRINE',
    label: 'Tour sous la poitrine',
    help: 'Horizontalement juste sous la poitrine, là où s’arrête un soutien-gorge.',
    group: 'CIRCONFERENCES',
    minCm: 55,
    maxCm: 150,
    requiredFor: NONE,
    recommendedFor: ['ROBE_MARIEE'],
  },
  {
    key: 'TOUR_TAILLE',
    label: 'Tour de taille',
    help: 'Mesurez au creux de la taille, sans serrer.',
    group: 'CIRCONFERENCES',
    minCm: 45,
    maxCm: 160,
    requiredFor: ['ROBE', 'JUPE', 'PANTALON', 'VESTE', 'COSTUME', 'CHEMISE', 'ROBE_MARIEE', 'AUTRE'],
    recommendedFor: NONE,
  },
  {
    key: 'TOUR_HAUT_BASSIN',
    label: 'Tour de hanches (haut)',
    help: 'Horizontalement à environ 10 cm sous la taille, sur le haut des hanches.',
    group: 'CIRCONFERENCES',
    minCm: 55,
    maxCm: 170,
    requiredFor: NONE,
    recommendedFor: ['JUPE', 'PANTALON', 'COSTUME', 'ROBE_MARIEE'],
  },
  {
    key: 'TOUR_BASSIN',
    label: 'Tour de bassin',
    help: 'Mesurez horizontalement au point le plus fort du bassin.',
    group: 'CIRCONFERENCES',
    minCm: 65,
    maxCm: 180,
    requiredFor: ['ROBE', 'JUPE', 'PANTALON', 'COSTUME', 'ROBE_MARIEE'],
    recommendedFor: ['VESTE'],
  },
  {
    key: 'TOUR_COU',
    label: 'Tour de cou',
    help: 'Mesurez à la base du cou.',
    group: 'CIRCONFERENCES',
    minCm: 25,
    maxCm: 55,
    requiredFor: NONE,
    recommendedFor: ['VESTE', 'COSTUME', 'CHEMISE'],
  },
  {
    key: 'TOUR_EMMANCHURE',
    label: 'Tour d’emmanchure',
    help: 'Tout autour de l’épaule, en passant par le creux de l’aisselle.',
    group: 'CIRCONFERENCES',
    minCm: 30,
    maxCm: 70,
    requiredFor: NONE,
    recommendedFor: ['VESTE', 'COSTUME', 'CHEMISE'],
  },
  {
    key: 'TOUR_CUISSE',
    label: 'Tour de cuisse',
    help: 'Au point le plus fort de la cuisse, sous le pli de la fesse.',
    group: 'CIRCONFERENCES',
    minCm: 35,
    maxCm: 100,
    requiredFor: NONE,
    recommendedFor: ['PANTALON', 'COSTUME'],
  },
  {
    key: 'TOUR_GENOU',
    label: 'Tour de genou',
    help: 'Autour du genou, jambe tendue.',
    group: 'CIRCONFERENCES',
    minCm: 25,
    maxCm: 60,
    requiredFor: NONE,
    recommendedFor: ['PANTALON', 'COSTUME'],
  },
  {
    key: 'TOUR_CHEVILLE',
    label: 'Tour de cheville',
    help: 'Au point le plus fin de la cheville.',
    group: 'CIRCONFERENCES',
    minCm: 15,
    maxCm: 40,
    requiredFor: NONE,
    recommendedFor: ['PANTALON'],
  },
  {
    key: 'TOUR_BRAS',
    label: 'Tour de bras',
    help: 'Au point le plus fort du haut du bras (biceps), bras relâché.',
    group: 'BRAS',
    minCm: 15,
    maxCm: 60,
    requiredFor: NONE,
    recommendedFor: SLEEVED,
  },
  {
    key: 'TOUR_POIGNET',
    label: 'Tour de poignet',
    help: 'Autour de l’os du poignet.',
    group: 'BRAS',
    minCm: 11,
    maxCm: 30,
    requiredFor: NONE,
    recommendedFor: ['VESTE', 'COSTUME', 'CHEMISE'],
  },
  // --- Largeurs ---
  {
    key: 'CARRURE_DOS',
    label: 'Carrure dos',
    help: 'Distance entre les emmanchures au dos.',
    group: 'LARGEURS',
    minCm: 25,
    maxCm: 55,
    requiredFor: NONE,
    recommendedFor: SLEEVED,
  },
  {
    key: 'CARRURE_DEVANT',
    label: 'Carrure devant',
    help: 'Largeur de la poitrine, d’un pli de bras à l’autre, à mi-hauteur de l’emmanchure.',
    group: 'LARGEURS',
    minCm: 25,
    maxCm: 55,
    requiredFor: NONE,
    recommendedFor: SLEEVED,
  },
  {
    key: 'LARGEUR_EPAULE',
    label: 'Largeur d’épaule',
    help: 'De la base du cou à la pointe de l’épaule.',
    group: 'LARGEURS',
    minCm: 8,
    maxCm: 20,
    requiredFor: NONE,
    recommendedFor: TOPS,
  },
  {
    key: 'ECARTEMENT_POINTS_POITRINE',
    label: 'Écart des pointes de poitrine',
    help: 'Distance entre les deux pointes de poitrine.',
    group: 'LARGEURS',
    minCm: 8,
    maxCm: 30,
    requiredFor: NONE,
    recommendedFor: ['ROBE', 'ROBE_MARIEE', 'VESTE'],
  },
  // --- Longueurs du buste ---
  {
    key: 'LONGUEUR_DOS',
    label: 'Longueur dos',
    help: "De la base du cou jusqu'au creux de la taille.",
    group: 'LONGUEURS_TORSE',
    minCm: 30,
    maxCm: 60,
    requiredFor: ['ROBE', 'JUPE', 'VESTE', 'COSTUME', 'CHEMISE', 'ROBE_MARIEE', 'AUTRE'],
    recommendedFor: NONE,
  },
  {
    key: 'LONGUEUR_DEVANT',
    label: 'Longueur devant',
    help: 'Du milieu de l’épaule, par la pointe de poitrine, jusqu’au creux de la taille.',
    group: 'LONGUEURS_TORSE',
    minCm: 30,
    maxCm: 65,
    requiredFor: NONE,
    recommendedFor: ['ROBE', 'ROBE_MARIEE', 'VESTE'],
  },
  {
    key: 'HAUTEUR_POITRINE',
    label: 'Hauteur de poitrine',
    help: 'Du milieu de l’épaule jusqu’à la pointe de poitrine.',
    group: 'LONGUEURS_TORSE',
    minCm: 18,
    maxCm: 40,
    requiredFor: NONE,
    recommendedFor: ['ROBE', 'ROBE_MARIEE', 'VESTE'],
  },
  {
    key: 'HAUTEUR_BASSIN',
    label: 'Hauteur de bassin',
    help: 'Du creux de la taille jusqu’au point le plus fort du bassin (de côté).',
    group: 'LONGUEURS_TORSE',
    minCm: 14,
    maxCm: 28,
    requiredFor: NONE,
    recommendedFor: ['ROBE', 'JUPE', 'PANTALON', 'COSTUME', 'ROBE_MARIEE'],
  },
  {
    key: 'PROFONDEUR_EMMANCHURE',
    label: 'Profondeur d’emmanchure',
    help: 'De la vertèbre du cou à l’horizontale du creux d’aisselle (règle posée sous le bras).',
    group: 'LONGUEURS_TORSE',
    minCm: 15,
    maxCm: 30,
    requiredFor: NONE,
    recommendedFor: ['VESTE', 'COSTUME', 'CHEMISE'],
  },
  // --- Bras ---
  {
    key: 'LONGUEUR_BRAS',
    label: 'Longueur de bras',
    help: 'De la pointe de l’épaule au poignet, bras légèrement plié.',
    group: 'BRAS',
    minCm: 40,
    maxCm: 85,
    requiredFor: NONE,
    recommendedFor: SLEEVED,
  },
  {
    key: 'HAUTEUR_COUDE',
    label: 'Longueur épaule–coude',
    help: 'De la pointe de l’épaule au coude, bras plié.',
    group: 'BRAS',
    minCm: 20,
    maxCm: 45,
    requiredFor: NONE,
    recommendedFor: ['VESTE', 'COSTUME'],
  },
  // --- Bas du corps ---
  {
    key: 'LONGUEUR_JUPE',
    label: 'Longueur de jupe souhaitée',
    help: 'De la taille jusqu’à l’ourlet voulu, mesurée sur le côté.',
    group: 'BAS_DU_CORPS',
    minCm: 25,
    maxCm: 140,
    requiredFor: NONE,
    recommendedFor: ['JUPE', 'ROBE', 'ROBE_MARIEE'],
  },
  {
    key: 'HAUTEUR_TAILLE_GENOU',
    label: 'Hauteur taille–genou',
    help: 'Du creux de la taille au milieu du genou.',
    group: 'BAS_DU_CORPS',
    minCm: 40,
    maxCm: 75,
    requiredFor: NONE,
    recommendedFor: ['JUPE', 'PANTALON', 'COSTUME'],
  },
  {
    key: 'HAUTEUR_FOURCHE',
    label: 'Hauteur de fourche',
    help: 'Assise sur une chaise rigide : de la taille (côté) au siège.',
    group: 'BAS_DU_CORPS',
    minCm: 18,
    maxCm: 40,
    requiredFor: NONE,
    recommendedFor: ['PANTALON', 'COSTUME'],
  },
  {
    key: 'HAUTEUR_ENTREJAMBE',
    label: 'Hauteur d’entrejambe',
    help: 'De l’entrejambe à la cheville, à l’intérieur de la jambe.',
    group: 'BAS_DU_CORPS',
    minCm: 55,
    maxCm: 100,
    requiredFor: NONE,
    recommendedFor: ['PANTALON', 'COSTUME'],
  },
  {
    key: 'LONGUEUR_JAMBE',
    label: 'Longueur de jambe (extérieure)',
    help: 'De la taille à la cheville, sur le côté de la jambe.',
    group: 'BAS_DU_CORPS',
    minCm: 70,
    maxCm: 130,
    requiredFor: NONE,
    recommendedFor: ['PANTALON', 'COSTUME'],
  },
  {
    key: 'HAUTEUR_TAILLE_SOL',
    label: 'Hauteur taille–sol',
    help: 'Du creux de la taille au sol, pieds nus ou avec les chaussures prévues.',
    group: 'BAS_DU_CORPS',
    minCm: 80,
    maxCm: 140,
    requiredFor: NONE,
    recommendedFor: DRESSES,
  },
  {
    key: 'LONGUEUR_TRAINE',
    label: 'Longueur de traîne',
    help: 'Longueur de traîne souhaitée, du sol vers l’arrière.',
    group: 'BAS_DU_CORPS',
    minCm: 0,
    maxCm: 400,
    requiredFor: NONE,
    recommendedFor: ['ROBE_MARIEE'],
  },
  {
    key: 'HAUTEUR_TOTALE',
    label: 'Taille (hauteur totale)',
    help: 'Debout, sans chaussures, dos au mur.',
    group: 'BAS_DU_CORPS',
    minCm: 130,
    maxCm: 220,
    requiredFor: NONE,
    recommendedFor: [...BOTTOMS, ...DRESSES],
  },
];

export const MEASUREMENT_KEYS: readonly string[] = MEASUREMENT_CATALOG.map((m) => m.key);

const CATALOG_BY_KEY = new Map(MEASUREMENT_CATALOG.map((m) => [m.key, m] as const));

export function getMeasurementDefinition(key: string): MeasurementDefinition | undefined {
  return CATALOG_BY_KEY.get(key);
}

/** Keys the engine needs to generate this garment (same as the rules' `requiredMeasurementKeys`). */
export function requiredMeasurementKeysFor(garment: FitGarmentType): string[] {
  return MEASUREMENT_CATALOG.filter((m) => m.requiredFor.includes(garment)).map((m) => m.key);
}

/** Extra keys that make the fit more exact for this garment (asked but never blocking). */
export function recommendedMeasurementKeysFor(garment: FitGarmentType): string[] {
  return MEASUREMENT_CATALOG.filter((m) => m.recommendedFor.includes(garment)).map((m) => m.key);
}

/** Catalogue entries to display for a garment: required first, then recommended, in catalogue order. */
export function measurementFieldsFor(garment: FitGarmentType | null | undefined): Array<
  MeasurementDefinition & { necessity: 'REQUIRED' | 'RECOMMENDED' }
> {
  if (!garment) {
    return MEASUREMENT_CATALOG.filter((m) => m.requiredFor.length > 0).map((m) => ({
      ...m,
      necessity: 'REQUIRED' as const,
    }));
  }
  const required = MEASUREMENT_CATALOG.filter((m) => m.requiredFor.includes(garment)).map((m) => ({
    ...m,
    necessity: 'REQUIRED' as const,
  }));
  const recommended = MEASUREMENT_CATALOG.filter(
    (m) => !m.requiredFor.includes(garment) && m.recommendedFor.includes(garment),
  ).map((m) => ({ ...m, necessity: 'RECOMMENDED' as const }));
  return [...required, ...recommended];
}

/** Hard cap for keys that are not in the catalogue (kept for backward compatibility). */
const UNKNOWN_KEY_MAX_CM = 400;

export interface MeasurementIssue {
  key: string;
  reason: 'NOT_A_NUMBER' | 'NOT_POSITIVE' | 'BELOW_MIN' | 'ABOVE_MAX';
  message: string;
}

/**
 * Validates a `{ KEY: valueInCm }` map. Catalogue keys must sit in their plausible range; unknown
 * keys only need to be a positive finite number (older profiles may carry custom keys).
 */
export function validateMeasurementValues(values: Record<string, unknown>): {
  valid: Record<string, number>;
  issues: MeasurementIssue[];
} {
  const valid: Record<string, number> = {};
  const issues: MeasurementIssue[] = [];
  for (const [key, raw] of Object.entries(values)) {
    if (typeof raw !== 'number' || !Number.isFinite(raw)) {
      issues.push({ key, reason: 'NOT_A_NUMBER', message: `${key} doit être un nombre.` });
      continue;
    }
    if (raw <= 0) {
      // 0 is a legitimate "none" only for LONGUEUR_TRAINE
      if (!(raw === 0 && key === 'LONGUEUR_TRAINE')) {
        issues.push({ key, reason: 'NOT_POSITIVE', message: `${key} doit être positive.` });
        continue;
      }
    }
    const def = CATALOG_BY_KEY.get(key);
    const min = def?.minCm ?? 0;
    const max = def?.maxCm ?? UNKNOWN_KEY_MAX_CM;
    if (raw < min) {
      issues.push({
        key,
        reason: 'BELOW_MIN',
        message: `${def?.label ?? key} : ${raw} cm est inférieur au minimum plausible (${min} cm).`,
      });
      continue;
    }
    if (raw > max) {
      issues.push({
        key,
        reason: 'ABOVE_MAX',
        message: `${def?.label ?? key} : ${raw} cm dépasse le maximum plausible (${max} cm).`,
      });
      continue;
    }
    valid[key] = raw;
  }
  return { valid, issues };
}

/**
 * Soft cross-checks between measurements (a body cannot be anything). Returns human-readable
 * warnings — never blocking, the couturière decides.
 */
export function checkMeasurementCoherence(values: Record<string, number>): string[] {
  const warnings: string[] = [];
  const v = values;
  const poitrine = v['TOUR_POITRINE'];
  const sousPoitrine = v['TOUR_SOUS_POITRINE'];
  const taille = v['TOUR_TAILLE'];
  const haut = v['TOUR_HAUT_BASSIN'];
  const bassin = v['TOUR_BASSIN'];
  const cuisse = v['TOUR_CUISSE'];
  const genou = v['TOUR_GENOU'];
  const cheville = v['TOUR_CHEVILLE'];
  const bras = v['TOUR_BRAS'];
  const poignet = v['TOUR_POIGNET'];
  const longueurDos = v['LONGUEUR_DOS'];
  const longueurDevant = v['LONGUEUR_DEVANT'];
  const hauteurPoitrine = v['HAUTEUR_POITRINE'];
  const jambe = v['LONGUEUR_JAMBE'];
  const entrejambe = v['HAUTEUR_ENTREJAMBE'];

  if (poitrine !== undefined && sousPoitrine !== undefined && sousPoitrine > poitrine) {
    warnings.push('Le tour sous la poitrine dépasse le tour de poitrine : vérifiez les deux mesures.');
  }
  if (poitrine !== undefined && taille !== undefined && taille > poitrine * 1.25) {
    warnings.push('Le tour de taille dépasse nettement le tour de poitrine : vérifiez la saisie.');
  }
  if (taille !== undefined && bassin !== undefined && bassin < taille * 0.9) {
    warnings.push('Le tour de bassin est inférieur au tour de taille : vérifiez la saisie.');
  }
  if (haut !== undefined && bassin !== undefined && haut > bassin) {
    warnings.push('Le tour de hanches (haut) dépasse le tour de bassin : vérifiez la saisie.');
  }
  if (cuisse !== undefined && genou !== undefined && genou > cuisse) {
    warnings.push('Le tour de genou dépasse le tour de cuisse : vérifiez la saisie.');
  }
  if (genou !== undefined && cheville !== undefined && cheville > genou) {
    warnings.push('Le tour de cheville dépasse le tour de genou : vérifiez la saisie.');
  }
  if (bras !== undefined && poignet !== undefined && poignet > bras) {
    warnings.push('Le tour de poignet dépasse le tour de bras : vérifiez la saisie.');
  }
  if (longueurDos !== undefined && longueurDevant !== undefined && longueurDevant < longueurDos * 0.85) {
    warnings.push('La longueur devant est très inférieure à la longueur dos : vérifiez la saisie.');
  }
  if (hauteurPoitrine !== undefined && longueurDevant !== undefined && hauteurPoitrine >= longueurDevant) {
    warnings.push('La hauteur de poitrine doit être inférieure à la longueur devant.');
  }
  if (entrejambe !== undefined && jambe !== undefined && entrejambe > jambe) {
    warnings.push('L’entrejambe dépasse la longueur de jambe extérieure : vérifiez la saisie.');
  }
  return warnings;
}

// ============================================================
// Extended pattern parameters (Phase 5b S1)
// ============================================================

export const EASE_LEVELS = ['AJUSTE', 'CONFORT', 'AMPLE'] as const;
export type EaseLevel = (typeof EASE_LEVELS)[number];

/** `CONFORT` reproduces the engine's historical geometry exactly. */
export const DEFAULT_EASE_LEVEL: EaseLevel = 'CONFORT';

export const EASE_LEVEL_LABELS: Record<EaseLevel, string> = {
  AJUSTE: 'Ajusté',
  CONFORT: 'Confort',
  AMPLE: 'Ample',
};

export interface NumericBounds {
  min: number;
  max: number;
  /** Rounding step (values are snapped to it). */
  step: number;
}

export const FULLNESS_BOUNDS = {
  skirt: { min: 1, max: 4, step: 0.25 },
  sleeve: { min: 1, max: 2.5, step: 0.25 },
} as const satisfies Record<string, NumericBounds>;

export const LENGTH_BOUNDS = {
  skirtPct: { min: 40, max: 130, step: 1 },
  sleevePct: { min: 0, max: 100, step: 1 },
  bodicePct: { min: 80, max: 120, step: 1 },
} as const satisfies Record<string, NumericBounds>;

export interface PatternFullness {
  skirt?: number;
  sleeve?: number;
}

export interface PatternLengths {
  skirtPct?: number;
  sleevePct?: number;
  bodicePct?: number;
}

/** Optional engine inputs stored in `pattern_projects.parametersExtJson`. Absent = historical geometry. */
export interface PatternExtParameters {
  ease?: EaseLevel;
  fullness?: PatternFullness;
  lengths?: PatternLengths;
}

export interface PatternExtIssue {
  path: string;
  message: string;
}

function checkBounded(
  value: unknown,
  bounds: NumericBounds,
  path: string,
  issues: PatternExtIssue[],
): number | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    issues.push({ path, message: `${path} doit être un nombre.` });
    return undefined;
  }
  if (value < bounds.min || value > bounds.max) {
    issues.push({ path, message: `${path} doit être compris entre ${bounds.min} et ${bounds.max}.` });
    return undefined;
  }
  return Math.round(value / bounds.step) * bounds.step;
}

/**
 * Strict validation: out-of-range or wrongly typed values are REJECTED (reported as issues and
 * omitted from `value`), never silently clamped. An empty result means "use engine defaults".
 */
export function validatePatternExtParameters(input: unknown): {
  value: PatternExtParameters;
  issues: PatternExtIssue[];
} {
  const issues: PatternExtIssue[] = [];
  const value: PatternExtParameters = {};
  if (input === null || input === undefined) return { value, issues };
  if (typeof input !== 'object' || Array.isArray(input)) {
    return { value, issues: [{ path: '', message: 'Les paramètres étendus doivent être un objet.' }] };
  }
  const raw = input as Record<string, unknown>;

  if (raw['ease'] !== undefined && raw['ease'] !== null) {
    if (typeof raw['ease'] === 'string' && (EASE_LEVELS as readonly string[]).includes(raw['ease'])) {
      value.ease = raw['ease'] as EaseLevel;
    } else {
      issues.push({ path: 'ease', message: `ease doit valoir ${EASE_LEVELS.join(', ')}.` });
    }
  }

  const fullnessRaw = raw['fullness'];
  if (fullnessRaw !== undefined && fullnessRaw !== null) {
    if (typeof fullnessRaw !== 'object' || Array.isArray(fullnessRaw)) {
      issues.push({ path: 'fullness', message: 'fullness doit être un objet.' });
    } else {
      const f = fullnessRaw as Record<string, unknown>;
      const fullness: PatternFullness = {};
      const skirt = checkBounded(f['skirt'], FULLNESS_BOUNDS.skirt, 'fullness.skirt', issues);
      const sleeve = checkBounded(f['sleeve'], FULLNESS_BOUNDS.sleeve, 'fullness.sleeve', issues);
      if (skirt !== undefined) fullness.skirt = skirt;
      if (sleeve !== undefined) fullness.sleeve = sleeve;
      if (Object.keys(fullness).length > 0) value.fullness = fullness;
    }
  }

  const lengthsRaw = raw['lengths'];
  if (lengthsRaw !== undefined && lengthsRaw !== null) {
    if (typeof lengthsRaw !== 'object' || Array.isArray(lengthsRaw)) {
      issues.push({ path: 'lengths', message: 'lengths doit être un objet.' });
    } else {
      const l = lengthsRaw as Record<string, unknown>;
      const lengths: PatternLengths = {};
      const skirtPct = checkBounded(l['skirtPct'], LENGTH_BOUNDS.skirtPct, 'lengths.skirtPct', issues);
      const sleevePct = checkBounded(l['sleevePct'], LENGTH_BOUNDS.sleevePct, 'lengths.sleevePct', issues);
      const bodicePct = checkBounded(l['bodicePct'], LENGTH_BOUNDS.bodicePct, 'lengths.bodicePct', issues);
      if (skirtPct !== undefined) lengths.skirtPct = skirtPct;
      if (sleevePct !== undefined) lengths.sleevePct = sleevePct;
      if (bodicePct !== undefined) lengths.bodicePct = bodicePct;
      if (Object.keys(lengths).length > 0) value.lengths = lengths;
    }
  }

  return { value, issues };
}
