import type {
  IPatternRule,
  MeasurementSet,
  PatternParameters,
  PatternPieceGeometry,
} from '../types';
import { resolveCutProfile, resolveSkirtLengthMm } from '../shared/cut-profile';
import { resolveLengthMm, skirtFullnessExtraMm, withEase } from '../shared/fit';
import {
  asymmetricHemPieces,
  buildOverskirtPiece,
  buildSkirtBlock,
  buildTrainPiece,
  resolveDrape,
  wrapFrontPiece,
} from '../blocks';

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
    const tourBassin = measurements['TOUR_BASSIN'] ?? 95;
    const longueur = measurements['LONGUEUR_DOS'] || 60; // default 60cm

    // Valeurs de base en mm
    const tt = tourTaille * 10;
    const tb = tourBassin * 10;
    const baseLength =
      measurements['LONGUEUR_JUPE'] !== undefined
        ? measurements['LONGUEUR_JUPE'] * 10
        : (resolveSkirtLengthMm(parameters.details['longueur']) ?? longueur * 10);
    const lg = resolveLengthMm(baseLength, parameters.lengths?.skirtPct, [300, 1500]);
    const profile = withEase(resolveCutProfile(parameters.cutType), parameters.ease);

    // Calculs simplifiés (base jupe droite)
    // Devant: quart du tour de bassin + 1cm d'aisance
    const largeurDevant = tb / 4 + 10 + profile.hipDeltaMm;
    const largeurTailleDevant = tt / 4 + 10 + 20 + profile.waistDeltaMm; // + pince de 2cm
    const hemDevant = largeurDevant + profile.hemFlareMm + skirtFullnessExtraMm(parameters.fullness, largeurDevant);

    // Dos: quart du tour de bassin - 1cm d'aisance
    const largeurDos = tb / 4 - 10 + profile.hipDeltaMm;
    const largeurTailleDos = tt / 4 - 10 + 30 + profile.waistDeltaMm; // + pince de 3cm
    const hemDos = largeurDos + profile.hemFlareMm + skirtFullnessExtraMm(parameters.fullness, largeurDos);

    // HAUTEUR_BASSIN (taille → point le plus fort du bassin) si mesurée, sinon 20 cm.
    const hipDepth =
      measurements['HAUTEUR_BASSIN'] !== undefined
        ? Math.min(measurements['HAUTEUR_BASSIN'] * 10, lg - 50)
        : Math.min(200, lg / 2);

    const devant: PatternPieceGeometry = {
      name: 'Devant',
      fabricRecommendation: null,
      quantity: 1, // Coupé au pli
      seamAllowanceMm: 10,
      grainline: { angleDegrees: 90, originX: largeurDevant / 2, originY: lg / 2 },
      notches: [],
      outlineMm: [
        { x: 0, y: 0 }, // Milieu devant taille
        { x: largeurTailleDevant, y: 10 }, // Côté taille (légèrement remonté)
        { x: largeurDevant, y: hipDepth }, // Ligne de bassin (20cm sous la taille)
        ...(profile.fishtail ? [{ x: largeurDevant * 0.9, y: lg * 0.55 }] : []), // Genou (sirène)
        { x: hemDevant, y: lg }, // Ourlet côté
        { x: 0, y: lg }, // Milieu devant ourlet
        { x: 0, y: 0 }, // Retour origine
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
        { x: 0, y: 0 }, // Milieu dos taille
        { x: largeurTailleDos, y: 10 }, // Côté taille
        { x: largeurDos, y: hipDepth }, // Ligne de bassin
        ...(profile.fishtail ? [{ x: largeurDos * 0.9, y: lg * 0.55 }] : []), // Genou (sirène)
        { x: hemDos, y: lg }, // Ourlet côté
        { x: 0, y: lg }, // Milieu dos ourlet
        { x: 0, y: 0 },
      ],
    };

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
    return pieces;
  },
};
