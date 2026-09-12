import type {
  IPatternRule,
  MeasurementSet,
  PatternParameters,
  PatternPieceGeometry,
} from '../types';

const REQUIRED_MEASUREMENTS = ['TOUR_POITRINE', 'TOUR_TAILLE', 'TOUR_BASSIN', 'LONGUEUR_DOS'];

export const RobeRule: IPatternRule = {
  garmentType: 'ROBE',
  requiredMeasurementKeys: REQUIRED_MEASUREMENTS,
  appliesTo(parameters: PatternParameters): boolean {
    return parameters.garmentType === 'ROBE' || parameters.garmentType === 'ROBE_MARIEE';
  },
  computePieces(
    _parameters: PatternParameters,
    measurements: MeasurementSet,
  ): PatternPieceGeometry[] {
    const tourPoitrine = measurements['TOUR_POITRINE'] ?? 90;
    const tourTaille = measurements['TOUR_TAILLE'] ?? 70;
    const tourBassin = measurements['TOUR_BASSIN'] ?? 95;
    const longueurDos = measurements['LONGUEUR_DOS'] ?? 40;

    const tp = tourPoitrine * 10;
    const tt = tourTaille * 10;
    const tb = tourBassin * 10;
    const lgDos = longueurDos * 10;

    // Dimensions corsage
    const largeurCorsageDevant = tp / 4 + 20; // 2cm aisance
    const largeurTailleDevant = tt / 4 + 20;
    const hauteurCorsageDevant = lgDos + 40;

    const largeurCorsageDos = tp / 4 - 10;
    const largeurTailleDos = tt / 4 - 10;
    const hauteurCorsageDos = lgDos;

    // Dimensions jupe
    const longueurJupe = 650; // 65cm jupe standard
    const largeurJupeDevant = tb / 4 + 15;
    const largeurJupeDos = tb / 4 - 10;

    const corsageDevant: PatternPieceGeometry = {
      name: 'Corsage Devant',
      fabricRecommendation: 'Satin, Soie ou Coton de haute tenue',
      quantity: 1,
      seamAllowanceMm: 10,
      grainline: { angleDegrees: 90, originX: largeurCorsageDevant / 2, originY: hauteurCorsageDevant / 2 },
      notches: [{ positionAlongEdge: 0.5, edgeIndex: 1 }],
      outlineMm: [
        { x: 0, y: 0 },
        { x: 80, y: 0 },
        { x: largeurCorsageDevant, y: 50 },
        { x: largeurCorsageDevant, y: hauteurCorsageDevant },
        { x: 0, y: hauteurCorsageDevant },
        { x: 0, y: 0 },
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
        { x: largeurCorsageDos, y: hauteurCorsageDos },
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
      outlineMm: [
        { x: 0, y: 0 },
        { x: largeurTailleDevant, y: 10 },
        { x: largeurJupeDevant, y: 200 },
        { x: largeurJupeDevant, y: longueurJupe },
        { x: 0, y: longueurJupe },
        { x: 0, y: 0 },
      ],
    };

    const jupeDos: PatternPieceGeometry = {
      name: 'Jupe Dos',
      fabricRecommendation: null,
      quantity: 2,
      seamAllowanceMm: 10,
      grainline: { angleDegrees: 90, originX: largeurJupeDos / 2, originY: longueurJupe / 2 },
      notches: [],
      outlineMm: [
        { x: 0, y: 0 },
        { x: largeurTailleDos, y: 10 },
        { x: largeurJupeDos, y: 200 },
        { x: largeurJupeDos, y: longueurJupe },
        { x: 0, y: longueurJupe },
        { x: 0, y: 0 },
      ],
    };

    return [corsageDevant, corsageDos, jupeDevant, jupeDos];
  },
};
