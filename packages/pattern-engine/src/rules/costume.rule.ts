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
    const lgVeste = Math.round(longueurDos * 10 * 1.6); // Veste tombant mi-fesses (~720mm)
    const lgBras = longueurBras * 10;

    const largeurDevantVeste = Math.round(tp / 4 + 40); // 4cm d'aisance veste tailleur
    const largeurTailleDevantVeste = Math.round(tt / 4 + 30);
    const largeurDosVeste = Math.round(tp / 4 + 20);
    const largeurTailleDosVeste = Math.round(tt / 4 + 15);

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
        { x: 0, y: 0 }, // Encolure devant
        { x: 85, y: 0 }, // Pointe encolure/épaule
        { x: largeurDevantVeste - 30, y: 55 }, // Emmanchure haut
        { x: largeurDevantVeste, y: 240 }, // Dessous de bras
        { x: largeurTailleDevantVeste, y: 440 }, // Ligne de taille cintrée
        { x: largeurDevantVeste + 10, y: lgVeste }, // Bas veste côté
        { x: 0, y: lgVeste }, // Bas milieu devant
        { x: 0, y: 0 },
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
        { x: 80, y: 0 }, // Épaule dos
        { x: largeurDosVeste - 25, y: 50 }, // Emmanchure haut dos
        { x: largeurDosVeste, y: 230 }, // Dessous de bras dos
        { x: largeurTailleDosVeste, y: 430 }, // Taille dos
        { x: largeurDosVeste + 5, y: lgVeste }, // Bas côté dos
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
      outlineMm: [
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
        { x: 400, y: 0 },
        { x: 390, y: 90 },
        { x: 10, y: 90 },
        { x: 0, y: 0 },
      ],
    };

    // --- Pantalon (adapté de pantalon.rule.ts) ---
    const tourBassin = measurements['TOUR_BASSIN'] ?? 95;
    const longueurJambe =
      measurements['LONGUEUR_JAMBE'] ?? measurements['LONGUEUR_PANTALON'] ?? 100;

    const tb = tourBassin * 10;
    const lg = longueurJambe * 10;

    const hauteurMontant = Math.round(tb / 4 + 20); // ~260mm
    const hauteurGenou = Math.round(hauteurMontant + (lg - hauteurMontant) * 0.5);

    const cutType = (parameters.cutType || '').toUpperCase();
    let demiLargeurBasDevant = 100; // Coupe droite tailleur par défaut
    if (cutType.includes('SLIM') || cutType.includes('CIGARETTE')) {
      demiLargeurBasDevant = 80;
    } else if (cutType.includes('LARGE') || cutType.includes('PALAZZO') || cutType.includes('FLUIDE')) {
      demiLargeurBasDevant = 140;
    }

    const largeurBassinDevant = Math.round(tb / 4 - 10);
    const avanceeFourcheDevant = Math.round((tb / 4) * 0.18);
    const largeurTailleDevantPantalon = Math.round(tt / 4 + 20);
    const lignePliDevant = Math.round((largeurBassinDevant + avanceeFourcheDevant) / 2);

    const pieceDevantPantalon: PatternPieceGeometry = {
      name: 'Devant Pantalon (Costume)',
      fabricRecommendation: 'Laine froide, Gabardine ou Flanelle',
      quantity: 2,
      seamAllowanceMm: 10,
      grainline: { angleDegrees: 90, originX: lignePliDevant, originY: lg / 2 },
      notches: [
        { positionAlongEdge: 0.5, edgeIndex: 2 },
        { positionAlongEdge: 0.8, edgeIndex: 1 },
      ],
      outlineMm: [
        { x: avanceeFourcheDevant, y: 0 },
        { x: avanceeFourcheDevant + largeurTailleDevantPantalon, y: 10 },
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

    const largeurBassinDos = Math.round(tb / 4 + 10);
    const avanceeFourcheDos = Math.round((tb / 4) * 0.38);
    const largeurTailleDosPantalon = Math.round(tt / 4 + 30);
    const demiLargeurBasDos = demiLargeurBasDevant + 15;
    const lignePliDos = Math.round((largeurBassinDos + avanceeFourcheDos) / 2);
    const rehausseDos = 35;

    const pieceDosPantalon: PatternPieceGeometry = {
      name: 'Dos Pantalon (Costume)',
      fabricRecommendation: 'Laine froide, Gabardine ou Flanelle',
      quantity: 2,
      seamAllowanceMm: 10,
      grainline: { angleDegrees: 90, originX: lignePliDos, originY: lg / 2 },
      notches: [
        { positionAlongEdge: 0.5, edgeIndex: 2 },
        { positionAlongEdge: 0.8, edgeIndex: 1 },
      ],
      outlineMm: [
        { x: avanceeFourcheDos + 20, y: -rehausseDos },
        { x: avanceeFourcheDos + 20 + largeurTailleDosPantalon, y: 10 },
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

    const longueurCeinture = tt + 80;
    const hauteurCeinture = 70;
    const pieceCeinturePantalon: PatternPieceGeometry = {
      name: 'Ceinture Pantalon (Costume)',
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

    return [
      pieceDevantVeste,
      pieceDosVeste,
      pieceMancheVeste,
      pieceColVeste,
      pieceDevantPantalon,
      pieceDosPantalon,
      pieceCeinturePantalon,
    ];
  },
};
