/**
 * Deterministic translation of the wizard's design choices (cutType + details) into numbers the
 * garment rules can apply. Pure functions, no I/O (rule 19 / ADR-005).
 *
 * Deltas are in millimetres, per quarter-body piece, relative to the DROITE baseline each rule
 * already used — so an unknown or missing cutType keeps the historical geometry.
 */

import type { EaseLevel } from '../types';
import { bodiceLengthFactor, fitSleeve, withEaseLeg, withEaseTop } from './fit';

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
  // « Ras du cou » : the crew neck at the base of the neck (same line as the round collarless neck).
  SAGE: { widthMm: 75, depthMm: 75 },
  MOYEN: { widthMm: 90, depthMm: 80 },
  PLONGEANT: { widthMm: 100, depthMm: 220 },
  COEUR: { widthMm: 110, depthMm: 140 },
  CARRE: { widthMm: 110, depthMm: 120 },
};

const COL: Record<string, Neckline> = {
  // Crew neck at the base of the neck: about a sixth of the neck girth + 1.5 cm wide and deep.
  ROND: { widthMm: 75, depthMm: 75 },
  EN_V: { widthMm: 90, depthMm: 170 },
  BATEAU: { widthMm: 140, depthMm: 20 },
  OFFICIER: { widthMm: 60, depthMm: 0 },
  CHEMISIER: { widthMm: 75, depthMm: 30 },
  LAVALLIERE: { widthMm: 70, depthMm: 20 },
};

/** `decollete` wins over `col` (it is the more explicit depth choice). Null when neither is chosen. */
export function resolveNecklineChoice(details: Record<string, string>): Neckline | null {
  const decollete = details['decollete'] ? DECOLLETE[details['decollete'].toUpperCase()] : undefined;
  const col = details['col'] ? COL[details['col'].toUpperCase()] : undefined;
  return decollete ?? col ?? null;
}

export function resolveNeckline(details: Record<string, string>): Neckline {
  return resolveNecklineChoice(details) ?? DEFAULT_NECKLINE;
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

/**
 * Length multiplier for tops and trousers from the `longueur` detail (1 = the rule's own default).
 * Skirts and dresses use absolute lengths instead (see resolveSkirtLengthMm).
 */
const TOP_LENGTH_FACTORS: Record<string, number> = {
  MINI: 0.8,
  MIDI: 1.15,
  MAXI: 1.45,
  SOL: 1.8,
  ASYMETRIQUE: 1.25,
};

export function resolveTopLengthFactor(longueur: string | undefined): number {
  return (longueur ? TOP_LENGTH_FACTORS[longueur.toUpperCase()] : undefined) ?? 1;
}

const TROUSER_LENGTH_FACTORS: Record<string, number> = {
  MINI: 0.45, // short
  MIDI: 0.75, // pantacourt
  MAXI: 1,
  SOL: 1.04,
  ASYMETRIQUE: 1,
};

export function resolveTrouserLengthFactor(longueur: string | undefined): number {
  return (longueur ? TROUSER_LENGTH_FACTORS[longueur.toUpperCase()] : undefined) ?? 1;
}

export interface TopAdjustments {
  /** Added to the quarter bust width / waist width (mm). */
  bodiceDeltaMm: number;
  waistDeltaMm: number;
  /** Added to the side hem point (mm): hip ease plus half the flare — tops barely flare. */
  hemDeltaMm: number;
  lengthFactor: number;
  neckline: Neckline | null;
  /** Null = keep the rule's own sleeve; false-y piece list handled by the caller. */
  sleeve: SleeveSpec | null;
  sleeveless: boolean;
  /** Collar piece wanted? Round/V/boat/no collar choices remove it. */
  includeCollar: boolean;
  /** Cuff piece wanted? Only for long and 3/4 sleeves (or when sleeves are not chosen). */
  includeCuff: boolean;
}

const COLLARLESS = new Set(['SANS_COL', 'ROND', 'EN_V', 'BATEAU']);
const CUFFLESS_SLEEVES = new Set(['SANS_MANCHES', 'COURTES', 'PAPILLON']);

/** Everything a tailored top (chemise, veste, costume jacket) takes from the wizard's choices. */
export function resolveTopAdjustments(
  parameters: {
    cutType: string;
    details: Record<string, string>;
    ease?: EaseLevel;
    fullness?: { skirt?: number; sleeve?: number };
    lengths?: { skirtPct?: number; sleevePct?: number; bodicePct?: number };
  },
  defaultArmLengthMm: number,
): TopAdjustments {
  const profile = resolveCutProfile(parameters.cutType);
  const manches = parameters.details['manches']?.toUpperCase();
  const col = parameters.details['col']?.toUpperCase();

  const base: TopAdjustments = {
    bodiceDeltaMm: profile.bodiceDeltaMm,
    waistDeltaMm: profile.waistDeltaMm,
    hemDeltaMm: profile.hipDeltaMm + Math.round(profile.hemFlareMm * 0.5),
    lengthFactor: resolveTopLengthFactor(parameters.details['longueur']) * bodiceLengthFactor(parameters.lengths),
    neckline: resolveNecklineChoice(parameters.details),
    sleeve: fitSleeve(resolveSleeve(manches, defaultArmLengthMm), parameters),
    sleeveless: manches === 'SANS_MANCHES' || parameters.lengths?.sleevePct === 0,
    includeCollar: !(col && COLLARLESS.has(col)),
    includeCuff: !(manches && CUFFLESS_SLEEVES.has(manches)) && parameters.lengths?.sleevePct !== 0,
  };
  return withEaseTop(base, parameters.ease);
}

export interface LegProfile {
  /** Half width of the hem on the front piece (mm). */
  halfHemMm: number;
  /** Knee width relative to the hem (below 1 = flared leg, above 1 = tapered). */
  kneeRatio: number;
  hipDeltaMm: number;
  waistDeltaMm: number;
}

const LEG_PROFILES: Record<string, LegProfile> = {
  DROITE: { halfHemMm: 100, kneeRatio: 1.1, hipDeltaMm: 0, waistDeltaMm: 0 },
  AJUSTEE: { halfHemMm: 80, kneeRatio: 1.1, hipDeltaMm: -10, waistDeltaMm: -10 },
  EVASEE: { halfHemMm: 125, kneeRatio: 0.9, hipDeltaMm: 0, waistDeltaMm: 0 },
  SIRENE: { halfHemMm: 120, kneeRatio: 0.8, hipDeltaMm: -5, waistDeltaMm: -5 },
  PRINCESSE: { halfHemMm: 140, kneeRatio: 1.05, hipDeltaMm: 10, waistDeltaMm: 10 },
  OVERSIZE: { halfHemMm: 150, kneeRatio: 1.1, hipDeltaMm: 30, waistDeltaMm: 40 },
};

/** Trouser leg shape. Historical SLIM/LARGE keywords keep working for free-text cuts. */
export function resolveLegProfile(
  cutType: string | null | undefined,
  ease?: EaseLevel,
): LegProfile {
  return withEaseLeg(baseLegProfile(cutType), ease);
}

function baseLegProfile(cutType: string | null | undefined): LegProfile {
  const key = (cutType ?? '').toUpperCase();
  const exact = LEG_PROFILES[key];
  if (exact) return exact;
  const base = LEG_PROFILES['DROITE']!;
  if (key.includes('SLIM') || key.includes('CIGARETTE')) return { ...base, halfHemMm: 80 };
  if (key.includes('LARGE') || key.includes('PALAZZO') || key.includes('FLUIDE')) {
    return { ...base, halfHemMm: 140 };
  }
  return base;
}
