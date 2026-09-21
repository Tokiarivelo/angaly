import type {
  IPatternRule,
  MeasurementSet,
  PatternParameters,
  PatternPieceGeometry,
} from '../types';

/**
 * ROBE_MARIEE — construction dédiée, distincte de `robe.rule.ts`.
 *
 * Avant cette règle, `RobeRule.appliesTo()` acceptait aussi `ROBE_MARIEE` et lui appliquait
 * exactement la même géométrie qu'une robe de jour/cocktail — ignorant les particularités
 * structurelles d'une robe de mariée (voir docs/features/patterns.md, "Points d'attention").
 *
 * Hypothèses de patronage retenues ici (la spec §19-24 ne détaille pas la construction
 * bustier/traîne au niveau patronage — jugement de patronage documenté, comme pour
 * `robe.rule.ts`) :
 *
 * 1. **Aisance quasi nulle au buste/taille** — un bustier de mariée est structuré
 *    (baleinage, doublure rigide) : contrairement à une robe de jour (+20mm d'aisance dans
 *    `robe.rule.ts`), le maintien vient de la structure et non du tombé du tissu. On réduit
 *    donc l'aisance à ~5mm pour éviter tout bâillement, et on ajoute une **découpe princesse
 *    latérale** (panneau supplémentaire devant/côté) absente de la robe standard : c'est la
 *    construction classique d'un bustier de mariée (3 panneaux devant/côté/dos plutôt que
 *    2 pièces devant/dos).
 * 2. **Traîne** — la jupe dos est significativement plus longue que la jupe devant (ici
 *    +900mm par défaut, `LONGUEUR_TRAINE` si fournie), alors que `robe.rule.ts` utilise la
 *    même longueur devant/dos. La jupe devant elle-même est déjà plus longue qu'une robe
 *    standard (jusqu'au sol, ~1000mm vs 650mm) car une robe de mariée n'est normalement pas
 *    portée à mi-mollet.
 * 3. **Jupe doublée** — ajout d'une pièce "Jupon / Doublure Jupe" distincte, une robe de
 *    mariée nécessite quasi systématiquement un jupon structurant que `robe.rule.ts` ne
 *    prévoit pas.
 */
const REQUIRED_MEASUREMENTS = ['TOUR_POITRINE', 'TOUR_TAILLE', 'TOUR_BASSIN', 'LONGUEUR_DOS'];

export const RobeMarieeRule: IPatternRule = {
  garmentType: 'ROBE_MARIEE',
  requiredMeasurementKeys: REQUIRED_MEASUREMENTS,
  appliesTo(parameters: PatternParameters): boolean {
    return parameters.garmentType === 'ROBE_MARIEE';
  },
  computePieces(
    _parameters: PatternParameters,
    measurements: MeasurementSet,
  ): PatternPieceGeometry[] {
    const tourPoitrine = measurements['TOUR_POITRINE'] ?? 90;
    const tourTaille = measurements['TOUR_TAILLE'] ?? 70;
    const tourBassin = measurements['TOUR_BASSIN'] ?? 95;
    const longueurDos = measurements['LONGUEUR_DOS'] ?? 40;
    const longueurTraine = measurements['LONGUEUR_TRAINE'] ?? 90; // 90cm de traîne par défaut

    const tp = tourPoitrine * 10;
    const tt = tourTaille * 10;
    const tb = tourBassin * 10;
    const lgDos = longueurDos * 10;
    const traine = longueurTraine * 10;

    // Bustier structuré — aisance minimale (~5mm), maintien par la structure/baleinage.
    const largeurBustierDevant = Math.round(tp / 4 * 0.55 + 5);
    const largeurBustierCote = Math.round(tp / 4 * 0.35 + 5);
    const largeurTailleDevant = Math.round(tt / 4 * 0.55 + 5);
    const largeurTailleCote = Math.round(tt / 4 * 0.35 + 5);
    const hauteurBustierDevant = lgDos + 30;

    const largeurBustierDos = Math.round(tp / 4 - 15);
    const largeurTailleDos = Math.round(tt / 4 - 15);
    const hauteurBustierDos = lgDos;

    // Jupe devant : longueur au sol (~1000mm), jupe dos : jupe devant + traîne.
    const longueurJupeDevant = 1000;
    const longueurJupeDos = longueurJupeDevant + traine;
    const largeurJupeDevant = tb / 4 + 20; // Aisance légèrement plus ample pour l'ampleur bal
    const largeurJupeCote = tb / 4;
    const largeurJupeDos = tb / 4 - 5;

    const bustierDevant: PatternPieceGeometry = {
      name: 'Bustier Devant (Princesse)',
      fabricRecommendation: 'Duchesse, Mikado ou Satin structuré',
      quantity: 1, // Coupé au pli
      seamAllowanceMm: 10,
      grainline: {
        angleDegrees: 90,
        originX: largeurBustierDevant / 2,
        originY: hauteurBustierDevant / 2,
      },
      notches: [{ positionAlongEdge: 0.5, edgeIndex: 1 }],
      outlineMm: [
        { x: 0, y: 0 },
        { x: 90, y: -20 }, // Bord de bustier (décolleté cœur/bustier droit)
        { x: largeurBustierDevant, y: 30 },
        { x: largeurBustierDevant, y: hauteurBustierDevant },
        { x: largeurTailleDevant, y: hauteurBustierDevant },
        { x: 0, y: hauteurBustierDevant },
        { x: 0, y: 0 },
      ],
    };

    const bustierCote: PatternPieceGeometry = {
      name: 'Bustier Côté (Découpe Princesse)',
      fabricRecommendation: 'Duchesse, Mikado ou Satin structuré',
      quantity: 2,
      seamAllowanceMm: 10,
      grainline: {
        angleDegrees: 90,
        originX: largeurBustierCote / 2,
        originY: hauteurBustierDevant / 2,
      },
      notches: [
        { positionAlongEdge: 0.5, edgeIndex: 1 },
        { positionAlongEdge: 0.5, edgeIndex: 3 },
      ],
      outlineMm: [
        { x: 0, y: 20 },
        { x: largeurBustierCote - 25, y: 0 }, // Emmanchure/aisselle
        { x: largeurBustierCote, y: 35 },
        { x: largeurBustierCote, y: hauteurBustierDevant },
        { x: largeurTailleCote, y: hauteurBustierDevant },
        { x: 0, y: hauteurBustierDevant },
        { x: 0, y: 20 },
      ],
    };

    const bustierDos: PatternPieceGeometry = {
      name: 'Bustier Dos (Lacage)',
      fabricRecommendation: 'Duchesse, Mikado ou Satin structuré',
      quantity: 2, // Couture milieu dos — lacage/zip de mariée
      seamAllowanceMm: 10,
      grainline: {
        angleDegrees: 90,
        originX: largeurBustierDos / 2,
        originY: hauteurBustierDos / 2,
      },
      notches: [{ positionAlongEdge: 0.5, edgeIndex: 1 }],
      outlineMm: [
        { x: 0, y: 0 },
        { x: 70, y: -10 },
        { x: largeurBustierDos, y: 30 },
        { x: largeurBustierDos, y: hauteurBustierDos },
        { x: largeurTailleDos, y: hauteurBustierDos },
        { x: 0, y: hauteurBustierDos },
        { x: 0, y: 0 },
      ],
    };

    const jupeDevant: PatternPieceGeometry = {
      name: 'Jupe Devant',
      fabricRecommendation: 'Tulle, Organza ou Mikado (extérieur)',
      quantity: 1,
      seamAllowanceMm: 10,
      grainline: {
        angleDegrees: 90,
        originX: largeurJupeDevant / 2,
        originY: longueurJupeDevant / 2,
      },
      notches: [],
      outlineMm: [
        { x: 0, y: 0 },
        { x: largeurTailleDevant, y: 10 },
        { x: largeurJupeDevant, y: 260 },
        { x: largeurJupeDevant, y: longueurJupeDevant },
        { x: 0, y: longueurJupeDevant },
        { x: 0, y: 0 },
      ],
    };

    const jupeCote: PatternPieceGeometry = {
      name: 'Jupe Côté',
      fabricRecommendation: 'Tulle, Organza ou Mikado (extérieur)',
      quantity: 2,
      seamAllowanceMm: 10,
      grainline: {
        angleDegrees: 90,
        originX: largeurJupeCote / 2,
        originY: ((longueurJupeDevant + longueurJupeDos) / 2) / 2,
      },
      notches: [],
      outlineMm: [
        { x: 0, y: 0 },
        { x: largeurTailleCote, y: 10 },
        { x: largeurJupeCote, y: 260 },
        // Panneau côté : chute progressive de la longueur devant vers la longueur dos+traîne
        { x: largeurJupeCote, y: (longueurJupeDevant + longueurJupeDos) / 2 },
        { x: 0, y: (longueurJupeDevant + longueurJupeDos) / 2 },
        { x: 0, y: 0 },
      ],
    };

    // Jupe dos avec traîne : la longueur dépasse largement la jupe devant (voir hypothèse 2).
    const jupeDosTraine: PatternPieceGeometry = {
      name: 'Jupe Dos avec Traîne',
      fabricRecommendation: 'Tulle, Organza ou Mikado (extérieur)',
      quantity: 2, // Couture milieu dos
      seamAllowanceMm: 10,
      grainline: {
        angleDegrees: 90,
        originX: largeurJupeDos / 2,
        originY: longueurJupeDos / 2,
      },
      notches: [{ positionAlongEdge: 0.95, edgeIndex: 2 }], // Repère début de traîne
      outlineMm: [
        { x: 0, y: 0 },
        { x: largeurTailleDos, y: 10 },
        { x: largeurJupeDos, y: 260 },
        { x: largeurJupeDos + 60, y: longueurJupeDevant }, // Élargissement progressif vers la traîne
        { x: largeurJupeDos + 120, y: longueurJupeDos }, // Pointe de traîne
        { x: 0, y: longueurJupeDos },
        { x: 0, y: 0 },
      ],
    };

    const jupon: PatternPieceGeometry = {
      name: 'Jupon / Doublure Jupe',
      fabricRecommendation: 'Tulle rigide ou taffetas de doublure',
      quantity: 1,
      seamAllowanceMm: 10,
      grainline: {
        angleDegrees: 90,
        originX: (largeurJupeDevant + largeurJupeDos) / 2 / 2,
        originY: longueurJupeDevant / 2,
      },
      notches: [],
      outlineMm: [
        { x: 0, y: 0 },
        { x: (largeurTailleDevant + largeurTailleDos) / 2, y: 10 },
        { x: (largeurJupeDevant + largeurJupeDos) / 2, y: 260 },
        // Le jupon structurant reste à la longueur de la jupe devant (pas de traîne doublée)
        { x: (largeurJupeDevant + largeurJupeDos) / 2, y: longueurJupeDevant },
        { x: 0, y: longueurJupeDevant },
        { x: 0, y: 0 },
      ],
    };

    return [bustierDevant, bustierCote, bustierDos, jupeDevant, jupeCote, jupeDosTraine, jupon];
  },
};
