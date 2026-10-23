import type {
  IPatternRule,
  MeasurementSet,
  PatternParameters,
  PatternPieceGeometry,
} from '../types';
import {
  resolveCutProfile,
  resolveNeckline,
  resolveSkirtLengthMm,
  resolveSleeve,
} from '../shared/cut-profile';
import {
  beltPieces,
  collarPiece,
  markOffShoulder,
  offShoulderNeckline,
  pointSkirtTop,
  pointWaist,
  WAIST_POINT_DROP_MM,
  cordPiece,
  crossOverFront,
  CUFF_HEIGHT_MM,
  cuffPiece,
  curveNeckline,
  facingPiece,
  NECK_CURVE_SEGMENTS,
  openCentreFront,
  plastronPiece,
  skirtOutline,
  sleevePiece,
  splitUnderbust,
} from '../shared/shapes';
import { goreSplit, princessSplit, twoPieceSleeve, UNDER_SLEEVE_HALF } from '../shared/panels';
import {
  asymmetricHemPieces,
  buildOverskirtPiece,
  buildSkirtBlock,
  fitSkirtBlockToCut,
  buildTrainPiece,
  computeCowlNeck,
  drapeBodicePiece,
  resolveDrape,
  wrapFrontPiece,
} from '../blocks';
import {
  bodiceLengthFactor,
  DEFAULT_ARM_LENGTH_MM,
  fitSleeve,
  fitTorsoOutline,
  floorQuarters,
  hipGirthCm,
  MIN_WEARING_EASE_MM,
  resolveLengthMm,
  skirtFullnessExtraMm,
  withEase,
} from '../shared/fit';

const REQUIRED_MEASUREMENTS = ['TOUR_POITRINE', 'TOUR_TAILLE', 'TOUR_BASSIN', 'LONGUEUR_DOS'];
/** Centre-back neck point below the shoulder-neck point (a drafted back neckline is a shallow curve). */
const BACK_NECK_DEPTH_MM = 20;
/** Off-the-shoulder back: the edge crosses the centre back this far below the shoulder line (mm). */
const OFF_SHOULDER_BACK_DEPTH_MM = 80;
/** Back necklines (`dos`): centre-back depth (mm below the neck point) and neck width (mm from the centre back). */
const BACK_V = { depthMm: 200, neckMm: 85 };
/** Dos nu: down to this far above the waist, the straps this far from the centre back. */
const OPEN_BACK = { aboveWaistMm: 70, neckMm: 105 };
/** Transparent: the fabric back is cut as low as a U, the tulle above it up to the base neckline. */
const SHEER_BACK = { depthMm: 170, neckMm: 95 };
/** Goutte: a teardrop opening on the centre back under the neck (top, bottom, widest, mm). */
const KEYHOLE = { topMm: 55, bottomMm: 140, widthMm: 22 };
/** The back bodice's centre-back neck never goes lower than this share of its height (V, sheer). */
const BACK_DEPTH_SHARE = 0.6;

/** Sets the centre-back depth and the neck width of a back bodice outline (first point = centre back, second = neck). */
function setBackNeckline(outline: Outline, style: string | undefined, height: number): void {
  const spec =
    style === 'DECOLLETE_V'
      ? { depth: Math.min(BACK_V.depthMm, height * BACK_DEPTH_SHARE), neck: BACK_V.neckMm }
      : style === 'DOS_NU'
        ? { depth: Math.max(BACK_NECK_DEPTH_MM, height - OPEN_BACK.aboveWaistMm), neck: OPEN_BACK.neckMm }
        : style === 'TRANSPARENT'
          ? { depth: Math.min(SHEER_BACK.depthMm, height * BACK_DEPTH_SHARE), neck: SHEER_BACK.neckMm }
          : null;
  if (!spec || outline.length < 3) return;
  const last = outline.length - 1;
  outline[0] = { x: 0, y: Math.round(spec.depth) };
  if (outline[last]!.x === 0) outline[last] = { ...outline[0] };
  outline[1] = { x: spec.neck, y: outline[1]!.y };
}

/** A teardrop opening cut into the centre-back edge (the last edge, from the waist up to the neck). */
function keyholeBack(outline: Outline): Outline {
  const last = outline.length - 1;
  const top = outline[0]!.y + KEYHOLE.topMm;
  const bottom = outline[0]!.y + KEYHOLE.bottomMm;
  const drop: Outline = [
    { x: 0, y: bottom },
    { x: Math.round(KEYHOLE.widthMm * 0.6), y: Math.round(bottom - (bottom - top) * 0.25) },
    { x: KEYHOLE.widthMm, y: Math.round(bottom - (bottom - top) * 0.6) },
    { x: Math.round(KEYHOLE.widthMm * 0.6), y: Math.round(top + (bottom - top) * 0.12) },
    { x: 0, y: top },
  ];
  return [...outline.slice(0, last), ...drop, { ...outline[last]! }];
}

/** The tulle of a sheer back: from the base neckline (centre `topMm` deep, 75 mm wide) down to the fabric's U edge. */
function sheerBackPiece(topMm: number, depthMm: number, neckMm: number): PatternPieceGeometry {
  const u: Outline = [];
  for (let i = 0; i <= 6; i += 1) {
    const t = (Math.PI / 2) * (i / 6);
    u.push({ x: Math.round(neckMm * Math.sin(t)), y: Math.round(depthMm * Math.cos(t)) });
  }
  const outlineMm: Outline = [{ x: 0, y: topMm }, { x: 75, y: 0 }, { x: neckMm, y: 0 }, ...u.reverse().slice(1), { x: 0, y: topMm }];
  return {
    name: 'Tulle du dos (transparent)',
    fabricRecommendation: 'Tulle ou dentelle (même ton)',
    quantity: 2,
    seamAllowanceMm: 10,
    grainline: { angleDegrees: 90, originX: Math.round(neckMm / 2), originY: Math.round(depthMm / 2) },
    notches: [],
    outlineMm,
  };
}

/** Under-bust gathers: fabric gathered onto the seam (1.5 × its length) and the midriff band's height. */
const UNDERBUST_FULLNESS = 1.3;
/** Taille basse (basque): the bodice runs this far below the natural waist, the skirt starts there. */
const BASQUE_DROP_MM = 110;
/** Taille haute (empire): the seam sits this far above the natural waist, under the bust; the skirt starts there. */
const EMPIRE_RISE_MM = 120;
/** Under-bust girth as a share of the bust girth (the empire seam closes round it). */
const UNDERBUST_RATIO = 0.9;
/** Depth of the hip line below the waist used by the skirt outline. */
const HIP_DEPTH_MM = 200;
const MIDRIFF_RATIO = 0.2;
/** Crossover gathered front: how far past the centre front each side runs at the seam (share of the half seam). */
const CROSSOVER_RATIO = 0.6;

/**
 * Bell of a gored skirt (see `skirtOutline`): measured on the 1890s coat-dress plate, a fifth of the way down the
 * skirt is already 35 % of the way from the waist's width to the hem's (0.19^0.65 ≈ 0.34).
 */
const GORED_BELL = 0.65;

/** Half opening (mm) of a robe-manteau's fronts at the neck, the waist and the hem. */
const COAT_OPEN_NECK_MM = 45;
const COAT_OPEN_WAIST_MM = 25;
const COAT_OPEN_HEM_MM = 150;
/** Width of a robe-manteau's facings (front opening and back neck), mm. */
const FACING_MM = 60;
/** Revers of a robe-manteau (`devant = MANTEAU_REVERS`): width at the waist, widest over the bust, mm. */
const REVERS_WAIST_MM = 12;
const REVERS_MAX_MM = 50;
/** Share of the run (waist → neck) where the revers is widest (over the bust). */
const REVERS_PEAK = 0.65;
/**
 * Corsage ouvert sur un gilet (`devant = GILET`, cuirasse 1880): half opening of the bodice fronts at the neck, the
 * waist and the bodice's lower edge (the basque opens over the hips); the skirt stays closed.
 */
const GILET_OPEN_NECK_MM = 45;
const GILET_OPEN_WAIST_MM = 40;
const GILET_OPEN_BOTTOM_MM = 60;
/** The gilet shows widest over the bust (half opening, mm), this share of the way down from the neck to the waist. */
const GILET_OPEN_BUST_MM = 75;
const GILET_BUST_SHARE = 0.4;
/** A buttoned gilet is cut in two halves, each running this far past the centre front (button stand, mm). */
const GILET_STAND_MM = 15;
/** How far the gilet runs under the bodice fronts past the opening's edge (mm). */
const GILET_UNDERLAP_MM = 30;
/** Basque (`basque = POINTES | PANS_CROISES`): depth of the gilet's points below the bodice (mm). */
const BASQUE_POINT_MM = 90;
/** Crossed tabs (`PANS_CROISES`): width (mm), how far out they start at the skirt's top and how low they meet. */
const TAB_WIDTH_MM = 50;
const TAB_START_MM = 160;
const TAB_MEET_MM = 190;
/** Inner waist stay (gros-grain) of a long fitted dress: height (mm) and overlap at the closure. */
const WAIST_STAY_MM = 30;
const WAIST_STAY_OVERLAP_MM = 40;
/** Shaped hem facing of a floor-length skirt (mm) and the placket facings of a skirt closed in front. */
const HEM_FACING_MM = 70;
const SKIRT_PLACKET = { lengthMm: 220, widthMm: 50 };
/** Buttons down the centre front (`fermeture = BOUTONS | BOUTONS_TAILLE`): diameter, spacing, first one below the neck. */
const BUTTON_DIAMETER_MM = 12;
const BUTTON_SPACING_MM = 35;
const BUTTON_FROM_NECK_MM = 15;
/** A puffed (gigot) or bishop sleeve reaching this share of the arm is finished with a cuff. */
const CUFF_FROM_ARM_SHARE = 0.85;

type Outline = PatternPieceGeometry['outlineMm'];

const ringOf = (outline: Outline): Outline => {
  const first = outline[0];
  const last = outline[outline.length - 1];
  return first && last && first.x === last.x && first.y === last.y ? outline.slice(0, -1) : outline;
};

/** Index of the shoulder-neck point: the highest of the neckline's points (the last one on a tie). */
const neckPointIndex = (ring: Outline): number => {
  let best = 0;
  for (let i = 0; i <= Math.min(ring.length - 1, NECK_CURVE_SEGMENTS + 1); i += 1) if (ring[i]!.y <= ring[best]!.y) best = i;
  return best;
};

/** First index of the run of points `on` the opening edge, walking forward round the ring (-1 when none). */
const runStart = (ring: Outline, on: (p: { x: number; y: number }) => boolean): number => {
  for (let i = 0; i < ring.length; i += 1) if (on(ring[i]!) && !on(ring[(i - 1 + ring.length) % ring.length]!)) return i;
  return -1;
};

/**
 * Heights (mm) of a bodice half's shoulder tip, underarm and waist, read off its outline: the shoulder tip is the
 * widest point of its top fifth, the underarm the widest point between it and the waist (the lowest one on a tie).
 */
const torsoHeights = (outline: Outline, waistY: number): { shoulderY: number; underarmY: number; waistY: number } => {
  const ring = ringOf(outline);
  let tip = ring[0]!;
  for (const p of ring) if (p.y < waistY * 0.2 && p.x > tip.x) tip = p;
  let arm = tip;
  for (const p of ring) if (p.y > tip.y && p.y < waistY && p.x >= arm.x - 0.5) arm = p.x > arm.x + 0.5 || p.y > arm.y ? p : arm;
  return { shoulderY: tip.y, underarmY: arm.y, waistY };
};

/**
 * The gilet of a bodice opened over one (`devant = GILET`), from its plastron: a buttoned gilet is cut in two halves
 * with a button stand past the centre front; with a basque (`POINTES`, `PANS_CROISES`) each half ends in a point
 * below the bodice (a waistcoat's points, a notch between them at the centre front).
 */
function giletPiece(plastron: PatternPieceGeometry, details: Record<string, string>): PatternPieceGeometry {
  const buttoned = ['BOUTONS', 'BOUTONS_TAILLE'].includes(details['fermeture']?.toUpperCase() ?? '');
  const pointed = ['POINTES', 'PANS_CROISES'].includes(details['basque']?.toUpperCase() ?? '');
  const ring = ringOf(plastron.outlineMm);
  const length = Math.max(...ring.map((p) => p.y));
  const bottomHalf = Math.max(...ring.filter((p) => p.y >= length - 0.5).map((p) => p.x));
  let outline: Outline = ring.flatMap((p) =>
    pointed && p.x === 0 && p.y === length
      ? [{ x: Math.round(bottomHalf * 0.55), y: length + BASQUE_POINT_MM }, { x: 0, y: Math.round(length + BASQUE_POINT_MM * 0.35) }]
      : [p],
  );
  const stand = buttoned ? GILET_STAND_MM : 0;
  outline = outline.map((p) => ({ x: p.x + stand, y: p.y }));
  if (buttoned) outline = [{ x: 0, y: 0 }, ...outline.slice(1, -1), { x: 0, y: outline[outline.length - 1]!.y }];
  const bottom = Math.max(...outline.map((p) => p.y));
  return {
    ...plastron,
    name: 'Plastron (gilet)',
    quantity: buttoned ? 2 : 1,
    fabricRecommendation: buttoned ? 'Tissu contrastant (gilet), boutonné au milieu devant' : 'Tissu contrastant (gilet)',
    grainline: { angleDegrees: 90, originX: Math.round(stand + bottomHalf / 2), originY: Math.round(bottom / 2) },
    outlineMm: [...outline, { ...outline[0]! }],
  };
}

/** The pieces of a gilet's basque that show on the skirt below the bodice, as detail areas of the skirt front. */
function basqueAreas(details: Record<string, string>, bottomHalfMm: number): { lines: NonNullable<PatternPieceGeometry['internalLinesMm']>; pieces: PatternPieceGeometry[] } {
  const basque = details['basque']?.toUpperCase();
  if (basque !== 'POINTES' && basque !== 'PANS_CROISES') return { lines: [], pieces: [] };
  const point: Outline = [
    { x: 0, y: 0 },
    { x: Math.round(bottomHalfMm), y: 0 },
    { x: Math.round(bottomHalfMm * 0.55), y: BASQUE_POINT_MM },
    { x: 0, y: Math.round(BASQUE_POINT_MM * 0.35) },
    { x: 0, y: 0 },
  ];
  const lines: NonNullable<PatternPieceGeometry['internalLinesMm']> = [
    { kind: 'PLACEMENT', points: point, detail: { pieces: ['Plastron (gilet)'], area: point, contrast: true, layer: 1 } },
  ];
  const pieces: PatternPieceGeometry[] = [];
  if (basque === 'PANS_CROISES') {
    // Each tab runs from the side of the skirt's top down across the centre front (the pair makes a V).
    const inner = TAB_START_MM - TAB_WIDTH_MM;
    const atCentre = Math.round((inner / (inner + TAB_WIDTH_MM / 2)) * TAB_MEET_MM);
    const tab: Outline = [
      { x: inner, y: 0 },
      { x: TAB_START_MM, y: 0 },
      { x: Math.round(TAB_WIDTH_MM / 2), y: TAB_MEET_MM },
      { x: 0, y: TAB_MEET_MM },
      { x: 0, y: atCentre },
      { x: inner, y: 0 },
    ];
    lines.push({ kind: 'PLACEMENT', points: tab, detail: { pieces: ['Pan croisé'], area: tab, contrast: true } });
    const length = Math.round(Math.hypot(TAB_START_MM - TAB_WIDTH_MM / 2, TAB_MEET_MM) + TAB_WIDTH_MM / 2);
    const slant = Math.round(TAB_WIDTH_MM * 0.6);
    pieces.push({
      name: 'Pan croisé',
      fabricRecommendation: 'Tissu contrastant (gilet), doublé',
      quantity: 2,
      seamAllowanceMm: 10,
      grainline: { angleDegrees: 45, originX: Math.round(length / 2), originY: Math.round(TAB_WIDTH_MM / 2) },
      notches: [],
      outlineMm: [{ x: 0, y: 0 }, { x: length, y: 0 }, { x: length - slant, y: TAB_WIDTH_MM }, { x: slant, y: TAB_WIDTH_MM }, { x: 0, y: 0 }],
    });
  }
  return { lines, pieces };
}

const rect = (w: number, h: number): Outline => [{ x: 0, y: 0 }, { x: w, y: 0 }, { x: w, y: h }, { x: 0, y: h }, { x: 0, y: 0 }];

/** Shaped hem facing of a skirt piece: a band along its hem, as wide as HEM_FACING_MM, cut as many times as the piece. */
function hemFacing(piece: PatternPieceGeometry): PatternPieceGeometry | null {
  const ring = ringOf(piece.outlineMm);
  const bottom = Math.max(...ring.map((p) => p.y));
  const onHem = (i: number): boolean => ring[(i + ring.length) % ring.length]!.y >= bottom - 0.5;
  const from = ring.findIndex((_, i) => onHem(i) && !onHem(i - 1));
  if (from < 0) return null;
  let to = from;
  while (onHem(to + 1) && (to + 1) % ring.length !== from) to = (to + 1) % ring.length;
  if (to === from) return null;
  const facing = facingPiece(`Parementure d’ourlet (${piece.name})`, piece.outlineMm, from, to, HEM_FACING_MM, piece.quantity);
  return facing ? { ...facing, fabricRecommendation: 'Même tissu ou taffetas (balayeuse)' } : null;
}

export const RobeRule: IPatternRule = {
  garmentType: 'ROBE',
  requiredMeasurementKeys: REQUIRED_MEASUREMENTS,
  appliesTo(parameters: PatternParameters): boolean {
    // ROBE_MARIEE has its own dedicated rule (robe-mariee.rule.ts) with structured-bodice
    // ease and a train — ROBE alone no longer falls back to accepting it.
    return parameters.garmentType === 'ROBE';
  },
  warnings(parameters: PatternParameters): string[] {
    const drape = resolveDrape(parameters);
    return drape.hem && drape.skirt?.kind === 'CIRCLE_SKIRT'
      ? ['Ourlet asymétrique ignoré : le bord d\'une jupe cercle est un arc, il ne se décale pas.']
      : [];
  },
  computePieces(
    parameters: PatternParameters,
    measurements: MeasurementSet,
  ): PatternPieceGeometry[] {
    const tourPoitrine = measurements['TOUR_POITRINE'] ?? 90;
    const tourTaille = measurements['TOUR_TAILLE'] ?? 70;
    const tourBassin = hipGirthCm(measurements);
    const longueurDos = measurements['LONGUEUR_DOS'] ?? 40;

    const profile = withEase(resolveCutProfile(parameters.cutType), parameters.ease);
    const neckline = resolveNeckline(parameters.details);
    const tp = tourPoitrine * 10;
    const tt = tourTaille * 10;
    const tb = tourBassin * 10;
    const lgDos = Math.round(longueurDos * 10 * bodiceLengthFactor(parameters.lengths));
    const lgDevantMesure =
      measurements['LONGUEUR_DEVANT'] !== undefined
        ? Math.round(measurements['LONGUEUR_DEVANT'] * 10 * bodiceLengthFactor(parameters.lengths))
        : undefined;

    // Taille haute (empire) : the bodice stops under the bust, its lower seam closes round the under-bust.
    const empire = parameters.details['taille']?.toUpperCase() === 'HAUTE';
    const rise = empire ? EMPIRE_RISE_MM : 0;
    const seamQuarter = (waistQuarter: number): number =>
      empire ? Math.max(waistQuarter, (tp * UNDERBUST_RATIO) / 4) : waistQuarter;

    // Dimensions corsage — never under the body in woven cloth (MIN_WEARING_EASE_MM; the deltas are per quarter).
    const [largeurCorsageDevant, largeurCorsageDos] = floorQuarters(
      tp / 4 + 20 + profile.bodiceDeltaMm, // 2cm aisance (DROITE)
      tp / 4 - 10 + profile.bodiceDeltaMm,
      tp,
      MIN_WEARING_EASE_MM.bust,
      parameters.fabric,
    );
    const [largeurTailleDevant, largeurTailleDos] = floorQuarters(
      seamQuarter(tt / 4) + 20 + profile.waistDeltaMm,
      seamQuarter(tt / 4) - 10 + profile.waistDeltaMm,
      empire ? 4 * seamQuarter(tt / 4) : tt,
      MIN_WEARING_EASE_MM.waist,
      parameters.fabric,
    );
    const hauteurCorsageDevant = (lgDevantMesure ?? lgDos + 40) - rise; // LONGUEUR_DEVANT mesurée si fournie
    const hauteurCorsageDos = lgDos - rise;

    // Dimensions jupe
    const longueurJupe = resolveLengthMm(
      measurements['LONGUEUR_JUPE'] !== undefined
        ? measurements['LONGUEUR_JUPE'] * 10
        : (resolveSkirtLengthMm(parameters.details['longueur'], measurements['STATURE']) ?? 650), // 65cm par défaut
      parameters.lengths?.skirtPct,
      [300, 1500],
    );
    const [largeurJupeDevant, largeurJupeDos] = floorQuarters(
      tb / 4 + 15 + profile.hipDeltaMm,
      tb / 4 - 10 + profile.hipDeltaMm,
      tb,
      MIN_WEARING_EASE_MM.hip,
      parameters.fabric,
    );
    // Hem width. Without a measured fullness the cut's own flare applies. With `fullness.skirt` (hem ÷ waist, read
    // off the photo) it REPLACES that flare — adding both made every « évasée » photo a ball gown — and never goes
    // narrower than the hip line.
    const skirtFullness = parameters.fullness?.skirt;
    const waistGirth = tt + 40;
    const hemFor = (hipWidth: number, quarterOffset: number): number =>
      skirtFullness !== undefined && skirtFullness > 1
        ? Math.max(hipWidth, Math.round((skirtFullness * waistGirth) / 4 + quarterOffset))
        : hipWidth + profile.hemFlareMm + skirtFullnessExtraMm(parameters.fullness, hipWidth);
    const hemDevant = hemFor(largeurJupeDevant, 12);
    const hemDos = hemFor(largeurJupeDos, -12);

    // Taille basse : the bodice goes on over the high hip, widening from the waist towards the hip line;
    // the skirt starts at that lower seam and is shorter by as much.
    const drop = parameters.details['taille']?.toUpperCase() === 'BASSE' ? BASQUE_DROP_MM : 0;
    const atDrop = (waist: number, hip: number): number =>
      Math.round(waist + (hip - waist) * Math.sqrt(Math.min(1, drop / HIP_DEPTH_MM)));
    const basqueDevant = atDrop(largeurTailleDevant, largeurJupeDevant);
    const basqueDos = atDrop(largeurTailleDos, largeurJupeDos);
    // The hem stays at the same height: an empire skirt is longer by the rise, and the hip line lies deeper.
    const jupeLongueur = longueurJupe - drop + rise;
    // HAUTEUR_BASSIN (taille → bassin) si mesurée, sinon 20 cm ; la ligne de bassin de la jupe suit la couture de taille.
    const measuredHip = measurements['HAUTEUR_BASSIN'] !== undefined ? measurements['HAUTEUR_BASSIN'] * 10 : HIP_DEPTH_MM;
    const hipDepth = Math.max(20, Math.min(measuredHip, jupeLongueur / 2) - drop + rise);
    const basque = (outline: Array<{ x: number; y: number }>, height: number, width: number) =>
      drop === 0
        ? outline
        : outline.flatMap((p) =>
            p.x === 0 && p.y === height
              ? [{ x: width, y: height + drop }, { x: 0, y: height + drop }]
              : [p],
          );

    const corsageDevant: PatternPieceGeometry = {
      name: 'Corsage Devant',
      fabricRecommendation: 'Satin, Soie ou Coton de haute tenue',
      quantity: 1,
      seamAllowanceMm: 10,
      grainline: { angleDegrees: 90, originX: largeurCorsageDevant / 2, originY: hauteurCorsageDevant / 2 },
      notches: [{ positionAlongEdge: 0.5, edgeIndex: 1 }],
      outlineMm: [
        { x: 0, y: neckline.depthMm },
        { x: neckline.widthMm, y: 0 },
        { x: largeurCorsageDevant, y: 50 },
        { x: largeurCorsageDevant, y: hauteurCorsageDevant * 0.55 },
        { x: largeurTailleDevant, y: hauteurCorsageDevant },
        { x: 0, y: hauteurCorsageDevant },
        { x: 0, y: neckline.depthMm },
      ],
    };
    corsageDevant.outlineMm = basque(corsageDevant.outlineMm, hauteurCorsageDevant, basqueDevant);

    const corsageDos: PatternPieceGeometry = {
      name: 'Corsage Dos',
      fabricRecommendation: 'Satin, Soie ou Coton de haute tenue',
      quantity: 2,
      seamAllowanceMm: 10,
      grainline: { angleDegrees: 90, originX: largeurCorsageDos / 2, originY: hauteurCorsageDos / 2 },
      notches: [{ positionAlongEdge: 0.5, edgeIndex: 1 }],
      outlineMm: [
        { x: 0, y: BACK_NECK_DEPTH_MM },
        { x: 75, y: 0 },
        { x: largeurCorsageDos, y: 45 },
        { x: largeurCorsageDos, y: hauteurCorsageDos * 0.55 },
        { x: largeurTailleDos, y: hauteurCorsageDos },
        { x: 0, y: hauteurCorsageDos },
        { x: 0, y: BACK_NECK_DEPTH_MM },
      ],
    };
    corsageDos.outlineMm = basque(corsageDos.outlineMm, hauteurCorsageDos, basqueDos);

    // Jupe en lés (1890s gored skirt): a bell, flaring from the waist, not a straight A that clears the hips only
    // just (that one clung to the hips and seat, then flared: a mermaid, on the inspiration plate's coat-dress).
    const bell = parameters.details['jupe']?.toUpperCase() === 'EN_LES' ? GORED_BELL : undefined;
    const jupeDevant: PatternPieceGeometry = {
      name: 'Jupe Devant',
      fabricRecommendation: null,
      quantity: 1,
      seamAllowanceMm: 10,
      grainline: { angleDegrees: 90, originX: largeurJupeDevant / 2, originY: longueurJupe / 2 },
      notches: [],
      outlineMm: skirtOutline(basqueDevant, largeurJupeDevant, hemDevant, jupeLongueur, profile.fishtail, hipDepth, bell),
    };

    const jupeDos: PatternPieceGeometry = {
      name: 'Jupe Dos',
      fabricRecommendation: null,
      quantity: 2,
      seamAllowanceMm: 10,
      grainline: { angleDegrees: 90, originX: largeurJupeDos / 2, originY: longueurJupe / 2 },
      notches: [],
      outlineMm: skirtOutline(basqueDos, largeurJupeDos, hemDos, jupeLongueur, profile.fishtail, hipDepth, bell),
    };

    // Épaules, emmanchure et pince de poitrine d'après les mesures du corps (no-op sans elles).
    corsageDevant.outlineMm = fitTorsoOutline(corsageDevant.outlineMm, measurements, {
      side: 'front',
      neckWidthMm: neckline.widthMm,
    });
    corsageDos.outlineMm = fitTorsoOutline(corsageDos.outlineMm, measurements, {
      side: 'back',
      neckWidthMm: 75,
      dartSegmentIdx: null,
    });
    // Drafted necklines are curves, not the straight line from the centre to the shoulder.
    // Off the shoulders: no neckline nor shoulder seam, one edge from the centre to the armhole on the upper arm.
    const offShoulder = neckline.shape === 'OFF_SHOULDER';
    const armDrop = neckline.armDropMm ?? 0;
    corsageDevant.outlineMm = offShoulder
      ? offShoulderNeckline(corsageDevant.outlineMm, 2, neckline.depthMm, armDrop)
      : curveNeckline(corsageDevant.outlineMm, neckline.shape);
    // Le dos (détail `dos`) : V, dos nu, goutte, transparent — sinon l'encolure dos de base.
    const backStyle = parameters.details['dos']?.toUpperCase();
    if (!offShoulder) setBackNeckline(corsageDos.outlineMm, backStyle, hauteurCorsageDos);
    corsageDos.outlineMm = offShoulder
      ? offShoulderNeckline(corsageDos.outlineMm, 2, OFF_SHOULDER_BACK_DEPTH_MM, armDrop)
      : curveNeckline(corsageDos.outlineMm, backStyle === 'DECOLLETE_V' ? 'V' : 'ROUND');
    if (!offShoulder && backStyle === 'GOUTTE') corsageDos.outlineMm = keyholeBack(corsageDos.outlineMm);
    // Taille en pointe : the front bodice falls to a point at the centre front, the front skirt dips to meet it.
    if (parameters.details['taille']?.toUpperCase() === 'POINTE') {
      corsageDevant.outlineMm = pointWaist(corsageDevant.outlineMm, WAIST_POINT_DROP_MM);
      jupeDevant.outlineMm = pointSkirtTop(jupeDevant.outlineMm, WAIST_POINT_DROP_MM);
    }

    // Fronces sous la poitrine : the front is cut under the bust, gathered onto a midriff band.
    let midriff: PatternPieceGeometry | null = null;
    const corsage = parameters.details['corsage']?.toUpperCase();
    if (corsage === 'FRONCES_SOUS_POITRINE' || corsage === 'CROISE_FRONCE') {
      const bandMm = Math.round(Math.min(110, Math.max(60, hauteurCorsageDevant * MIDRIFF_RATIO)));
      const split = splitUnderbust(corsageDevant.outlineMm, hauteurCorsageDevant - bandMm, UNDERBUST_FULLNESS);
      if (split) {
        corsageDevant.outlineMm = split.upper;
        corsageDevant.grainline = { ...corsageDevant.grainline, originY: split.seamYMm / 2 };
        if (corsage === 'CROISE_FRONCE') {
          // Cache-cœur : a pair of fronts, each crossing past the centre front onto the band.
          corsageDevant.name = 'Corsage Devant croisé';
          corsageDevant.quantity = 2;
          corsageDevant.outlineMm = crossOverFront(split.upper, split.seamYMm, split.seamMm * CROSSOVER_RATIO);
        }
        midriff = {
          name: 'Empiècement Devant',
          fabricRecommendation: corsageDevant.fabricRecommendation,
          quantity: 1,
          seamAllowanceMm: 10,
          grainline: { angleDegrees: 90, originX: largeurTailleDevant / 2, originY: bandMm / 2 },
          notches: [{ positionAlongEdge: 0.5, edgeIndex: 0 }],
          outlineMm: split.band,
        };
      }
    }

    // Blocs de drapé (S4) : un bloc de jupe remplace les panneaux de jupe de la règle ; le portefeuille
    // croise le devant du corsage ; le col bénitier ajoute une pièce taillée dans le biais.
    const drape = resolveDrape(parameters);
    // The bodice's own waist round + 2 cm (= tt + 40 + 4 × waist delta while the floor does not apply).
    const waistCircumference = 2 * (basqueDevant + basqueDos) + 20;
    let pieces: PatternPieceGeometry[] = [
      corsageDevant,
      ...(midriff ? [midriff] : []),
      corsageDos,
      ...(drape.skirt
        ? buildSkirtBlock(
            fitSkirtBlockToCut(drape.skirt, waistCircumference, parameters.cutType),
            waistCircumference,
            jupeLongueur,
            null,
            parameters.cutType,
          )
        : [jupeDevant, jupeDos]),
    ];
    if (drape.wrap) pieces = wrapFrontPiece(pieces, 'Corsage Devant', drape.wrap);
    if (drape.bodice) pieces = drapeBodicePiece(pieces, 'Corsage Devant', drape.bodice);
    if (drape.hem) pieces = asymmetricHemPieces(pieces, ['Jupe'], drape.hem);
    if (drape.cowl) pieces.push(computeCowlNeck(neckline.widthMm, drape.cowl.depthMm));
    if (drape.overskirt) pieces.push(buildOverskirtPiece(drape.overskirt, waistCircumference, jupeLongueur));
    if (drape.train) pieces.push(buildTrainPiece(drape.train, Math.max(500, Math.round(2 * hemDos))));

    // Robe-manteau : the fronts part from the neck to the hem over a plastron (opening widens towards the hem).
    const devant = parameters.details['devant']?.toUpperCase();
    const gilet = devant === 'GILET';
    /** Half width (mm) of the gilet at the bodice's lower edge, past the centre front (its basque starts there). */
    let giletBottomHalf = 0;
    if ((devant === 'MANTEAU_OUVERT' || devant === 'MANTEAU_REVERS' || gilet) && !pieces.some((p) => p.name.includes('croisé'))) {
      const bodiceFront = pieces.find((p) => p.name === 'Corsage Devant');
      // A gilet opens the bodice only: the skirt front stays whole (its own centre panel shows below the basque).
      const skirtFront = gilet ? undefined : pieces.find((p) => p.name === 'Jupe Devant');
      const neckDepth = bodiceFront?.outlineMm[0]?.y ?? 0;
      const skirtTop = hauteurCorsageDevant;
      const bodiceBottom = bodiceFront ? Math.max(...bodiceFront.outlineMm.map((p) => p.y)) : skirtTop;
      const hemY = skirtTop + (skirtFront ? Math.max(...skirtFront.outlineMm.map((p) => p.y)) : 0);
      const giletBustY = neckDepth + (skirtTop - neckDepth) * GILET_BUST_SHARE;
      const lerpOpen = (y: number, y0: number, y1: number, a: number, b: number): number => a + ((b - a) * Math.max(0, y - y0)) / Math.max(1, y1 - y0);
      const halfOpeningAt = (globalY: number): number =>
        gilet
          ? globalY <= skirtTop
            ? globalY <= giletBustY
              ? lerpOpen(globalY, neckDepth, giletBustY, GILET_OPEN_NECK_MM, GILET_OPEN_BUST_MM)
              : lerpOpen(globalY, giletBustY, skirtTop, GILET_OPEN_BUST_MM, GILET_OPEN_WAIST_MM)
            : lerpOpen(globalY, skirtTop, bodiceBottom, GILET_OPEN_WAIST_MM, GILET_OPEN_BOTTOM_MM)
          : globalY <= skirtTop
            ? lerpOpen(globalY, neckDepth, skirtTop, COAT_OPEN_NECK_MM, COAT_OPEN_WAIST_MM)
            : lerpOpen(globalY, skirtTop, hemY, COAT_OPEN_WAIST_MM, COAT_OPEN_HEM_MM);
      if (bodiceFront) {
        bodiceFront.outlineMm = openCentreFront(bodiceFront.outlineMm, (y) => (y >= neckDepth ? halfOpeningAt(y) : 0));
        bodiceFront.name = gilet ? 'Corsage Devant (ouvert sur gilet)' : 'Corsage Devant (manteau ouvert)';
        bodiceFront.quantity = 2;
      }
      if (skirtFront) {
        skirtFront.outlineMm = openCentreFront(skirtFront.outlineMm, (y) => halfOpeningAt(skirtTop + y));
        skirtFront.name = 'Jupe Devant (manteau ouvert)';
        skirtFront.quantity = 2;
      }
      if (gilet) giletBottomHalf = Math.round(halfOpeningAt(bodiceBottom) + GILET_UNDERLAP_MM);
      pieces.push(
        gilet
          ? giletPiece(plastronPiece(neckDepth, bodiceBottom, halfOpeningAt, GILET_UNDERLAP_MM), parameters.details)
          : plastronPiece(neckDepth, Math.max(hemY, skirtTop), halfOpeningAt),
      );

      // Facings: the open fronts are faced down their whole edge (neck → waist → hem), the back along its neckline.
      const onOpening = (offset: number) => (p: { x: number; y: number }) =>
        p.y + offset >= neckDepth && p.x <= Math.round(halfOpeningAt(p.y + offset)) + 1;
      if (bodiceFront) {
        const ring = ringOf(bodiceFront.outlineMm);
        const from = runStart(ring, onOpening(0));
        const facing = from >= 0 ? facingPiece('Parementure Devant', bodiceFront.outlineMm, from, neckPointIndex(ring), FACING_MM, 2, FACING_MM) : null;
        if (facing) pieces.push(facing);
        // Revers: the opening's edge turned back over the front, from the waist up to the neck, widest over the bust.
        const revers =
          (devant === 'MANTEAU_REVERS' || gilet) && from >= 0
            ? facingPiece('Revers', bodiceFront.outlineMm, from, 0, (t) => REVERS_WAIST_MM + (REVERS_MAX_MM - REVERS_WAIST_MM) * Math.sin(Math.PI * Math.min(1, t / (2 * REVERS_PEAK))), 2)
            : null;
        if (revers) pieces.push({ ...revers, fabricRecommendation: 'Même tissu, entoilé (endroit visible)' });
      }
      if (skirtFront) {
        const ring = ringOf(skirtFront.outlineMm);
        const on = onOpening(skirtTop);
        const from = runStart(ring, on);
        let to = from;
        while (from >= 0 && on(ring[(to + 1) % ring.length]!) && (to + 1) % ring.length !== from) to = (to + 1) % ring.length;
        const facing = from >= 0 ? facingPiece('Parementure Jupe Devant', skirtFront.outlineMm, from, to, FACING_MM, 2) : null;
        if (facing) pieces.push(facing);
      }
      const back = pieces.find((p) => p.name === 'Corsage Dos');
      if (back) {
        const facing = facingPiece('Parementure Dos', back.outlineMm, 0, neckPointIndex(ringOf(back.outlineMm)), FACING_MM, back.quantity, FACING_MM);
        if (facing) pieces.push(facing);
      }
    }
    // Découpes princesse : the bodice front and back are each cut into a centre panel and a side panel along a seam
    // from the armhole over the bust to the waist (no dart; the fit is in the seams).
    if (corsage === 'PRINCESSE') {
      for (const [prefix, sideName, waistY] of [
        ['Corsage Devant', 'Corsage Côté Devant', hauteurCorsageDevant],
        ['Corsage Dos', 'Corsage Côté Dos', hauteurCorsageDos],
      ] as const) {
        const panel = pieces.find((p) => p.name === prefix || p.name.startsWith(`${prefix} (`));
        const split = panel ? princessSplit(panel.outlineMm, torsoHeights(panel.outlineMm, waistY)) : null;
        if (!panel || !split) continue;
        panel.outlineMm = split.centre;
        const xs = split.side.map((p) => p.x);
        const ys = split.side.map((p) => p.y);
        pieces.splice(pieces.indexOf(panel) + 1, 0, {
          name: sideName,
          fabricRecommendation: panel.fabricRecommendation,
          seamAllowanceMm: panel.seamAllowanceMm,
          quantity: 2,
          notches: [],
          grainline: { angleDegrees: 90, originX: Math.round((Math.min(...xs) + Math.max(...xs)) / 2), originY: Math.round((Math.min(...ys) + Math.max(...ys)) / 2) },
          outlineMm: split.side,
        });
      }
    }
    // Jupe en lés : each skirt half is cut into a centre panel and a side gore (a 6-gore skirt).
    if (parameters.details['jupe']?.toUpperCase() === 'EN_LES') {
      for (const name of ['Jupe Devant', 'Jupe Dos']) {
        const skirt = pieces.find((p) => p.name === name || p.name.startsWith(`${name} (`));
        const split = skirt ? goreSplit(skirt.outlineMm) : null;
        if (!skirt || !split) continue;
        skirt.outlineMm = split.centre;
        pieces.splice(pieces.indexOf(skirt) + 1, 0, {
          ...skirt,
          name: name === 'Jupe Devant' ? 'Jupe Côté Devant' : 'Jupe Côté Dos',
          quantity: 2,
          notches: [],
          grainline: { ...skirt.grainline, originX: Math.round((Math.min(...split.side.map((p) => p.x)) + Math.max(...split.side.map((p) => p.x))) / 2) },
          outlineMm: split.side,
        });
      }
    }
    // Basque of a gilet: its points and the crossed tabs lie on the skirt front, below the bodice.
    if (gilet) {
      const front = pieces.find((p) => p.name === 'Jupe Devant');
      const { lines, pieces: extra } = basqueAreas(parameters.details, giletBottomHalf);
      if (front && lines.length) front.internalLinesMm = [...(front.internalLinesMm ?? []), ...lines];
      pieces.push(...extra);
    }
    // A long princess or gored dress: an inner waist stay (gros-grain) carries the skirt's weight.
    const longueur = parameters.details['longueur']?.toUpperCase();
    const longDress = longueur === 'SOL' || longueur === 'MAXI';
    // A boned bodice already lists its waist tape among the notions (see shared/trims.ts).
    const gored = parameters.details['jupe']?.toUpperCase() === 'EN_LES';
    if (longDress && (corsage === 'PRINCESSE' || gored)) {
      pieces.push({
        name: 'Ceinture intérieure (gros-grain)',
        fabricRecommendation: 'Gros-grain 30 mm, agrafé',
        quantity: 1,
        seamAllowanceMm: 0,
        grainline: { angleDegrees: 0, originX: Math.round(tt / 2), originY: WAIST_STAY_MM / 2 },
        notches: [],
        outlineMm: rect(Math.round(tt + WAIST_STAY_OVERLAP_MM), WAIST_STAY_MM),
      });
    }
    // A floor-length gored skirt is faced at the hem (a balayeuse protects it where it brushes the floor).
    if (longueur === 'SOL' && gored) {
      for (const skirt of pieces.filter((p) => /^Jupe /.test(p.name))) {
        const facing = hemFacing(skirt);
        if (facing) pieces.push(facing);
      }
    }
    const fermeture = parameters.details['fermeture']?.toUpperCase();
    // A skirt closed in front (under a gilet buttoned down the bodice) opens at the centre back, on a faced placket.
    if (gilet && (fermeture === 'BOUTONS' || fermeture === 'BOUTONS_TAILLE')) {
      pieces.push({
        name: 'Parementure de jupe (fente dos)',
        fabricRecommendation: 'Même tissu',
        quantity: 2,
        seamAllowanceMm: 10,
        grainline: { angleDegrees: 90, originX: SKIRT_PLACKET.widthMm / 2, originY: SKIRT_PLACKET.lengthMm / 2 },
        notches: [],
        outlineMm: rect(SKIRT_PLACKET.widthMm, SKIRT_PLACKET.lengthMm),
      });
    }
    // Boutonnage devant: the buttons down the centre front of the bodice (on the gilet when it opens over one), to its
    // lower edge, or to the natural waist (`BOUTONS_TAILLE`).
    if (fermeture === 'BOUTONS' || fermeture === 'BOUTONS_TAILLE') {
      const front = pieces.find((p) => p.name.startsWith('Corsage Devant'));
      if (front) {
        const neckY = front.outlineMm[0]?.y ?? 0;
        const bottom = Math.max(...front.outlineMm.map((p) => p.y));
        const last = (fermeture === 'BOUTONS_TAILLE' ? Math.min(bottom, hauteurCorsageDevant) : bottom) - BUTTON_SPACING_MM / 2;
        const points: Array<{ x: number; y: number }> = [];
        for (let y = neckY + BUTTON_FROM_NECK_MM; y <= last; y += BUTTON_SPACING_MM) points.push({ x: 0, y: Math.round(y) });
        if (points.length >= 2) front.internalLinesMm = [...(front.internalLinesMm ?? []), { kind: 'PLACEMENT', points, buttons: { diameterMm: BUTTON_DIAMETER_MM } }];
      }
    }
    // Dos transparent : le tulle remplit l'encolure dos de base jusqu'au bord du tissu, abaissé en U.
    if (backStyle === 'TRANSPARENT' && !offShoulder) pieces.push(sheerBackPiece(BACK_NECK_DEPTH_MM, SHEER_BACK.depthMm, SHEER_BACK.neckMm));
    if (fermeture === 'CORDELIERE') pieces.push(cordPiece());
    if (fermeture === 'CEINTURE_NOUEE') pieces.push(...beltPieces(waistCircumference));

    const armMm = measurements['LONGUEUR_BRAS'] !== undefined ? measurements['LONGUEUR_BRAS'] * 10 : undefined;
    const sleeve = fitSleeve(resolveSleeve(parameters.details['manches'], armMm), parameters, armMm);
    if (sleeve) {
      // A gigot or bishop sleeve down to the wrist ends in a cuff: the sleeve is shorter by the cuff's height.
      const manches = parameters.details['manches']?.toUpperCase();
      const tailored = manches === 'TAILLEUR';
      const cuffed =
        tailored ||
        ((manches === 'BALLON' || manches === 'EVEQUE') && sleeve.lengthMm >= CUFF_FROM_ARM_SHARE * (armMm ?? DEFAULT_ARM_LENGTH_MM));
      const piece = sleevePiece('Manche', tp, cuffed ? { ...sleeve, lengthMm: sleeve.lengthMm - CUFF_HEIGHT_MM } : sleeve, null, 10, measurements);
      // A long gigot is drafted on a two-piece sleeve: the puffed upper sleeve, the fitted under sleeve. So is a
      // tailored sleeve (« manche tailleur »).
      const split = cuffed && (manches === 'BALLON' || tailored) ? twoPieceSleeve(piece.outlineMm, (tp / 3.2) * UNDER_SLEEVE_HALF) : null;
      if (split) {
        pieces.push(
          { ...piece, name: 'Manche extérieure', outlineMm: split.upper },
          {
            ...piece,
            name: 'Manche intérieure',
            notches: [],
            grainline: { angleDegrees: 90, originX: 0, originY: Math.round((split.under[0]!.y + Math.max(...split.under.map((p) => p.y))) / 2) },
            outlineMm: split.under,
          },
        );
      } else pieces.push(piece);
      if (tailored) {
        // A tailored sleeve's cuff is cut single and faced (the cuff shows, its facing is inside).
        const cuff = cuffPiece(piece);
        const single = cuff.outlineMm.map((p) => ({ x: p.x, y: Math.min(p.y, CUFF_HEIGHT_MM) }));
        const band = { ...cuff, outlineMm: single, grainline: { ...cuff.grainline, originY: Math.round(CUFF_HEIGHT_MM / 2) } };
        pieces.push(band, { ...band, name: 'Parementure de poignet', fabricRecommendation: 'Même tissu ou doublure', notches: [] });
      } else if (cuffed) pieces.push(cuffPiece(piece));
    }
    // A collar needs a neckline to stand on: an off-the-shoulder edge has none.
    const collar = offShoulder ? null : collarPiece(parameters.details['col'], measurements);
    if (collar) pieces.push(collar);
    return offShoulder ? markOffShoulder(pieces, armDrop) : pieces;
  },
};
