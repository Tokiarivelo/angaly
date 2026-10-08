import type {
  IPatternRule,
  MeasurementSet,
  PatternParameters,
  PatternPieceGeometry,
} from '../types';
import { resolveLegProfile, resolveTrouserLengthFactor } from '../shared/cut-profile';

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
    const lg = Math.round(longueurJambe * 10 * resolveTrouserLengthFactor(parameters.details['longueur']));

    // Ligne d'enfourchure (hauteur montant) et genou
    // HAUTEUR_FOURCHE (taille → assise) si mesurée, sinon proportion du bassin (~260mm).
    const hauteurMontant =
      measurements['HAUTEUR_FOURCHE'] !== undefined
        ? Math.round(measurements['HAUTEUR_FOURCHE'] * 10)
        : Math.round(tb / 4 + 20);
    const hauteurGenou = Math.round(hauteurMontant + (lg - hauteurMontant) * 0.5); // ~630mm

    // Forme de jambe selon la coupe choisie (voir shared/cut-profile.ts)
    const leg = resolveLegProfile(parameters.cutType, parameters.ease);
    const demiLargeurBasDevant = leg.halfHemMm; // Standard 200mm bas
    const kneeFront = Math.round(demiLargeurBasDevant * leg.kneeRatio);

    // Devant
    const largeurBassinDevant = Math.round(tb / 4 - 10 + leg.hipDeltaMm);
    const avanceeFourcheDevant = Math.round((tb / 4) * 0.18);
    const largeurTailleDevant = Math.round(tt / 4 + 20 + leg.waistDeltaMm);
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
        { x: lignePliDevant + kneeFront, y: hauteurGenou },
        { x: lignePliDevant + demiLargeurBasDevant, y: lg },
        { x: lignePliDevant - demiLargeurBasDevant, y: lg },
        { x: lignePliDevant - kneeFront, y: hauteurGenou },
        { x: 0, y: hauteurMontant },
        { x: Math.round(avanceeFourcheDevant * 0.7), y: Math.round(hauteurMontant * 0.6) },
        { x: avanceeFourcheDevant, y: 0 },
      ],
    };

    // Dos
    const largeurBassinDos = Math.round(tb / 4 + 10 + leg.hipDeltaMm);
    const avanceeFourcheDos = Math.round((tb / 4) * 0.38);
    const largeurTailleDos = Math.round(tt / 4 + 30 + leg.waistDeltaMm);
    const demiLargeurBasDos = demiLargeurBasDevant + 15;
    const kneeDos = Math.round(demiLargeurBasDos * leg.kneeRatio);
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
        { x: lignePliDos + kneeDos, y: hauteurGenou },
        { x: lignePliDos + demiLargeurBasDos, y: lg },
        { x: lignePliDos - demiLargeurBasDos, y: lg },
        { x: lignePliDos - kneeDos, y: hauteurGenou },
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
