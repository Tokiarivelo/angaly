import type {
  IPatternRule,
  MeasurementSet,
  Notion,
  PatternParameters,
  PatternPieceGeometry,
} from '../types';
import { resolveLegProfile, resolveTrouserLengthFactor, trouserKneeMm } from '../shared/cut-profile';
import {
  bottomMarks,
  bottomNotions,
  detailPlacementLines,
  closurePieces,
  hemPieces,
  pleatIntakeMm,
  pocketPieces,
  resolveBottoms,
  RISE_OFFSET_MM,
  topGirthMm,
  waistbandPieces,
  type BottomsSpec,
} from '../shared/bottoms';
import { hipGirthCm, trouserGirths } from '../shared/fit';

const REQUIRED_MEASUREMENTS = ['TOUR_TAILLE', 'TOUR_BASSIN'];

/** Hip line below the natural waist when HAUTEUR_BASSIN is not measured (mm). */
const DEFAULT_HIP_DEPTH_MM = 180;
/** Ease added to a measured crotch length (LONGUEUR_ENFOURCHURE), front + back seams together (mm). */
const CROTCH_LENGTH_EASE_MM = 30;
/** The fork extensions may be scaled this far to match a measured crotch length. */
const CROTCH_SCALE_BOUNDS = [0.6, 2.4] as const;
/** Back rise above the waist at the centre back (mm): the seat needs it when sitting. */
const BACK_RISE_MM = 35;
/** Share of a crotch-length difference taken by the back rise, and its bounds (mm). */
const BACK_RISE_SHARE = 0.4;
const BACK_RISE_MIN_MM = 15;
const BACK_RISE_MAX_MM = 80;

type Pt = { x: number; y: number };

const polylineLength = (pts: Pt[]): number =>
  pts.slice(1).reduce((sum, p, i) => sum + Math.hypot(p.x - pts[i]!.x, p.y - pts[i]!.y), 0);

/** Crotch seams (front + back) from the centre waist down to the inside leg, for given fork extensions. */
function crotchSeamMm(montant: number, avDevant: number, avDos: number, backRise: number): number {
  const front = [
    { x: avDevant, y: 0 },
    { x: avDevant * 0.7, y: montant * 0.6 },
    { x: 0, y: montant },
  ];
  const back = [
    { x: avDos + 20, y: -backRise },
    { x: avDos * 0.6, y: (montant + 15) * 0.7 },
    { x: 0, y: montant + 15 },
  ];
  return polylineLength(front) + polylineLength(back);
}

/**
 * Fork extensions scale and back rise that give the measured crotch length, as a tailor shares it: part of the
 * difference goes to the back rise (the seat), the rest to the forks (bisection, bounded).
 */
function fitCrotch(montant: number, avDevant: number, avDos: number, measuredMm: number | undefined): { scale: number; backRise: number } {
  if (measuredMm === undefined) return { scale: 1, backRise: BACK_RISE_MM };
  const target = measuredMm + CROTCH_LENGTH_EASE_MM;
  const delta = target - crotchSeamMm(montant, avDevant, avDos, BACK_RISE_MM);
  const backRise = Math.round(Math.min(BACK_RISE_MAX_MM, Math.max(BACK_RISE_MIN_MM, BACK_RISE_MM + delta * BACK_RISE_SHARE)));
  const length = (k: number) => crotchSeamMm(montant, avDevant * k, avDos * k, backRise);
  let [lo, hi] = CROTCH_SCALE_BOUNDS as readonly number[] as [number, number];
  if (length(lo) >= target) return { scale: lo, backRise };
  if (length(hi) <= target) return { scale: hi, backRise };
  for (let i = 0; i < 30; i += 1) {
    const mid = (lo + hi) / 2;
    if (length(mid) < target) lo = mid;
    else hi = mid;
  }
  return { scale: Math.round(((lo + hi) / 2) * 1000) / 1000, backRise };
}

interface TrouserDraft {
  spec: BottomsSpec;
  pieces: PatternPieceGeometry[];
  topGirth: number;
  montant: number;
}

/**
 * Trouser pieces (front, back, then waistband, fly, pockets, turn-up), mm. The natural waist is y = 0 on the legs; a
 * high rise puts the top edge above it (y < 0), a low rise below it. Shared with the suit's trousers (`nameSuffix`).
 */
export function draftTrousers(parameters: PatternParameters, measurements: MeasurementSet, nameSuffix = ''): TrouserDraft {
  const tourTaille = measurements['TOUR_TAILLE'] ?? 70;
  const tourBassin = hipGirthCm(measurements);
  const longueurJambeMesuree = measurements['LONGUEUR_JAMBE'] ?? measurements['LONGUEUR_PANTALON'];
  const tt = tourTaille * 10;
  const tb = tourBassin * 10;

  // Montant (taille → assise) : HAUTEUR_FOURCHE si mesurée, sinon proportion du bassin (~265 mm).
  const hauteurMontant =
    measurements['HAUTEUR_FOURCHE'] !== undefined ? Math.round(measurements['HAUTEUR_FOURCHE'] * 10) : Math.round(tb / 4 + 20);
  // Longueur de jambe entière : LONGUEUR_JAMBE (extérieure) sinon fourche + HAUTEUR_ENTREJAMBE, sinon 100 cm.
  const longueurMm =
    longueurJambeMesuree !== undefined
      ? longueurJambeMesuree * 10
      : measurements['HAUTEUR_ENTREJAMBE'] !== undefined
        ? hauteurMontant + measurements['HAUTEUR_ENTREJAMBE'] * 10
        : 1000;
  // Longueur coupée : lengths.legPct (lu sur une photo) l'emporte sur le choix de longueur.
  const legPct = parameters.lengths?.legPct;
  const lengthFactor = legPct !== undefined ? legPct / 100 : resolveTrouserLengthFactor(parameters.details['longueur']);
  const lg = Math.round(longueurMm * lengthFactor);
  // Ligne du genou : mesurée, sinon au genou de la jambe entière (voir trouserKneeMm).
  const hauteurGenou = trouserKneeMm(
    hauteurMontant,
    longueurMm,
    lg,
    measurements['HAUTEUR_TAILLE_GENOU'] !== undefined ? measurements['HAUTEUR_TAILLE_GENOU'] * 10 : undefined,
  );
  // Ligne de bassin : HAUTEUR_BASSIN si mesurée (bornée au-dessus de la fourche), sinon 18 cm.
  const hipDepth =
    measurements['HAUTEUR_BASSIN'] !== undefined
      ? Math.round(Math.min(hauteurMontant - 40, Math.max(120, measurements['HAUTEUR_BASSIN'] * 10)))
      : DEFAULT_HIP_DEPTH_MM;

  const spec = resolveBottoms('PANTALON', parameters.details);
  const rise = RISE_OFFSET_MM[spec.rise];
  const top = -rise; // y of the top edge (natural waist at 0)
  const topGirth = topGirthMm(spec.rise, tt, tb, hipDepth);
  const pleats = pleatIntakeMm(spec);

  // Forme de jambe selon la coupe choisie (voir shared/cut-profile.ts), largeur d'ourlet réglable (fullness.leg).
  const leg = resolveLegProfile(parameters.cutType, parameters.ease);
  const girths = trouserGirths(tb, leg.hipDeltaMm, measurements);
  const legFullness = parameters.fullness?.leg ?? 1;
  const demiLargeurBasDevant = Math.max(Math.round(leg.halfHemMm * legFullness), girths.minHalfHemMm);
  // The knee keeps the cut's own width: a wider hem flares more, it does not widen the knee.
  const kneeFront = Math.max(Math.round(leg.halfHemMm * leg.kneeRatio), girths.minKneeMm);

  // Avancées de fourche, recalées sur LONGUEUR_ENFOURCHURE quand elle est mesurée.
  const baseAvDevant = Math.round((tb / 4) * 0.18);
  const baseAvDos = Math.round((tb / 4) * 0.38);
  const measuredCrotch = measurements['LONGUEUR_ENFOURCHURE'] !== undefined ? measurements['LONGUEUR_ENFOURCHURE'] * 10 : undefined;
  const crotch = fitCrotch(hauteurMontant, baseAvDevant, baseAvDos, measuredCrotch);
  const avanceeFourcheDevant = Math.round(baseAvDevant * crotch.scale);
  const avanceeFourcheDos = Math.round(baseAvDos * crotch.scale);

  // Devant (les plis ajoutent leur profondeur à la taille, la moitié au bassin).
  const largeurBassinDevant = Math.round(tb / 4 - 10 + leg.hipDeltaMm + girths.thighExtraMm + pleats.hip);
  const largeurTailleDevant = Math.round(topGirth / 4 + 20 + leg.waistDeltaMm + pleats.waist);
  const lignePliDevant = Math.round((largeurBassinDevant + avanceeFourcheDevant) / 2);
  const pieceDevant: PatternPieceGeometry = {
    name: `Devant Pantalon${nameSuffix}`,
    fabricRecommendation: 'Laine froide, Gabardine, Crêpe ou Coton sergé',
    quantity: 2,
    seamAllowanceMm: 10,
    grainline: { angleDegrees: 90, originX: lignePliDevant, originY: lg / 2 },
    notches: [
      { positionAlongEdge: 0.5, edgeIndex: 2 },
      { positionAlongEdge: 0.8, edgeIndex: 1 },
    ],
    outlineMm: [
      { x: avanceeFourcheDevant, y: top },
      { x: avanceeFourcheDevant + largeurTailleDevant, y: top + 10 },
      { x: avanceeFourcheDevant + largeurBassinDevant, y: hipDepth },
      { x: lignePliDevant + kneeFront, y: hauteurGenou },
      { x: lignePliDevant + demiLargeurBasDevant, y: lg },
      { x: lignePliDevant - demiLargeurBasDevant, y: lg },
      { x: lignePliDevant - kneeFront, y: hauteurGenou },
      { x: 0, y: hauteurMontant },
      { x: Math.round(avanceeFourcheDevant * 0.7), y: Math.round(hauteurMontant * 0.6) },
      { x: avanceeFourcheDevant, y: top },
    ],
  };
  const frontMarks = [
    ...bottomMarks(spec, 'front', { centreX: avanceeFourcheDevant, sideX: avanceeFourcheDevant + largeurTailleDevant, topY: top }),
    // Fly, pockets, turn-up: where they show on the outside (drawn on the pattern and on the 3D cloth).
    ...detailPlacementLines(spec, 'front', {
      centreX: avanceeFourcheDevant,
      sideX: avanceeFourcheDevant + largeurTailleDevant,
      topY: top,
      hipSideX: avanceeFourcheDevant + largeurBassinDevant,
      hipY: hipDepth,
      hemY: lg,
      creaseX: lignePliDevant,
      halfHemMm: demiLargeurBasDevant,
      flyEndY: Math.round(hauteurMontant * 0.6),
    }),
  ];
  if (frontMarks.length > 0) pieceDevant.internalLinesMm = frontMarks;

  // Dos
  const largeurBassinDos = Math.round(tb / 4 + 10 + leg.hipDeltaMm + girths.thighExtraMm);
  const largeurTailleDos = Math.round(topGirth / 4 + 30 + leg.waistDeltaMm);
  const demiLargeurBasDos = demiLargeurBasDevant + 15;
  const kneeDos = Math.max(Math.round((leg.halfHemMm + 15) * leg.kneeRatio), girths.minKneeMm);
  const lignePliDos = Math.round((largeurBassinDos + avanceeFourcheDos) / 2);
  const pieceDos: PatternPieceGeometry = {
    name: `Dos Pantalon${nameSuffix}`,
    fabricRecommendation: 'Laine froide, Gabardine, Crêpe ou Coton sergé',
    quantity: 2,
    seamAllowanceMm: 10,
    grainline: { angleDegrees: 90, originX: lignePliDos, originY: lg / 2 },
    notches: [
      { positionAlongEdge: 0.5, edgeIndex: 2 },
      { positionAlongEdge: 0.8, edgeIndex: 1 },
    ],
    outlineMm: [
      { x: avanceeFourcheDos + 20, y: top - crotch.backRise },
      { x: avanceeFourcheDos + 20 + largeurTailleDos, y: top + 10 },
      { x: avanceeFourcheDos + largeurBassinDos, y: hipDepth },
      { x: lignePliDos + kneeDos, y: hauteurGenou },
      { x: lignePliDos + demiLargeurBasDos, y: lg },
      { x: lignePliDos - demiLargeurBasDos, y: lg },
      { x: lignePliDos - kneeDos, y: hauteurGenou },
      { x: 0, y: hauteurMontant + 15 },
      { x: Math.round(avanceeFourcheDos * 0.6), y: Math.round((hauteurMontant + 15) * 0.7) },
      { x: avanceeFourcheDos + 20, y: top - crotch.backRise },
    ],
  };
  const backMarks = [
    ...bottomMarks(spec, 'back', { centreX: avanceeFourcheDos + 20, sideX: avanceeFourcheDos + 20 + largeurTailleDos, topY: top }),
    ...detailPlacementLines(spec, 'back', {
      centreX: avanceeFourcheDos + 20,
      sideX: avanceeFourcheDos + 20 + largeurTailleDos,
      topY: top,
      hipSideX: avanceeFourcheDos + largeurBassinDos,
      hipY: hipDepth,
      hemY: lg,
      creaseX: lignePliDos,
      halfHemMm: demiLargeurBasDos,
    }),
  ];
  if (backMarks.length > 0) pieceDos.internalLinesMm = backMarks;

  const hemGirth = 4 * demiLargeurBasDevant + 30;
  const extras = [
    ...waistbandPieces(spec, topGirth, tb),
    ...closurePieces(spec, hauteurMontant + rise),
    ...pocketPieces(spec),
    ...hemPieces(spec, hemGirth),
  ].map((p) => (nameSuffix && !p.name.endsWith(nameSuffix) ? { ...p, name: `${p.name}${nameSuffix}` } : p));
  return { spec, pieces: [pieceDevant, pieceDos, ...extras], topGirth, montant: hauteurMontant + rise };
}

export const PantalonRule: IPatternRule = {
  garmentType: 'PANTALON',
  requiredMeasurementKeys: REQUIRED_MEASUREMENTS,
  appliesTo(parameters: PatternParameters): boolean {
    return parameters.garmentType === 'PANTALON';
  },
  computePieces(parameters: PatternParameters, measurements: MeasurementSet): PatternPieceGeometry[] {
    return draftTrousers(parameters, measurements).pieces;
  },
  notions(parameters: PatternParameters, measurements: MeasurementSet): Notion[] {
    const draft = draftTrousers(parameters, measurements);
    return bottomNotions('PANTALON', draft.spec, draft.topGirth, draft.montant);
  },
};
