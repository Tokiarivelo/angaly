import type {
  IPatternRule,
  MeasurementSet,
  Notion,
  PatternParameters,
  PatternPieceGeometry,
} from '../types';
import { resolveCutProfile, resolveSkirtLengthMm } from '../shared/cut-profile';
import { hipGirthCm, resolveLengthMm, withEase } from '../shared/fit';
import {
  bottomMarks,
  bottomNotions,
  detailPlacementLines,
  pocketPieces,
  resolveBottoms,
  RISE_OFFSET_MM,
  topGirthMm,
  waistbandPieces,
  withBackVent,
} from '../shared/bottoms';
import {
  asymmetricHemPieces,
  buildOverskirtPiece,
  buildSkirtBlock,
  buildTrainPiece,
  resolveDrape,
  wrapFrontPiece,
} from '../blocks';

/** The cut's hem flare is drawn for this drop below the hip line (mm, a mid-calf skirt), scaled within these bounds. */
const FLARE_REFERENCE_DROP_MM = 600;
const FLARE_SCALE_MIN = 0.3;
const FLARE_SCALE_MAX = 1.4;

// Pour une jupe de base, il nous faut au minimum :
const REQUIRED_MEASUREMENTS = ['TOUR_TAILLE', 'TOUR_BASSIN', 'LONGUEUR_DOS'];

export const JupeRule: IPatternRule = {
  garmentType: 'JUPE',
  requiredMeasurementKeys: REQUIRED_MEASUREMENTS,
  appliesTo(parameters: PatternParameters): boolean {
    return parameters.garmentType === 'JUPE';
  },
  warnings(parameters: PatternParameters): string[] {
    const drape = resolveDrape(parameters);
    const notes: string[] = [];
    if (drape.skirt && drape.wrap) {
      notes.push('Jupe portefeuille ignorée : un bloc de jupe (froncée, plissée ou cercle) a déjà remplacé le devant.');
    }
    if (drape.hem && drape.skirt?.kind === 'CIRCLE_SKIRT') {
      notes.push("Ourlet asymétrique ignoré : le bord d'une jupe cercle est un arc, il ne se décale pas.");
    }
    return notes;
  },
  computePieces(
    parameters: PatternParameters,
    measurements: MeasurementSet,
  ): PatternPieceGeometry[] {
    const tourTaille = measurements['TOUR_TAILLE'] ?? 70;
    const tourBassin = hipGirthCm(measurements);
    const longueur = measurements['LONGUEUR_DOS'] || 60; // default 60cm

    // Valeurs de base en mm
    const tt = tourTaille * 10;
    const tb = tourBassin * 10;
    const baseLength =
      measurements['LONGUEUR_JUPE'] !== undefined
        ? measurements['LONGUEUR_JUPE'] * 10
        : (resolveSkirtLengthMm(parameters.details['longueur'], measurements['STATURE']) ?? longueur * 10);
    const lg = resolveLengthMm(baseLength, parameters.lengths?.skirtPct, [300, 1500]);
    const profile = withEase(resolveCutProfile(parameters.cutType), parameters.ease);
    // Construction : hauteur de taille, ceinture, fermeture, fente, poches (voir shared/bottoms.ts).
    const spec = resolveBottoms('JUPE', parameters.details, { cutType: parameters.cutType, lengthMm: lg });
    const top = -RISE_OFFSET_MM[spec.rise]; // y of the top edge (natural waist at 0)

    // Calculs simplifiés (base jupe droite)
    // Devant: quart du tour de bassin + 1cm d'aisance
    const largeurDevant = tb / 4 + 10 + profile.hipDeltaMm;
    // HAUTEUR_BASSIN (taille → point le plus fort du bassin) si mesurée, sinon 20 cm.
    const hipDepth =
      measurements['HAUTEUR_BASSIN'] !== undefined
        ? Math.min(measurements['HAUTEUR_BASSIN'] * 10, lg - 50)
        : Math.min(200, lg / 2);
    const topGirth = topGirthMm(spec.rise, tt, tb, hipDepth);
    const largeurTailleDevant = topGirth / 4 + 10 + 20 + profile.waistDeltaMm; // + pince de 2cm
    // Ourlet : `fullness.skirt` lu sur la photo = ourlet ÷ taille, il fixe l'ourlet ; sinon l'évasement de la coupe, à
    // l'échelle de la hauteur sous le bassin (une jupe au genou s'évase moins qu'une jupe longue de la même coupe).
    const hemOf = (hip: number, waist: number): number => {
      const f = parameters.fullness?.skirt;
      if (f !== undefined && f > 1) return Math.round(Math.max(hip, waist * f));
      const drop = Math.max(0, lg - hipDepth);
      return Math.round(hip + profile.hemFlareMm * Math.min(FLARE_SCALE_MAX, Math.max(FLARE_SCALE_MIN, drop / FLARE_REFERENCE_DROP_MM)));
    };
    const hemDevant = hemOf(largeurDevant, largeurTailleDevant);

    // Dos: quart du tour de bassin - 1cm d'aisance
    const largeurDos = tb / 4 - 10 + profile.hipDeltaMm;
    const largeurTailleDos = topGirth / 4 - 10 + 30 + profile.waistDeltaMm; // + pince de 3cm
    const hemDos = hemOf(largeurDos, largeurTailleDos);

    const devant: PatternPieceGeometry = {
      name: 'Devant',
      fabricRecommendation: null,
      quantity: 1, // Coupé au pli
      seamAllowanceMm: 10,
      grainline: { angleDegrees: 90, originX: largeurDevant / 2, originY: lg / 2 },
      notches: [],
      outlineMm: [
        { x: 0, y: top }, // Milieu devant taille
        { x: largeurTailleDevant, y: top + 10 }, // Côté taille (légèrement remonté)
        { x: largeurDevant, y: hipDepth }, // Ligne de bassin (20cm sous la taille)
        ...(profile.fishtail ? [{ x: largeurDevant * 0.9, y: lg * 0.55 }] : []), // Genou (sirène)
        { x: hemDevant, y: lg }, // Ourlet côté
        { x: 0, y: lg }, // Milieu devant ourlet
        { x: 0, y: top }, // Retour origine
      ],
    };

    const dos: PatternPieceGeometry = {
      name: 'Dos',
      fabricRecommendation: null,
      quantity: 2, // Deux pièces avec couture milieu dos
      seamAllowanceMm: 10,
      grainline: { angleDegrees: 90, originX: largeurDos / 2, originY: lg / 2 },
      notches: [],
      outlineMm: [
        { x: 0, y: top }, // Milieu dos taille
        { x: largeurTailleDos, y: top + 10 }, // Côté taille
        { x: largeurDos, y: hipDepth }, // Ligne de bassin
        ...(profile.fishtail ? [{ x: largeurDos * 0.9, y: lg * 0.55 }] : []), // Genou (sirène)
        { x: hemDos, y: lg }, // Ourlet côté
        { x: 0, y: lg }, // Milieu dos ourlet
        { x: 0, y: top },
      ],
    };
    // Fente dos (parementure de fente) sur la couture milieu dos.
    dos.outlineMm = withBackVent(dos.outlineMm, spec, lg);
    const frontMarks = [
      ...bottomMarks(spec, 'front', { centreX: 0, sideX: largeurTailleDevant, topY: top }),
      // Pockets: where they show on the outside (drawn on the pattern and on the 3D cloth).
      ...detailPlacementLines(spec, 'front', { centreX: 0, sideX: largeurTailleDevant, topY: top, hipSideX: largeurDevant, hipY: hipDepth, hemY: lg }),
    ];
    if (frontMarks.length > 0) devant.internalLinesMm = frontMarks;
    const backMarks = bottomMarks(spec, 'back', { centreX: 0, sideX: largeurTailleDos, topY: top });
    if (backMarks.length > 0) dos.internalLinesMm = backMarks;

    // Blocs de drapé (S4) : un bloc de jupe remplace Devant/Dos ; le portefeuille croise le devant.
    const drape = resolveDrape(parameters);
    const waistCircumference = tt + 40 + 4 * profile.waistDeltaMm;
    let pieces: PatternPieceGeometry[] = drape.skirt
      ? buildSkirtBlock(drape.skirt, waistCircumference, lg)
      : drape.wrap
        ? wrapFrontPiece([devant, dos], 'Devant', drape.wrap)
        : [devant, dos];
    if (drape.hem) pieces = asymmetricHemPieces(pieces, ['Devant', 'Dos', 'Jupe'], drape.hem);
    if (drape.overskirt) pieces.push(buildOverskirtPiece(drape.overskirt, waistCircumference, lg));
    if (drape.train) pieces.push(buildTrainPiece(drape.train, Math.max(500, Math.round(2 * hemDos))));
    // Ceinture (ou parementure de taille) et poches, sur toute jupe (blocs froncé / plissé / cercle compris).
    pieces.push(...waistbandPieces(spec, topGirth, tb));
    pieces.push(...pocketPieces(spec));
    return pieces;
  },
  notions(parameters: PatternParameters, measurements: MeasurementSet): Notion[] {
    const tt = (measurements['TOUR_TAILLE'] ?? 70) * 10;
    const tb = hipGirthCm(measurements) * 10;
    const spec = resolveBottoms('JUPE', parameters.details, { cutType: parameters.cutType, lengthMm: 600 });
    return bottomNotions('JUPE', spec, topGirthMm(spec.rise, tt, tb, 200), 0);
  },
};
