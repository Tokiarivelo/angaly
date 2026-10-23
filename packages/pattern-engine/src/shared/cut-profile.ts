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
  // Waist to knee (~58–60 cm at the reference height).
  GENOU: 600,
  MIDI: 700,
  MAXI: 950,
  SOL: 1050,
  ASYMETRIQUE: 800,
};

/** Stature (cm) the skirt lengths above are written for. */
export const REFERENCE_STATURE_CM = 168;

/**
 * The length for a `longueur` choice, scaled by the customer's `STATURE` when given: « au genou » on a 1,55 m woman is
 * shorter than on a 1,80 m one (clamped to ±25 %).
 */
export function resolveSkirtLengthMm(longueur: string | undefined, statureCm?: number): number | undefined {
  const mm = longueur ? SKIRT_LENGTHS_MM[longueur.toUpperCase()] : undefined;
  if (mm === undefined || statureCm === undefined) return mm;
  const k = Math.min(1.25, Math.max(0.75, statureCm / REFERENCE_STATURE_CM));
  return Math.round(mm * k);
}

/**
 * How the neckline runs from the centre front to the shoulder: a curve, a straight V, or square. OFF_SHOULDER has no
 * shoulder at all: the edge runs on from the centre front to the armhole, below the shoulder point (bardot).
 */
export type NecklineShape = 'ROUND' | 'V' | 'SQUARE' | 'SWEETHEART' | 'OFF_SHOULDER';

export interface Neckline {
  /** Half neck opening, from centre front, in mm. */
  widthMm: number;
  /** Depth of the centre-front neck point below the shoulder line, in mm. */
  depthMm: number;
  /** Absent: ROUND. */
  shape?: NecklineShape;
  /** OFF_SHOULDER only: how far below the shoulder point the edge meets the armhole (mm), on the upper arm. */
  armDropMm?: number;
}

const DEFAULT_NECKLINE: Neckline = { widthMm: 80, depthMm: 0 };

const DECOLLETE: Record<string, Neckline> = {
  // « Ras du cou » : the crew neck at the base of the neck (same line as the round collarless neck).
  SAGE: { widthMm: 75, depthMm: 75 },
  MOYEN: { widthMm: 90, depthMm: 80 },
  PLONGEANT: { widthMm: 100, depthMm: 220, shape: 'V' },
  // A sweetheart: two rounded lobes over the bust meeting in a notch at the centre front.
  COEUR: { widthMm: 110, depthMm: 140, shape: 'SWEETHEART' },
  CARRE: { widthMm: 110, depthMm: 120, shape: 'SQUARE' },
  // A U: deeper than a round neck, its sides nearly straight down to a rounded bottom.
  EN_U: { widthMm: 95, depthMm: 160 },
  // Off the shoulders (bardot), measured on Met 108161 against the 3D: the edge crosses the centre front at ~40 % of the
  // way from the shoulder line down to the bust (13 cm on this scale, where MOYEN's 8 cm and EN_U's 16 cm sit), and the
  // top of the arms ~5 cm below the shoulder point, rising gently towards them. `widthMm` only stands for the neck
  // opening where other parts need one (a carrure clamp, a cowl): the edge itself has no neck point.
  HORS_EPAULES: { widthMm: 140, depthMm: 130, shape: 'OFF_SHOULDER', armDropMm: 50 },
};

const COL: Record<string, Neckline> = {
  // Crew neck at the base of the neck: about a sixth of the neck girth + 1.5 cm wide and deep.
  ROND: { widthMm: 75, depthMm: 75 },
  EN_V: { widthMm: 90, depthMm: 170, shape: 'V' },
  BATEAU: { widthMm: 140, depthMm: 20 },
  OFFICIER: { widthMm: 60, depthMm: 0 },
  CHEMISIER: { widthMm: 75, depthMm: 30 },
  LAVALLIERE: { widthMm: 70, depthMm: 20 },
};

/**
 * `decollete` wins over `col` for the size (it is the more explicit depth choice); the shape is the décolleté's own
 * (a V plongeant, a square) or else the collar line's: `col = EN_V` with `decollete = MOYEN` is a V 8 cm deep, not the
 * round neckline it used to become. Null when neither is chosen.
 */
export function resolveNecklineChoice(details: Record<string, string>): Neckline | null {
  const decollete = details['decollete'] ? DECOLLETE[details['decollete'].toUpperCase()] : undefined;
  const col = details['col'] ? COL[details['col'].toUpperCase()] : undefined;
  if (!decollete) return col ?? null;
  const shape = decollete.shape ?? col?.shape;
  if (!shape) return decollete;
  // A V of the same « sage » / « moyen » level goes lower than a round neckline (it uncovers less at that depth):
  // robe-portee-004's « moyen » V measures 11–13 cm on the photo, the round MOYEN 8 cm.
  const vDepth = shape === 'V' && !decollete.shape ? V_DEPTH_MM[details['decollete']!.toUpperCase()] : undefined;
  return { ...decollete, ...(vDepth ? { depthMm: vDepth } : {}), shape };
}

/** Depth (mm) of a V neckline (`col = EN_V`) at the `decollete` levels that have no shape of their own. */
const V_DEPTH_MM: Record<string, number> = { SAGE: 100, MOYEN: 130 };

export function resolveNeckline(details: Record<string, string>): Neckline {
  return resolveNecklineChoice(details) ?? DEFAULT_NECKLINE;
}

/** Cut family of a sleeve piece (how its outline is drawn). */
export type SleeveKind = 'SET_IN' | 'BISHOP' | 'BELL' | 'LANTERN' | 'RAGLAN' | 'KIMONO';

export interface SleeveSpec {
  /** Outline family; absent = a set-in sleeve (curved cap, taper or gigot). */
  kind?: SleeveKind;
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
    case 'TAILLEUR': // long and fitted, cut in two pieces (upper / under sleeve) and finished with a cuff
      return { lengthMm: longueBrasMm ?? 590, cuffRatio: 0.6, topRatio: 1 };
    case 'BALLON':
      return { lengthMm: 480, cuffRatio: 0.7, topRatio: 1.35 };
    case 'PAPILLON':
      return { lengthMm: 420, cuffRatio: 1.7, topRatio: 1 };
    case 'EVEQUE': // bishop: full from the armhole, gathered into a cuff band at the wrist
      return { kind: 'BISHOP', lengthMm: longueBrasMm ?? 590, cuffRatio: 0.5, topRatio: 1.15 };
    case 'CLOCHE': // fitted to the elbow, then flaring like a bell
      return { kind: 'BELL', lengthMm: 500, cuffRatio: 2.1, topRatio: 1 };
    case 'LANTERNE': // gathered at the head and at the cuff, full in between
      return { kind: 'LANTERN', lengthMm: 430, cuffRatio: 0.75, topRatio: 1 };
    case 'RAGLAN': // the seam runs from the neck to the underarm
      return { kind: 'RAGLAN', lengthMm: longueBrasMm ?? 590, cuffRatio: 0.65, topRatio: 1 };
    case 'KIMONO': // cut in one with the bodice: no cap, no armhole seam
      return { kind: 'KIMONO', lengthMm: 380, cuffRatio: 0.9, topRatio: 1.3 };
    case 'CAP': // a cap sleeve: only covers the shoulder
      return { lengthMm: 70, cuffRatio: 1, topRatio: 1 };
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
  GENOU: 1.05,
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
  GENOU: 0.6, // bermuda
  MIDI: 0.75, // pantacourt
  MAXI: 1,
  SOL: 1.04,
  ASYMETRIQUE: 1,
};

export function resolveTrouserLengthFactor(longueur: string | undefined): number {
  return (longueur ? TROUSER_LENGTH_FACTORS[longueur.toUpperCase()] : undefined) ?? 1;
}

/**
 * Knee line of a trouser leg (mm below the waist): measured (HAUTEUR_TAILLE_GENOU), else 47 % of the way from the
 * crotch down the full leg — where the knee is, whatever length the trousers are cut to (bell-bottoms flare from it).
 * Kept clear of the crotch and the hem so short trousers keep a shape.
 */
export function trouserKneeMm(montantMm: number, fullLegMm: number, hemMm: number, measuredKneeMm?: number): number {
  const knee = measuredKneeMm ?? montantMm + (fullLegMm - montantMm) * 0.47;
  const margin = measuredKneeMm !== undefined ? 100 : 60;
  return Math.round(Math.max(montantMm + margin, Math.min(hemMm - margin, knee)));
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
const CUFFLESS_SLEEVES = new Set(['SANS_MANCHES', 'COURTES', 'PAPILLON', 'CLOCHE', 'KIMONO', 'CAP']);

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
    sleeve: fitSleeve(resolveSleeve(manches, defaultArmLengthMm), parameters, defaultArmLengthMm),
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

/**
 * Leg shapes (front piece; the back is 15 mm wider per side). Hem circumference ≈ 4 · halfHemMm + 30, knee likewise:
 * straight ≈ 47 / 43 cm (knee / hem), slim 41 / 35, bootcut 43 / 52, bell-bottoms fitted to the knee (41) then 69 at the
 * hem, palazzo wide from the hip (≈ 72 down to the hem), baggy roomy at the knee (≈ 68) and gathered in at the ankle (55).
 */
const LEG_PROFILES: Record<string, LegProfile> = {
  DROITE: { halfHemMm: 100, kneeRatio: 1.1, hipDeltaMm: 0, waistDeltaMm: 0 },
  AJUSTEE: { halfHemMm: 80, kneeRatio: 1.2, hipDeltaMm: -10, waistDeltaMm: -10 },
  EVASEE: { halfHemMm: 122, kneeRatio: 0.82, hipDeltaMm: 0, waistDeltaMm: 0 },
  SIRENE: { halfHemMm: 165, kneeRatio: 0.58, hipDeltaMm: -5, waistDeltaMm: -5 },
  PRINCESSE: { halfHemMm: 172, kneeRatio: 0.98, hipDeltaMm: 15, waistDeltaMm: 10 },
  OVERSIZE: { halfHemMm: 130, kneeRatio: 1.25, hipDeltaMm: 30, waistDeltaMm: 40 },
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
  // Free-text cuts: the same shapes as the wizard's.
  const like = (k: string): LegProfile => LEG_PROFILES[k]!;
  if (key.includes('SLIM') || key.includes('CIGARETTE')) return like('AJUSTEE');
  if (key.includes('BOOTCUT')) return like('EVASEE');
  if (key.includes('ELEPHANT') || key.includes('BELL') || key.includes('PATTE')) return like('SIRENE');
  if (key.includes('LARGE') || key.includes('PALAZZO') || key.includes('FLUIDE')) return like('PRINCESSE');
  if (key.includes('BAGGY')) return like('OVERSIZE');
  return base;
}

/** A shawl collar was chosen: a jacket takes it (collar and lapel in one piece) in place of its tailored collar. */
export const isShawl = (details: Record<string, string>): boolean => details['col']?.toUpperCase() === 'CHALE';
