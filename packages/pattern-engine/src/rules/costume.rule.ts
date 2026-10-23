import { isShawl, resolveTopAdjustments } from '../shared/cut-profile';
import { draftTrousers } from './pantalon.rule';
import {
  collarLengthMm,
  fitSleeveDims,
  fitTorsoOutline,
} from '../shared/fit';
import { collarPiece, sleeveOutline } from '../shared/shapes';
import type {
  IPatternRule,
  MeasurementSet,
  PatternParameters,
  PatternPieceGeometry,
} from '../types';

/**
 * COSTUME = "ensemble tailleur veste et pantalon/jupe" (voir
 * apps/web/src/features/pattern-studio-wizard/consts/garment-types.const.ts et spec §19).
 * Avant cette règle, `VesteRule.appliesTo()` acceptait aussi `COSTUME` et ne produisait
 * jamais que les pièces de la veste — la moitié "pantalon/jupe" du vêtement demandé
 * n'était simplement jamais générée (voir docs/features/patterns.md, "Points d'attention").
 *
 * Décision de construction (documentée, cf. consigne skill pattern-engine-rule) : un
 * `COSTUME` produit **toujours** un ensemble veste + pantalon. On ne bascule pas
 * automatiquement vers une jupe selon `parameters.details`/`parameters.style` : la spec
 * (§19, "costume") ne distingue pas costume homme/femme, et pantalon reste la pièce la plus
 * représentative d'un costume au sens tailleur classique — un couturière peut toujours
 * demander une jupe de tailleur via une commande `JUPE` séparée assortie. Garder cette règle
 * simple et déterministe plutôt que d'introduire une branche conditionnelle non spécifiée.
 *
 * Construction : adaptation autonome (pas de ré-import, voir 007-pattern-engine.mdc — chaque
 * règle est self-contained) des formules de `veste.rule.ts` (buste/emmanchure/manche/col) et
 * de `pantalon.rule.ts` (bassin/enfourchure/ceinture), réunies dans un seul jeu de pièces.
 */
const REQUIRED_MEASUREMENTS = ['TOUR_POITRINE', 'TOUR_TAILLE', 'TOUR_BASSIN', 'LONGUEUR_DOS'];

export const CostumeRule: IPatternRule = {
  garmentType: 'COSTUME',
  requiredMeasurementKeys: REQUIRED_MEASUREMENTS,
  appliesTo(parameters: PatternParameters): boolean {
    return parameters.garmentType === 'COSTUME';
  },
  computePieces(
    parameters: PatternParameters,
    measurements: MeasurementSet,
  ): PatternPieceGeometry[] {
    // --- Veste (adapté de veste.rule.ts) ---
    const tourPoitrine = measurements['TOUR_POITRINE'] ?? 96;
    const tourTaille = measurements['TOUR_TAILLE'] ?? 80;
    const longueurDos = measurements['LONGUEUR_DOS'] ?? 45;
    const longueurBras = measurements['LONGUEUR_BRAS'] ?? 62;

    const tp = tourPoitrine * 10;
    const tt = tourTaille * 10;
    const lgBras = longueurBras * 10;
    // `longueur` is the trousers' length on a suit (the wizard says « Longueur du pantalon »): the jacket keeps its own,
    // at the hips — a floor-length trouser no longer drags the jacket down to the knees.
    const { longueur: _trouserLength, ...jacketDetails } = parameters.details;
    void _trouserLength;
    const adj = resolveTopAdjustments({ ...parameters, details: jacketDetails }, lgBras);
    const lgVeste = Math.round(longueurDos * 10 * 1.6 * adj.lengthFactor); // Veste mi-fesses (~720mm)

    const largeurDevantVeste = Math.round(tp / 4 + 40 + adj.bodiceDeltaMm); // 4cm d'aisance veste tailleur
    const largeurTailleDevantVeste = Math.round(tt / 4 + 30 + adj.waistDeltaMm);
    const largeurDosVeste = Math.round(tp / 4 + 20 + adj.bodiceDeltaMm);
    const largeurTailleDosVeste = Math.round(tt / 4 + 15 + adj.waistDeltaMm);
    const neckFront = adj.neckline ?? { widthMm: 85, depthMm: 0 };
    const neckBackWidth = adj.neckline ? Math.max(adj.neckline.widthMm - 5, 40) : 80;

    const pieceDevantVeste: PatternPieceGeometry = {
      name: 'Devant Veste (Costume)',
      fabricRecommendation: 'Laine peignée, Flanelle ou Tweed',
      quantity: 2,
      seamAllowanceMm: 12,
      grainline: {
        angleDegrees: 90,
        originX: largeurDevantVeste / 2,
        originY: lgVeste / 2,
      },
      notches: [{ positionAlongEdge: 0.4, edgeIndex: 1 }], // Emmanchure
      outlineMm: [
        { x: 0, y: neckFront.depthMm }, // Encolure devant
        { x: neckFront.widthMm, y: 0 }, // Pointe encolure/épaule
        { x: largeurDevantVeste - 30, y: 55 }, // Emmanchure haut
        { x: largeurDevantVeste, y: 240 }, // Dessous de bras
        { x: largeurTailleDevantVeste, y: 440 }, // Ligne de taille cintrée
        { x: largeurDevantVeste + 10 + adj.hemDeltaMm, y: lgVeste }, // Bas veste côté
        { x: 0, y: lgVeste }, // Bas milieu devant
        { x: 0, y: neckFront.depthMm },
      ],
    };

    const pieceDosVeste: PatternPieceGeometry = {
      name: 'Dos Veste (Costume)',
      fabricRecommendation: 'Laine peignée, Flanelle ou Tweed',
      quantity: 2,
      seamAllowanceMm: 12,
      grainline: {
        angleDegrees: 90,
        originX: largeurDosVeste / 2,
        originY: lgVeste / 2,
      },
      notches: [{ positionAlongEdge: 0.4, edgeIndex: 1 }],
      outlineMm: [
        { x: 0, y: 0 }, // Encolure milieu dos
        { x: neckBackWidth, y: 0 }, // Épaule dos
        { x: largeurDosVeste - 25, y: 50 }, // Emmanchure haut dos
        { x: largeurDosVeste, y: 230 }, // Dessous de bras dos
        { x: largeurTailleDosVeste, y: 430 }, // Taille dos
        { x: largeurDosVeste + 5 + adj.hemDeltaMm, y: lgVeste }, // Bas côté dos
        { x: 0, y: lgVeste }, // Fente / milieu bas dos
        { x: 0, y: 0 },
      ],
    };

    const pieceMancheVeste: PatternPieceGeometry = {
      name: 'Manche Veste (Costume)',
      fabricRecommendation: 'Idem tissu principal',
      quantity: 2,
      seamAllowanceMm: 12,
      grainline: { angleDegrees: 90, originX: 160, originY: lgBras / 2 },
      notches: [{ positionAlongEdge: 0.5, edgeIndex: 0 }], // Cran tête de manche
      outlineMm: adj.sleeve
        ? (() => {
            const d = fitSleeveDims(
              { topMm: 320 * adj.sleeve.topRatio, cuffMm: 320 * adj.sleeve.cuffRatio, capMm: 150 },
              measurements,
            );
            return sleeveOutline(d.topMm, d.cuffMm, d.capMm, adj.sleeve.lengthMm);
          })()
        : [
            { x: 0, y: 150 }, // Saussée emmanchure
            { x: 160, y: 0 }, // Tête de manche
            { x: 320, y: 150 }, // Dessous bras
            { x: 260, y: lgBras }, // Poignet côté
            { x: 40, y: lgBras }, // Poignet côté intérieur
            { x: 0, y: 150 },
          ],
    };

    const pieceColVeste: PatternPieceGeometry = {
      name: 'Col Tailleur (Costume)',
      fabricRecommendation: 'Entoilage rigide recommandé',
      quantity: 2,
      seamAllowanceMm: 10,
      grainline: { angleDegrees: 0, originX: 200, originY: 45 },
      notches: [],
      outlineMm: [
        { x: 0, y: 0 },
        { x: collarLengthMm(400, measurements), y: 0 },
        { x: collarLengthMm(400, measurements) - 10, y: 90 },
        { x: 10, y: 90 },
        { x: 0, y: 0 },
      ],
    };

    // --- Pantalon : même construction que PantalonRule (ceinture, braguette, poches…), pièces suffixées « (Costume) ».
    const trousers = draftTrousers(parameters, measurements, ' (Costume)').pieces.map((p) =>
      p.name === 'Ceinture (Costume)' ? { ...p, name: 'Ceinture Pantalon (Costume)' } : p,
    );

    pieceDevantVeste.outlineMm = fitTorsoOutline(pieceDevantVeste.outlineMm, measurements, {
      side: 'front',
      neckWidthMm: neckFront.widthMm,
    });
    pieceDosVeste.outlineMm = fitTorsoOutline(pieceDosVeste.outlineMm, measurements, {
      side: 'back',
      neckWidthMm: neckBackWidth,
    });

    const jacket = [pieceDevantVeste, pieceDosVeste];
    if (!adj.sleeveless) jacket.push(pieceMancheVeste);
    const shawl = isShawl(parameters.details)
      ? collarPiece('CHALE', measurements, pieceColVeste.fabricRecommendation)
      : null;
    if (adj.includeCollar)
      jacket.push(shawl ? { ...shawl, name: 'Col châle (Costume)' } : pieceColVeste);

    return [...jacket, ...trousers];
  },
};
