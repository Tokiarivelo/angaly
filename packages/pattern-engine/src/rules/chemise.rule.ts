import type {
  IPatternRule,
  MeasurementSet,
  PatternParameters,
  PatternPieceGeometry,
} from '../types';

const REQUIRED_MEASUREMENTS = ['TOUR_POITRINE', 'TOUR_TAILLE', 'LONGUEUR_DOS'];

export const ChemiseRule: IPatternRule = {
  garmentType: 'CHEMISE',
  requiredMeasurementKeys: REQUIRED_MEASUREMENTS,
  appliesTo(parameters: PatternParameters): boolean {
    return parameters.garmentType === 'CHEMISE' || parameters.garmentType === 'AUTRE';
  },
  computePieces(
    _parameters: PatternParameters,
    measurements: MeasurementSet,
  ): PatternPieceGeometry[] {
    const tourPoitrine = measurements['TOUR_POITRINE'] ?? 92;
    const tourTaille = measurements['TOUR_TAILLE'] ?? 76;
    const longueurDos = measurements['LONGUEUR_DOS'] ?? 42;
    const longueurBras = measurements['LONGUEUR_BRAS'] ?? 60;

    const tp = tourPoitrine * 10;
    const tt = tourTaille * 10;
    const lgChemise = Math.round(longueurDos * 10 * 1.55); // ~650mm
    const lgBras = longueurBras * 10 - 50; // Moins la hauteur du poignet (50mm)

    const largeurDevant = Math.round(tp / 4 + 30); // 3cm d'aisance
    const largeurTailleDevant = Math.round(tt / 4 + 25);
    const largeurDos = Math.round(tp / 4 + 25);
    const largeurTailleDos = Math.round(tt / 4 + 20);

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
        { x: 0, y: 0 }, // Patte de boutonnage haut
        { x: 70, y: 0 }, // Encolure / épaule
        { x: largeurDevant - 35, y: 45 }, // Emmanchure haut
        { x: largeurDevant, y: 220 }, // Dessous de bras
        { x: largeurTailleDevant, y: 400 }, // Taille
        { x: largeurDevant - 10, y: lgChemise }, // Côté bas liquette
        { x: 0, y: lgChemise }, // Milieu devant bas
        { x: 0, y: 0 },
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
        { x: 65, y: 0 }, // Épaule
        { x: largeurDos - 30, y: 40 }, // Emmanchure
        { x: largeurDos, y: 215 }, // Dessous de bras
        { x: largeurTailleDos, y: 395 }, // Taille dos
        { x: largeurDos - 5, y: lgChemise }, // Côté bas dos
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
      outlineMm: [
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
        { x: 380, y: 0 },
        { x: 370, y: 70 },
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

    return [pieceDevant, pieceDos, pieceManche, pieceCol, piecePoignet];
  },
};
