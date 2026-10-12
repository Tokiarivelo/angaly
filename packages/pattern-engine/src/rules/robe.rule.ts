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
import { curveNeckline, skirtOutline, sleevePiece, splitUnderbust } from '../shared/shapes';
import {
  asymmetricHemPieces,
  buildOverskirtPiece,
  buildSkirtBlock,
  buildTrainPiece,
  computeCowlNeck,
  drapeBodicePiece,
  resolveDrape,
  wrapFrontPiece,
} from '../blocks';
import {
  bodiceLengthFactor,
  fitSleeve,
  fitTorsoOutline,
  resolveLengthMm,
  skirtFullnessExtraMm,
  withEase,
} from '../shared/fit';

const REQUIRED_MEASUREMENTS = ['TOUR_POITRINE', 'TOUR_TAILLE', 'TOUR_BASSIN', 'LONGUEUR_DOS'];
/** Centre-back neck point below the shoulder-neck point (a drafted back neckline is a shallow curve). */
const BACK_NECK_DEPTH_MM = 20;
/** Under-bust gathers: fabric gathered onto the seam (1.5 × its length) and the midriff band's height. */
const UNDERBUST_FULLNESS = 1.3;
const MIDRIFF_RATIO = 0.2;

export const RobeRule: IPatternRule = {
  garmentType: 'ROBE',
  requiredMeasurementKeys: REQUIRED_MEASUREMENTS,
  appliesTo(parameters: PatternParameters): boolean {
    // ROBE_MARIEE has its own dedicated rule (robe-mariee.rule.ts) with structured-bodice
    // ease and a train — ROBE alone no longer falls back to accepting it.
    return parameters.garmentType === 'ROBE';
  },
  warnings(parameters: PatternParameters): string[] {
    const drape = resolveDrape(parameters);
    return drape.hem && drape.skirt?.kind === 'CIRCLE_SKIRT'
      ? ['Ourlet asymétrique ignoré : le bord d\'une jupe cercle est un arc, il ne se décale pas.']
      : [];
  },
  computePieces(
    parameters: PatternParameters,
    measurements: MeasurementSet,
  ): PatternPieceGeometry[] {
    const tourPoitrine = measurements['TOUR_POITRINE'] ?? 90;
    const tourTaille = measurements['TOUR_TAILLE'] ?? 70;
    const tourBassin = measurements['TOUR_BASSIN'] ?? 95;
    const longueurDos = measurements['LONGUEUR_DOS'] ?? 40;

    const profile = withEase(resolveCutProfile(parameters.cutType), parameters.ease);
    const neckline = resolveNeckline(parameters.details);
    const tp = tourPoitrine * 10;
    const tt = tourTaille * 10;
    const tb = tourBassin * 10;
    const lgDos = Math.round(longueurDos * 10 * bodiceLengthFactor(parameters.lengths));
    const lgDevantMesure =
      measurements['LONGUEUR_DEVANT'] !== undefined
        ? Math.round(measurements['LONGUEUR_DEVANT'] * 10 * bodiceLengthFactor(parameters.lengths))
        : undefined;

    // Dimensions corsage
    const largeurCorsageDevant = tp / 4 + 20 + profile.bodiceDeltaMm; // 2cm aisance (DROITE)
    const largeurTailleDevant = tt / 4 + 20 + profile.waistDeltaMm;
    const hauteurCorsageDevant = lgDevantMesure ?? lgDos + 40; // LONGUEUR_DEVANT mesurée si fournie

    const largeurCorsageDos = tp / 4 - 10 + profile.bodiceDeltaMm;
    const largeurTailleDos = tt / 4 - 10 + profile.waistDeltaMm;
    const hauteurCorsageDos = lgDos;

    // Dimensions jupe
    const longueurJupe = resolveLengthMm(
      measurements['LONGUEUR_JUPE'] !== undefined
        ? measurements['LONGUEUR_JUPE'] * 10
        : (resolveSkirtLengthMm(parameters.details['longueur']) ?? 650), // 65cm par défaut
      parameters.lengths?.skirtPct,
      [300, 1500],
    );
    const largeurJupeDevant = tb / 4 + 15 + profile.hipDeltaMm;
    const largeurJupeDos = tb / 4 - 10 + profile.hipDeltaMm;
    const hemDevant = largeurJupeDevant + profile.hemFlareMm + skirtFullnessExtraMm(parameters.fullness, largeurJupeDevant);
    const hemDos = largeurJupeDos + profile.hemFlareMm + skirtFullnessExtraMm(parameters.fullness, largeurJupeDos);

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
        { x: 0, y: BACK_NECK_DEPTH_MM },
        { x: 75, y: 0 },
        { x: largeurCorsageDos, y: 45 },
        { x: largeurCorsageDos, y: hauteurCorsageDos * 0.55 },
        { x: largeurTailleDos, y: hauteurCorsageDos },
        { x: 0, y: hauteurCorsageDos },
        { x: 0, y: BACK_NECK_DEPTH_MM },
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

    // Épaules, emmanchure et pince de poitrine d'après les mesures du corps (no-op sans elles).
    corsageDevant.outlineMm = fitTorsoOutline(corsageDevant.outlineMm, measurements, {
      side: 'front',
      neckWidthMm: neckline.widthMm,
    });
    corsageDos.outlineMm = fitTorsoOutline(corsageDos.outlineMm, measurements, {
      side: 'back',
      neckWidthMm: 75,
      dartSegmentIdx: null,
    });
    // Drafted necklines are curves, not the straight line from the centre to the shoulder.
    corsageDevant.outlineMm = curveNeckline(corsageDevant.outlineMm);
    corsageDos.outlineMm = curveNeckline(corsageDos.outlineMm);

    // Fronces sous la poitrine : the front is cut under the bust, gathered onto a midriff band.
    let midriff: PatternPieceGeometry | null = null;
    if (parameters.details['corsage']?.toUpperCase() === 'FRONCES_SOUS_POITRINE') {
      const bandMm = Math.round(Math.min(110, Math.max(60, hauteurCorsageDevant * MIDRIFF_RATIO)));
      const split = splitUnderbust(corsageDevant.outlineMm, hauteurCorsageDevant - bandMm, UNDERBUST_FULLNESS);
      if (split) {
        corsageDevant.outlineMm = split.upper;
        corsageDevant.grainline = { ...corsageDevant.grainline, originY: split.seamYMm / 2 };
        midriff = {
          name: 'Empiècement Devant',
          fabricRecommendation: corsageDevant.fabricRecommendation,
          quantity: 1,
          seamAllowanceMm: 10,
          grainline: { angleDegrees: 90, originX: largeurTailleDevant / 2, originY: bandMm / 2 },
          notches: [{ positionAlongEdge: 0.5, edgeIndex: 0 }],
          outlineMm: split.band,
        };
      }
    }

    // Blocs de drapé (S4) : un bloc de jupe remplace les panneaux de jupe de la règle ; le portefeuille
    // croise le devant du corsage ; le col bénitier ajoute une pièce taillée dans le biais.
    const drape = resolveDrape(parameters);
    const waistCircumference = tt + 40 + 4 * profile.waistDeltaMm;
    let pieces: PatternPieceGeometry[] = [
      corsageDevant,
      ...(midriff ? [midriff] : []),
      corsageDos,
      ...(drape.skirt
        ? buildSkirtBlock(drape.skirt, waistCircumference, longueurJupe)
        : [jupeDevant, jupeDos]),
    ];
    if (drape.wrap) pieces = wrapFrontPiece(pieces, 'Corsage Devant', drape.wrap);
    if (drape.bodice) pieces = drapeBodicePiece(pieces, 'Corsage Devant', drape.bodice);
    if (drape.hem) pieces = asymmetricHemPieces(pieces, ['Jupe'], drape.hem);
    if (drape.cowl) pieces.push(computeCowlNeck(neckline.widthMm, drape.cowl.depthMm));
    if (drape.overskirt) pieces.push(buildOverskirtPiece(drape.overskirt, waistCircumference, longueurJupe));
    if (drape.train) pieces.push(buildTrainPiece(drape.train, Math.max(500, Math.round(2 * hemDos))));

    const sleeve = fitSleeve(
      resolveSleeve(
        parameters.details['manches'],
        measurements['LONGUEUR_BRAS'] !== undefined ? measurements['LONGUEUR_BRAS'] * 10 : undefined,
      ),
      parameters,
    );
    if (sleeve) {
      pieces.push(sleevePiece('Manche', tp, sleeve, null, 10, measurements));
    }
    return pieces;
  },
};
