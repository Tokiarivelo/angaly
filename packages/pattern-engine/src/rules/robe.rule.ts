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
import { skirtOutline, sleevePiece } from '../shared/shapes';

const REQUIRED_MEASUREMENTS = ['TOUR_POITRINE', 'TOUR_TAILLE', 'TOUR_BASSIN', 'LONGUEUR_DOS'];

export const RobeRule: IPatternRule = {
  garmentType: 'ROBE',
  requiredMeasurementKeys: REQUIRED_MEASUREMENTS,
  appliesTo(parameters: PatternParameters): boolean {
    // ROBE_MARIEE has its own dedicated rule (robe-mariee.rule.ts) with structured-bodice
    // ease and a train — ROBE alone no longer falls back to accepting it.
    return parameters.garmentType === 'ROBE';
  },
  computePieces(
    parameters: PatternParameters,
    measurements: MeasurementSet,
  ): PatternPieceGeometry[] {
    const tourPoitrine = measurements['TOUR_POITRINE'] ?? 90;
    const tourTaille = measurements['TOUR_TAILLE'] ?? 70;
    const tourBassin = measurements['TOUR_BASSIN'] ?? 95;
    const longueurDos = measurements['LONGUEUR_DOS'] ?? 40;

    const profile = resolveCutProfile(parameters.cutType);
    const neckline = resolveNeckline(parameters.details);
    const tp = tourPoitrine * 10;
    const tt = tourTaille * 10;
    const tb = tourBassin * 10;
    const lgDos = longueurDos * 10;

    // Dimensions corsage
    const largeurCorsageDevant = tp / 4 + 20 + profile.bodiceDeltaMm; // 2cm aisance (DROITE)
    const largeurTailleDevant = tt / 4 + 20 + profile.waistDeltaMm;
    const hauteurCorsageDevant = lgDos + 40;

    const largeurCorsageDos = tp / 4 - 10 + profile.bodiceDeltaMm;
    const largeurTailleDos = tt / 4 - 10 + profile.waistDeltaMm;
    const hauteurCorsageDos = lgDos;

    // Dimensions jupe
    const longueurJupe = resolveSkirtLengthMm(parameters.details['longueur']) ?? 650; // 65cm par défaut
    const largeurJupeDevant = tb / 4 + 15 + profile.hipDeltaMm;
    const largeurJupeDos = tb / 4 - 10 + profile.hipDeltaMm;
    const hemDevant = largeurJupeDevant + profile.hemFlareMm;
    const hemDos = largeurJupeDos + profile.hemFlareMm;

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

    const corsageDos: PatternPieceGeometry = {
      name: 'Corsage Dos',
      fabricRecommendation: 'Satin, Soie ou Coton de haute tenue',
      quantity: 2,
      seamAllowanceMm: 10,
      grainline: { angleDegrees: 90, originX: largeurCorsageDos / 2, originY: hauteurCorsageDos / 2 },
      notches: [{ positionAlongEdge: 0.5, edgeIndex: 1 }],
      outlineMm: [
        { x: 0, y: 0 },
        { x: 75, y: 0 },
        { x: largeurCorsageDos, y: 45 },
        { x: largeurCorsageDos, y: hauteurCorsageDos * 0.55 },
        { x: largeurTailleDos, y: hauteurCorsageDos },
        { x: 0, y: hauteurCorsageDos },
        { x: 0, y: 0 },
      ],
    };

    const jupeDevant: PatternPieceGeometry = {
      name: 'Jupe Devant',
      fabricRecommendation: null,
      quantity: 1,
      seamAllowanceMm: 10,
      grainline: { angleDegrees: 90, originX: largeurJupeDevant / 2, originY: longueurJupe / 2 },
      notches: [],
      outlineMm: skirtOutline(largeurTailleDevant, largeurJupeDevant, hemDevant, longueurJupe, profile.fishtail),
    };

    const jupeDos: PatternPieceGeometry = {
      name: 'Jupe Dos',
      fabricRecommendation: null,
      quantity: 2,
      seamAllowanceMm: 10,
      grainline: { angleDegrees: 90, originX: largeurJupeDos / 2, originY: longueurJupe / 2 },
      notches: [],
      outlineMm: skirtOutline(largeurTailleDos, largeurJupeDos, hemDos, longueurJupe, profile.fishtail),
    };

    const pieces = [corsageDevant, corsageDos, jupeDevant, jupeDos];

    const sleeve = resolveSleeve(
      parameters.details['manches'],
      measurements['LONGUEUR_BRAS'] !== undefined ? measurements['LONGUEUR_BRAS'] * 10 : undefined,
    );
    if (sleeve) {
      pieces.push(sleevePiece('Manche', tp, sleeve));
    }
    return pieces;
  },
};
