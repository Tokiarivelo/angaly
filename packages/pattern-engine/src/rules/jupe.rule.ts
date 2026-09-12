import type {
  IPatternRule,
  MeasurementSet,
  PatternParameters,
  PatternPieceGeometry,
} from '../types';

// Pour une jupe de base, il nous faut au minimum :
const REQUIRED_MEASUREMENTS = ['TOUR_TAILLE', 'TOUR_BASSIN', 'LONGUEUR_DOS'];

export const JupeRule: IPatternRule = {
  garmentType: 'JUPE',
  requiredMeasurementKeys: REQUIRED_MEASUREMENTS,
  appliesTo(parameters: PatternParameters): boolean {
    return parameters.garmentType === 'JUPE';
  },
  computePieces(
    _parameters: PatternParameters,
    measurements: MeasurementSet,
  ): PatternPieceGeometry[] {
    const tourTaille = measurements['TOUR_TAILLE'] ?? 70;
    const tourBassin = measurements['TOUR_BASSIN'] ?? 95;
    const longueur = measurements['LONGUEUR_DOS'] || 60; // default 60cm

    // Valeurs de base en mm
    const tt = tourTaille * 10;
    const tb = tourBassin * 10;
    const lg = longueur * 10;

    // Calculs simplifiés (base jupe droite)
    // Devant: quart du tour de bassin + 1cm d'aisance
    const largeurDevant = tb / 4 + 10;
    const largeurTailleDevant = tt / 4 + 10 + 20; // + pince de 2cm

    // Dos: quart du tour de bassin - 1cm d'aisance
    const largeurDos = tb / 4 - 10;
    const largeurTailleDos = tt / 4 - 10 + 30; // + pince de 3cm

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
        { x: largeurDevant, y: 200 }, // Ligne de bassin (20cm sous la taille)
        { x: largeurDevant, y: lg }, // Ourlet côté
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
        { x: largeurDos, y: 200 }, // Ligne de bassin
        { x: largeurDos, y: lg }, // Ourlet côté
        { x: 0, y: lg }, // Milieu dos ourlet
        { x: 0, y: 0 },
      ],
    };

    return [devant, dos];
  },
};
