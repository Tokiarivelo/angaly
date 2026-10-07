/**
 * Deterministic translation of the wizard's design choices (cutType + details) into numbers the
 * garment rules can apply. Pure functions, no I/O (rule 19 / ADR-005).
 *
 * Deltas are in millimetres, per quarter-body piece, relative to the DROITE baseline each rule
 * already used — so an unknown or missing cutType keeps the historical geometry.
 */

export interface CutProfile {
  bodiceDeltaMm: number;
  waistDeltaMm: number;
  hipDeltaMm: number;
  /** Extra width of the hem compared with the hip line (0 = straight skirt). */
  hemFlareMm: number;
  /** Mermaid cut: narrow down to the knee, then flare. */
  fishtail: boolean;
}

const BASELINE: CutProfile = {
  bodiceDeltaMm: 0,
  waistDeltaMm: 0,
  hipDeltaMm: 0,
  hemFlareMm: 0,
  fishtail: false,
};

const CUT_PROFILES: Record<string, CutProfile> = {
  DROITE: BASELINE,
  AJUSTEE: { bodiceDeltaMm: -10, waistDeltaMm: -10, hipDeltaMm: -10, hemFlareMm: -20, fishtail: false },
  EVASEE: { bodiceDeltaMm: 5, waistDeltaMm: 0, hipDeltaMm: 10, hemFlareMm: 250, fishtail: false },
  SIRENE: { bodiceDeltaMm: -10, waistDeltaMm: -10, hipDeltaMm: -5, hemFlareMm: 300, fishtail: true },
  PRINCESSE: { bodiceDeltaMm: -5, waistDeltaMm: -15, hipDeltaMm: 10, hemFlareMm: 450, fishtail: false },
  OVERSIZE: { bodiceDeltaMm: 50, waistDeltaMm: 60, hipDeltaMm: 60, hemFlareMm: 120, fishtail: false },
};

export function resolveCutProfile(cutType: string | null | undefined): CutProfile {
  return CUT_PROFILES[(cutType ?? '').toUpperCase()] ?? BASELINE;
}

/** Waist-to-hem length of a skirt, in mm, from the `longueur` detail (undefined = rule default). */
const SKIRT_LENGTHS_MM: Record<string, number> = {
  MINI: 450,
  MIDI: 700,
  MAXI: 950,
  SOL: 1050,
  ASYMETRIQUE: 800,
};

export function resolveSkirtLengthMm(longueur: string | undefined): number | undefined {
  return longueur ? SKIRT_LENGTHS_MM[longueur.toUpperCase()] : undefined;
}

export interface Neckline {
  /** Half neck opening, from centre front, in mm. */
  widthMm: number;
  /** Depth of the centre-front neck point below the shoulder line, in mm. */
  depthMm: number;
}

const DEFAULT_NECKLINE: Neckline = { widthMm: 80, depthMm: 0 };

const DECOLLETE: Record<string, Neckline> = {
  SAGE: { widthMm: 70, depthMm: 0 },
  MOYEN: { widthMm: 90, depthMm: 80 },
  PLONGEANT: { widthMm: 100, depthMm: 220 },
  COEUR: { widthMm: 110, depthMm: 140 },
  CARRE: { widthMm: 110, depthMm: 120 },
};

const COL: Record<string, Neckline> = {
  ROND: { widthMm: 85, depthMm: 40 },
  EN_V: { widthMm: 90, depthMm: 170 },
  BATEAU: { widthMm: 140, depthMm: 20 },
  OFFICIER: { widthMm: 60, depthMm: 0 },
  CHEMISIER: { widthMm: 75, depthMm: 30 },
  LAVALLIERE: { widthMm: 70, depthMm: 20 },
};

/** `decollete` wins over `col` (it is the more explicit depth choice). */
export function resolveNeckline(details: Record<string, string>): Neckline {
  const decollete = details['decollete'] ? DECOLLETE[details['decollete'].toUpperCase()] : undefined;
  const col = details['col'] ? COL[details['col'].toUpperCase()] : undefined;
  return decollete ?? col ?? DEFAULT_NECKLINE;
}

export interface SleeveSpec {
  lengthMm: number;
  /** Cuff width relative to the sleeve-top width. */
  cuffRatio: number;
  /** Sleeve-top width multiplier (puffed sleeves). */
  topRatio: number;
}

/** `longueBrasMm` = LONGUEUR_BRAS in mm when the customer measured it. */
export function resolveSleeve(manches: string | undefined, longueBrasMm?: number): SleeveSpec | null {
  switch ((manches ?? '').toUpperCase()) {
    case 'COURTES':
      return { lengthMm: 200, cuffRatio: 0.9, topRatio: 1 };
    case 'TROIS_QUARTS':
      return { lengthMm: 430, cuffRatio: 0.8, topRatio: 1 };
    case 'LONGUES':
      return { lengthMm: longueBrasMm ?? 590, cuffRatio: 0.65, topRatio: 1 };
    case 'BALLON':
      return { lengthMm: 480, cuffRatio: 0.7, topRatio: 1.35 };
    case 'PAPILLON':
      return { lengthMm: 420, cuffRatio: 1.7, topRatio: 1 };
    default:
      return null; // SANS_MANCHES or not chosen: no sleeve piece
  }
}
