import type {
  IPatternRule,
  MeasurementSet,
  PatternParameters,
  PatternPieceGeometry,
} from '../types';
import { resolveTopAdjustments } from '../shared/cut-profile';
import { sleeveOutline } from '../shared/shapes';
import { collarLengthMm, fitSleeveDims, fitTorsoOutline } from '../shared/fit';

const REQUIRED_MEASUREMENTS = ['TOUR_POITRINE', 'TOUR_TAILLE', 'LONGUEUR_DOS'];

export const ChemiseRule: IPatternRule = {
  garmentType: 'CHEMISE',
  requiredMeasurementKeys: REQUIRED_MEASUREMENTS,
  appliesTo(parameters: PatternParameters): boolean {
    // AUTRE has its own dedicated rule (autre.rule.ts, a generic base block) — CHEMISE
    // alone no longer falls back to accepting it (a custom cahier-des-charges piece is
    // not a shirt/blouse).
    return parameters.garmentType === 'CHEMISE';
  },
  computePieces(
    parameters: PatternParameters,
    measurements: MeasurementSet,
  ): PatternPieceGeometry[] {
    const tourPoitrine = measurements['TOUR_POITRINE'] ?? 92;
    const tourTaille = measurements['TOUR_TAILLE'] ?? 76;
    const longueurDos = measurements['LONGUEUR_DOS'] ?? 42;
    const longueurBras = measurements['LONGUEUR_BRAS'] ?? 60;

    const tp = tourPoitrine * 10;
    const tt = tourTaille * 10;
    const lgBras = longueurBras * 10 - 50; // Moins la hauteur du poignet (50mm)
    const adj = resolveTopAdjustments(parameters, lgBras);
    const lgChemise = Math.round(longueurDos * 10 * 1.55 * adj.lengthFactor); // ~650mm par défaut

    const largeurDevant = Math.round(tp / 4 + 30 + adj.bodiceDeltaMm); // 3cm d'aisance (DROITE)
    const largeurTailleDevant = Math.round(tt / 4 + 25 + adj.waistDeltaMm);
    const largeurDos = Math.round(tp / 4 + 25 + adj.bodiceDeltaMm);
    const largeurTailleDos = Math.round(tt / 4 + 20 + adj.waistDeltaMm);
    const neckFront = adj.neckline ?? { widthMm: 70, depthMm: 0 };
    const neckBackWidth = adj.neckline ? Math.max(adj.neckline.widthMm - 5, 40) : 65;

    const pieceDevant: PatternPieceGeometry = {
      name: 'Devant Chemise',
      fabricRecommendation: 'Popeline de coton, Lin, Soie ou Tencel',
      quantity: 2,
      seamAllowanceMm: 10,
      grainline: {
        angleDegrees: 90,
        originX: largeurDevant / 2,
        originY: lgChemise / 2,
      },
      notches: [
        { positionAlongEdge: 0.5, edgeIndex: 1 },
      ],
      outlineMm: [
        { x: 0, y: neckFront.depthMm }, // Patte de boutonnage haut
        { x: neckFront.widthMm, y: 0 }, // Encolure / épaule
        { x: largeurDevant - 35, y: 45 }, // Emmanchure haut
        { x: largeurDevant, y: 220 }, // Dessous de bras
        { x: largeurTailleDevant, y: 400 }, // Taille
        { x: largeurDevant - 10 + adj.hemDeltaMm, y: lgChemise }, // Côté bas liquette
        { x: 0, y: lgChemise }, // Milieu devant bas
        { x: 0, y: neckFront.depthMm },
      ],
    };

    const pieceDos: PatternPieceGeometry = {
      name: 'Dos Chemise',
      fabricRecommendation: 'Popeline de coton, Lin, Soie ou Tencel',
      quantity: 1, // Au pli
      seamAllowanceMm: 10,
      grainline: {
        angleDegrees: 90,
        originX: largeurDos / 2,
        originY: lgChemise / 2,
      },
      notches: [
        { positionAlongEdge: 0.5, edgeIndex: 1 },
      ],
      outlineMm: [
        { x: 0, y: 0 }, // Pli milieu dos
        { x: neckBackWidth, y: 0 }, // Épaule
        { x: largeurDos - 30, y: 40 }, // Emmanchure
        { x: largeurDos, y: 215 }, // Dessous de bras
        { x: largeurTailleDos, y: 395 }, // Taille dos
        { x: largeurDos - 5 + adj.hemDeltaMm, y: lgChemise }, // Côté bas dos
        { x: 0, y: lgChemise }, // Milieu dos bas
        { x: 0, y: 0 },
      ],
    };

    const pieceManche: PatternPieceGeometry = {
      name: 'Manche Chemise',
      fabricRecommendation: 'Popeline de coton, Lin, Soie ou Tencel',
      quantity: 2,
      seamAllowanceMm: 10,
      grainline: {
        angleDegrees: 90,
        originX: 150,
        originY: lgBras / 2,
      },
      notches: [{ positionAlongEdge: 0.5, edgeIndex: 0 }],
      outlineMm: adj.sleeve
        ? (() => {
            const d = fitSleeveDims(
              { topMm: 300 * adj.sleeve.topRatio, cuffMm: 300 * adj.sleeve.cuffRatio, capMm: 120 },
              measurements,
            );
            return sleeveOutline(d.topMm, d.cuffMm, d.capMm, adj.sleeve.lengthMm);
          })()
        : [
            { x: 0, y: 120 },
            { x: 150, y: 0 },
            { x: 300, y: 120 },
            { x: 230, y: lgBras },
            { x: 70, y: lgBras },
            { x: 0, y: 120 },
          ],
    };

    const pieceCol: PatternPieceGeometry = {
      name: 'Col & Pied de col',
      fabricRecommendation: 'Entoilage moyen',
      quantity: 2,
      seamAllowanceMm: 10,
      grainline: {
        angleDegrees: 0,
        originX: 190,
        originY: 35,
      },
      notches: [],
      outlineMm: [
        { x: 0, y: 0 },
        { x: collarLengthMm(380, measurements), y: 0 },
        { x: collarLengthMm(380, measurements) - 10, y: 70 },
        { x: 10, y: 70 },
        { x: 0, y: 0 },
      ],
    };

    const piecePoignet: PatternPieceGeometry = {
      name: 'Poignet',
      fabricRecommendation: 'Entoilage moyen',
      quantity: 2,
      seamAllowanceMm: 10,
      grainline: {
        angleDegrees: 0,
        originX: 120,
        originY: 25,
      },
      notches: [],
      outlineMm: [
        { x: 0, y: 0 },
        { x: 240, y: 0 },
        { x: 240, y: 50 },
        { x: 0, y: 50 },
        { x: 0, y: 0 },
      ],
    };

    pieceDevant.outlineMm = fitTorsoOutline(pieceDevant.outlineMm, measurements, {
      side: 'front',
      neckWidthMm: neckFront.widthMm,
    });
    pieceDos.outlineMm = fitTorsoOutline(pieceDos.outlineMm, measurements, {
      side: 'back',
      neckWidthMm: neckBackWidth,
    });

    const pieces = [pieceDevant, pieceDos];
    if (!adj.sleeveless) pieces.push(pieceManche);
    if (adj.includeCollar) pieces.push(pieceCol);
    if (!adj.sleeveless && adj.includeCuff) pieces.push(piecePoignet);
    return pieces;
  },
};
