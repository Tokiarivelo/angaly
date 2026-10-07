import type {
  IPatternRule,
  MeasurementSet,
  PatternParameters,
  PatternPieceGeometry,
} from '../types';
import { resolveTopAdjustments } from '../shared/cut-profile';
import { sleeveOutline } from '../shared/shapes';

const REQUIRED_MEASUREMENTS = ['TOUR_POITRINE', 'TOUR_TAILLE', 'LONGUEUR_DOS'];

export const VesteRule: IPatternRule = {
  garmentType: 'VESTE',
  requiredMeasurementKeys: REQUIRED_MEASUREMENTS,
  appliesTo(parameters: PatternParameters): boolean {
    // COSTUME has its own dedicated rule (costume.rule.ts) since it needs trouser pieces
    // too — VESTE alone no longer falls back to accepting it.
    return parameters.garmentType === 'VESTE';
  },
  computePieces(
    parameters: PatternParameters,
    measurements: MeasurementSet,
  ): PatternPieceGeometry[] {
    const tourPoitrine = measurements['TOUR_POITRINE'] ?? 96;
    const tourTaille = measurements['TOUR_TAILLE'] ?? 80;
    const longueurDos = measurements['LONGUEUR_DOS'] ?? 45;
    const longueurBras = measurements['LONGUEUR_BRAS'] ?? 62;

    const tp = tourPoitrine * 10;
    const tt = tourTaille * 10;
    const lgBras = longueurBras * 10;
    const adj = resolveTopAdjustments(parameters, lgBras);
    const lgVeste = Math.round(longueurDos * 10 * 1.6 * adj.lengthFactor); // Veste mi-fesses (~720mm)

    const largeurDevant = Math.round(tp / 4 + 40 + adj.bodiceDeltaMm); // 4cm d'aisance veste tailleur
    const largeurTailleDevant = Math.round(tt / 4 + 30 + adj.waistDeltaMm);
    const largeurDos = Math.round(tp / 4 + 20 + adj.bodiceDeltaMm);
    const largeurTailleDos = Math.round(tt / 4 + 15 + adj.waistDeltaMm);
    const neckFront = adj.neckline ?? { widthMm: 85, depthMm: 0 };
    const neckBackWidth = adj.neckline ? Math.max(adj.neckline.widthMm - 5, 40) : 80;

    const pieceDevant: PatternPieceGeometry = {
      name: 'Devant Veste',
      fabricRecommendation: 'Laine peignée, Tweed, Coton lourd ou Velours',
      quantity: 2,
      seamAllowanceMm: 12,
      grainline: {
        angleDegrees: 90,
        originX: largeurDevant / 2,
        originY: lgVeste / 2,
      },
      notches: [
        { positionAlongEdge: 0.4, edgeIndex: 1 }, // Emmanchure
      ],
      outlineMm: [
        { x: 0, y: neckFront.depthMm }, // Encolure devant
        { x: neckFront.widthMm, y: 0 }, // Pointe encolure/épaule
        { x: largeurDevant - 30, y: 55 }, // Emmanchure haut
        { x: largeurDevant, y: 240 }, // Dessous de bras
        { x: largeurTailleDevant, y: 440 }, // Ligne de taille cintrée
        { x: largeurDevant + 10 + adj.hemDeltaMm, y: lgVeste }, // Bas veste côté
        { x: 0, y: lgVeste }, // Bas milieu devant
        { x: 0, y: neckFront.depthMm },
      ],
    };

    const pieceDos: PatternPieceGeometry = {
      name: 'Dos Veste',
      fabricRecommendation: 'Laine peignée, Tweed, Coton lourd ou Velours',
      quantity: 2,
      seamAllowanceMm: 12,
      grainline: {
        angleDegrees: 90,
        originX: largeurDos / 2,
        originY: lgVeste / 2,
      },
      notches: [
        { positionAlongEdge: 0.4, edgeIndex: 1 },
      ],
      outlineMm: [
        { x: 0, y: 0 }, // Encolure milieu dos
        { x: neckBackWidth, y: 0 }, // Épaule dos
        { x: largeurDos - 25, y: 50 }, // Emmanchure haut dos
        { x: largeurDos, y: 230 }, // Dessous de bras dos
        { x: largeurTailleDos, y: 430 }, // Taille dos
        { x: largeurDos + 5 + adj.hemDeltaMm, y: lgVeste }, // Bas côté dos
        { x: 0, y: lgVeste }, // Fente / milieu bas dos
        { x: 0, y: 0 },
      ],
    };

    const pieceManche: PatternPieceGeometry = {
      name: 'Manche Veste',
      fabricRecommendation: 'Idem tissu principal',
      quantity: 2,
      seamAllowanceMm: 12,
      grainline: {
        angleDegrees: 90,
        originX: 160,
        originY: lgBras / 2,
      },
      notches: [
        { positionAlongEdge: 0.5, edgeIndex: 0 }, // Cran tête de manche
      ],
      outlineMm: adj.sleeve
        ? sleeveOutline(320 * adj.sleeve.topRatio, 320 * adj.sleeve.cuffRatio, 150, adj.sleeve.lengthMm)
        : [
            { x: 0, y: 150 }, // Saussée emmanchure
            { x: 160, y: 0 }, // Tête de manche
            { x: 320, y: 150 }, // Dessous bras
            { x: 260, y: lgBras }, // Poignet côté
            { x: 40, y: lgBras }, // Poignet côté intérieur
            { x: 0, y: 150 },
          ],
    };

    const pieceCol: PatternPieceGeometry = {
      name: 'Col Tailleur',
      fabricRecommendation: 'Entoilage rigide recommandé',
      quantity: 2,
      seamAllowanceMm: 10,
      grainline: {
        angleDegrees: 0,
        originX: 200,
        originY: 45,
      },
      notches: [],
      outlineMm: [
        { x: 0, y: 0 },
        { x: 400, y: 0 },
        { x: 390, y: 90 },
        { x: 10, y: 90 },
        { x: 0, y: 0 },
      ],
    };

    const pieces = [pieceDevant, pieceDos];
    if (!adj.sleeveless) pieces.push(pieceManche);
    if (adj.includeCollar) pieces.push(pieceCol);
    return pieces;
  },
};
