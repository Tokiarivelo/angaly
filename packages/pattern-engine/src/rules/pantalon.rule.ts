import type {
  IPatternRule,
  MeasurementSet,
  PatternParameters,
  PatternPieceGeometry,
} from '../types';

const REQUIRED_MEASUREMENTS = ['TOUR_TAILLE', 'TOUR_BASSIN'];

export const PantalonRule: IPatternRule = {
  garmentType: 'PANTALON',
  requiredMeasurementKeys: REQUIRED_MEASUREMENTS,
  appliesTo(parameters: PatternParameters): boolean {
    return parameters.garmentType === 'PANTALON';
  },
  computePieces(
    parameters: PatternParameters,
    measurements: MeasurementSet,
  ): PatternPieceGeometry[] {
    const tourTaille = measurements['TOUR_TAILLE'] ?? 70;
    const tourBassin = measurements['TOUR_BASSIN'] ?? 95;
    const longueurJambe = measurements['LONGUEUR_JAMBE'] ?? measurements['LONGUEUR_PANTALON'] ?? 100;

    // Dimensions en millimètres
    const tt = tourTaille * 10;
    const tb = tourBassin * 10;
    const lg = longueurJambe * 10;

    // Ligne d'enfourchure (hauteur montant) et genou
    const hauteurMontant = Math.round(tb / 4 + 20); // ~260mm
    const hauteurGenou = Math.round(hauteurMontant + (lg - hauteurMontant) * 0.5); // ~630mm

    // Ajustement de la largeur bas selon la coupe
    const cutType = (parameters.cutType || '').toUpperCase();
    let demiLargeurBasDevant = 100; // Standard 200mm bas
    if (cutType.includes('SLIM') || cutType.includes('CIGARETTE')) {
      demiLargeurBasDevant = 80;
    } else if (cutType.includes('LARGE') || cutType.includes('PALAZZO') || cutType.includes('FLUIDE')) {
      demiLargeurBasDevant = 140;
    }

    // Devant
    const largeurBassinDevant = Math.round(tb / 4 - 10);
    const avanceeFourcheDevant = Math.round((tb / 4) * 0.18);
    const largeurTailleDevant = Math.round(tt / 4 + 20);
    const lignePliDevant = Math.round((largeurBassinDevant + avanceeFourcheDevant) / 2);

    const pieceDevant: PatternPieceGeometry = {
      name: 'Devant Pantalon',
      fabricRecommendation: 'Laine froide, Gabardine, Crêpe ou Coton sergé',
      quantity: 2,
      seamAllowanceMm: 10,
      grainline: {
        angleDegrees: 90,
        originX: lignePliDevant,
        originY: lg / 2,
      },
      notches: [
        { positionAlongEdge: 0.5, edgeIndex: 2 },
        { positionAlongEdge: 0.8, edgeIndex: 1 },
      ],
      outlineMm: [
        { x: avanceeFourcheDevant, y: 0 },
        { x: avanceeFourcheDevant + largeurTailleDevant, y: 10 },
        { x: avanceeFourcheDevant + largeurBassinDevant, y: 180 },
        { x: lignePliDevant + Math.round(demiLargeurBasDevant * 1.1), y: hauteurGenou },
        { x: lignePliDevant + demiLargeurBasDevant, y: lg },
        { x: lignePliDevant - demiLargeurBasDevant, y: lg },
        { x: lignePliDevant - Math.round(demiLargeurBasDevant * 1.1), y: hauteurGenou },
        { x: 0, y: hauteurMontant },
        { x: Math.round(avanceeFourcheDevant * 0.7), y: Math.round(hauteurMontant * 0.6) },
        { x: avanceeFourcheDevant, y: 0 },
      ],
    };

    // Dos
    const largeurBassinDos = Math.round(tb / 4 + 10);
    const avanceeFourcheDos = Math.round((tb / 4) * 0.38);
    const largeurTailleDos = Math.round(tt / 4 + 30);
    const demiLargeurBasDos = demiLargeurBasDevant + 15;
    const lignePliDos = Math.round((largeurBassinDos + avanceeFourcheDos) / 2);
    const rehausseDos = 35;

    const pieceDos: PatternPieceGeometry = {
      name: 'Dos Pantalon',
      fabricRecommendation: 'Laine froide, Gabardine, Crêpe ou Coton sergé',
      quantity: 2,
      seamAllowanceMm: 10,
      grainline: {
        angleDegrees: 90,
        originX: lignePliDos,
        originY: lg / 2,
      },
      notches: [
        { positionAlongEdge: 0.5, edgeIndex: 2 },
        { positionAlongEdge: 0.8, edgeIndex: 1 },
      ],
      outlineMm: [
        { x: avanceeFourcheDos + 20, y: -rehausseDos },
        { x: avanceeFourcheDos + 20 + largeurTailleDos, y: 10 },
        { x: avanceeFourcheDos + largeurBassinDos, y: 180 },
        { x: lignePliDos + Math.round(demiLargeurBasDos * 1.1), y: hauteurGenou },
        { x: lignePliDos + demiLargeurBasDos, y: lg },
        { x: lignePliDos - demiLargeurBasDos, y: lg },
        { x: lignePliDos - Math.round(demiLargeurBasDos * 1.1), y: hauteurGenou },
        { x: 0, y: hauteurMontant + 15 },
        { x: Math.round(avanceeFourcheDos * 0.6), y: Math.round(hauteurMontant * 0.7) },
        { x: avanceeFourcheDos + 20, y: -rehausseDos },
      ],
    };

    // Ceinture
    const longueurCeinture = tt + 80;
    const hauteurCeinture = 70;
    const pieceCeinture: PatternPieceGeometry = {
      name: 'Ceinture',
      fabricRecommendation: 'Entoilage thermocollant préconisé',
      quantity: 1,
      seamAllowanceMm: 10,
      grainline: {
        angleDegrees: 0,
        originX: longueurCeinture / 2,
        originY: hauteurCeinture / 2,
      },
      notches: [
        { positionAlongEdge: 0.25, edgeIndex: 0 },
        { positionAlongEdge: 0.5, edgeIndex: 0 },
        { positionAlongEdge: 0.75, edgeIndex: 0 },
      ],
      outlineMm: [
        { x: 0, y: 0 },
        { x: longueurCeinture, y: 0 },
        { x: longueurCeinture, y: hauteurCeinture },
        { x: 0, y: hauteurCeinture },
        { x: 0, y: 0 },
      ],
    };

    // Fond de poche
    const pieceFondPoche: PatternPieceGeometry = {
      name: 'Fond de Poche',
      fabricRecommendation: 'Doublure coton ou satinette',
      quantity: 2,
      seamAllowanceMm: 10,
      grainline: {
        angleDegrees: 90,
        originX: 80,
        originY: 120,
      },
      notches: [],
      outlineMm: [
        { x: 0, y: 0 },
        { x: 160, y: 0 },
        { x: 170, y: 150 },
        { x: 130, y: 260 },
        { x: 30, y: 260 },
        { x: 0, y: 180 },
        { x: 0, y: 0 },
      ],
    };

    return [pieceDevant, pieceDos, pieceCeinture, pieceFondPoche];
  },
};
