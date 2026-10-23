import type {
  IPatternRule,
  MeasurementSet,
  PatternParameters,
  PatternPieceGeometry,
} from '../types';
import {
  resolveCutProfile,
  resolveNecklineChoice,
  resolveSkirtLengthMm,
  resolveSleeve,
} from '../shared/cut-profile';
import {
  markOffShoulder,
  OFF_SHOULDER_EDGE_SEGMENTS,
  offShoulderNeckline,
  pointSkirtTop,
  pointWaist,
  WAIST_POINT_DROP_MM,
  waistPointDepthAt,
  sleevePiece,
  sweetheartNeckline,
} from '../shared/shapes';
import {
  bodiceLengthFactor,
  fitSleeve,
  fitTorsoOutline,
  hipGirthCm,
  resolveLengthMm,
  skirtFullnessExtraMm,
  withEase,
} from '../shared/fit';
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

/** Jupon : plus court que la jupe devant (mm), ampleur d'ourlet sans `fullness.skirt`, points du côté. */
const JUPON_SHORTER_MM = 30;
const JUPON_DEFAULT_FULLNESS = 2.2;
const JUPON_SIDE_POINTS = 10;
/**
 * Dôme de crinoline, mesuré sur une robe de bal vers 1860 (Met 108161, vue de face) : la largeur croît comme
 * √profondeur et atteint l'ourlet à 85 % de la longueur, puis la jupe tombe droite (cerceau du bas).
 */
const JUPON_DOME = 0.5;
const JUPON_DOME_FULL = 0.85;
/**
 * `fullness.skirt` se lit de face (largeur d'ourlet ÷ largeur de taille). Un ourlet rond est moins large, à tour égal,
 * qu'une taille ovale : tour d'ourlet = ampleur × tour de taille × 1,13 (≈ π × 0,36, largeur ÷ tour d'une taille).
 */
const JUPON_ROUND = 1.13;
/**
 * Jupe en lés froncés (`jupe: EN_LES`, robe de bal vers 1850) : 8 lés autour de la taille + 2 panneaux de traîne au
 * milieu dos, chacun froncé (plis d'orgue) sur la taille. Le haut des lés fait GORE_GATHER × la couture de taille ;
 * l'ourlet recouvre le jupon avec GORE_HEM_OVER de marge (il pèse sur lui, ne doit pas le serrer).
 */
const GORE_GATHER = 2;
const GORE_HEM_OVER = 1.45;
/** Part de la traîne que la longueur gagne à chaque couture, du côté vers le milieu dos (lé côté, côté dos, traîne). */
const GORE_TRAIN_STEPS = [0, 0.2, 0.5, 1] as const;
/** Largeur d'ourlet d'un panneau de traîne par rapport à un lé (il s'étale sur le sol). */
const TRAIN_PANEL_HEM = 1.6;
/** Ceinture intérieure d'une jupe lourde (gros-grain, cousu à la couture de taille) : hauteur, croisure (mm). */
const WAIST_STAY_MM = 30;
const WAIST_STAY_OVERLAP_MM = 40;

/** Hors épaules : le bord croise le milieu dos à cette profondeur sous la ligne d'épaule (mm). */
const OFF_SHOULDER_BACK_DEPTH_MM = 80;

type CutProfile = ReturnType<typeof withEase>;

/**
 * Hauteur verticale de la taille à l'ourlet (ce que mesure la cliente) : LONGUEUR_JUPE, sinon HAUTEUR_TAILLE_SOL
 * (robe au sol sur mesure), sinon le choix du wizard (~1000 mm au sol). La jupe est coupée plus longue de ce que le
 * jupon lui fait parcourir en plus (voir `juponProfile`).
 */
function skirtHeightMm(parameters: PatternParameters, measurements: MeasurementSet): number {
  const mesureLongueurJupe = measurements['LONGUEUR_JUPE'] ?? measurements['HAUTEUR_TAILLE_SOL'];
  return resolveLengthMm(
    mesureLongueurJupe !== undefined
      ? mesureLongueurJupe * 10
      : (resolveSkirtLengthMm(parameters.details['longueur'], measurements['STATURE']) ?? 1000),
    parameters.lengths?.skirtPct,
    [300, 1600],
  );
}

/** Largeurs des panneaux de jupe (½ devant au pli, côté, ½ dos) et évasement d'ourlet commun. */
function skirtPanelWidths(parameters: PatternParameters, tb: number, profile: CutProfile) {
  const largeurJupeDevant = tb / 4 + 20 + profile.hipDeltaMm; // Aisance légèrement plus ample pour l'ampleur bal
  return {
    largeurJupeDevant,
    largeurJupeCote: tb / 4 + profile.hipDeltaMm,
    largeurJupeDos: tb / 4 - 5 + profile.hipDeltaMm,
    flare: profile.hemFlareMm + skirtFullnessExtraMm(parameters.fullness, largeurJupeDevant),
  };
}

/** Marge : la jupe doit dépasser le tour du jupon d'au moins 5 % pour le recouvrir sans se tendre. */
export const SKIRT_OVER_JUPON_MARGIN = 0.05;

/**
 * Tour d'ourlet de la jupe (mm) pour la construction choisie, à une longueur de jupe donnée. Panneaux : devant au
 * pli, côtés et dos par paire — 2 × (devant + côté + dos) au niveau de l'ourlet devant (le dos s'y est déjà élargi
 * de 60 mm vers la traîne). Blocs : plissé = taille + plis × profondeur (× 2 en plis creux), froncé = ampleur ×
 * taille, cercle = taille + 2π × fraction × longueur.
 */
function skirtHemMm(parameters: PatternParameters, measurements: MeasurementSet, profile: CutProfile, lengthMm: number): number {
  const tourTailleJupe = (measurements['TOUR_TAILLE'] ?? 70) * 10 + 40 + 4 * profile.waistDeltaMm;
  const block = resolveDrape(parameters).skirt;
  if (!block) {
    const w = skirtPanelWidths(parameters, hipGirthCm(measurements) * 10, profile);
    return 2 * (w.largeurJupeDevant + w.largeurJupeCote + w.largeurJupeDos + 60 + 3 * w.flare);
  }
  if (block.kind === 'PLEATED_SKIRT') return tourTailleJupe + block.pleats * block.depthMm * (block.type === 'BOX' ? 2 : 1);
  if (block.kind === 'GATHERED_SKIRT') return block.fullness * tourTailleJupe;
  return tourTailleJupe + 2 * Math.PI * block.fraction * lengthMm;
}

/**
 * Jupon structurant (hypothèse 3) : il porte le volume de la jupe — une robe de bal tient sur lui, pas sur les
 * jambes. Deux pièces coupées au pli (devant, dos) : tour = 4 × la largeur de la pièce. Il s'arrête 3 cm au-dessus
 * de l'ourlet de la jupe devant, sans traîne. Son ourlet suit l'ampleur demandée (`fullness.skirt`, plafonnée à
 * 3,6, sur le tour de taille du corps — l'ampleur se lit sur la silhouette) ; une robe de bal (ampleur ≥ 2,5) a un
 * jupon en dôme (crinoline, JUPON_DOME), une ligne A un jupon droit, une sirène un fourreau jusqu'au genou.
 * Le profil est décrit en hauteur verticale ; la pièce, à plat, a la longueur de tissu le long de ce profil.
 * Partagé par `computePieces` (la pièce) et `warnings` (la jupe doit pouvoir le recouvrir).
 */
export function juponProfile(
  parameters: PatternParameters,
  measurements: MeasurementSet,
  profile: CutProfile,
  hauteurJupe: number,
): { tailleJupon: number; ourletJupon: number; hauteurJupon: number; longueurJupon: number; coteJupon: Array<{ x: number; y: number }>; tourOurletMm: number } {
  const tt = (measurements['TOUR_TAILLE'] ?? 70) * 10;
  const tb = hipGirthCm(measurements) * 10;
  const tourTailleJupe = tt + 40 + 4 * profile.waistDeltaMm;
  const ampleurDemandee = parameters.fullness?.skirt;
  // 1 (ou rien) = valeur neutre, comme pour `skirtFullnessExtraMm`.
  const ampleurJupon = ampleurDemandee !== undefined && ampleurDemandee > 1 ? Math.min(3.6, ampleurDemandee) : JUPON_DEFAULT_FULLNESS;
  const hauteurJupon = hauteurJupe - JUPON_SHORTER_MM;
  const tailleJupon = Math.round(tourTailleJupe / 4);
  const hancheJupon = Math.round(tb / 4 + 10);
  // Sans ampleur demandée, le jupon par défaut ne dépasse pas ce que la jupe peut recouvrir (une jupe droite a un
  // jupon droit) ; une ampleur demandée est gardée — `warnings` signale alors une jupe trop étroite.
  const ourletVoulu = (ampleurJupon * tt * JUPON_ROUND) / 4;
  const ourletCouvert = ampleurDemandee !== undefined && ampleurDemandee > 1
    ? ourletVoulu
    : Math.min(ourletVoulu, skirtHemMm(parameters, measurements, profile, hauteurJupe) / (4 * (1 + SKIRT_OVER_JUPON_MARGIN)));
  const ourletJupon = Math.round(Math.max(hancheJupon, ourletCouvert));
  const domeJupon = ampleurJupon >= 2.5;
  /** Largeur de la pièce (¼ du tour) à une profondeur verticale v sous la taille. */
  const quartJupon = (v: number): number => {
    const t = v / hauteurJupon;
    if (profile.fishtail) {
      const knee = 0.55 * hauteurJupon;
      if (v <= 200) return tailleJupon + ((hancheJupon - tailleJupon) * v) / 200;
      if (v <= knee) return hancheJupon * (1 - (0.05 * (v - 200)) / Math.max(1, knee - 200));
      return 0.95 * hancheJupon + ((Math.max(hancheJupon, ourletJupon) - 0.95 * hancheJupon) * (v - knee)) / (hauteurJupon - knee);
    }
    const x = tailleJupon + (ourletJupon - tailleJupon) * Math.pow(domeJupon ? Math.min(1, t / JUPON_DOME_FULL) : t, domeJupon ? JUPON_DOME : 1);
    // Jamais plus étroit que les hanches à leur hauteur (~200 mm sous la taille) ni en dessous.
    return v >= 200 ? Math.max(x, hancheJupon) : x;
  };
  // Longueur de tissu le long du profil : rayon = 4 × quart ÷ 2π.
  const pasJupon = hauteurJupon / 200;
  const arcJupon = [0];
  for (let i = 1; i <= 200; i += 1) {
    const dr = ((quartJupon(i * pasJupon) - quartJupon((i - 1) * pasJupon)) * 4) / (2 * Math.PI);
    arcJupon.push(arcJupon[i - 1]! + Math.hypot(pasJupon, dr));
  }
  const coteJupon = Array.from({ length: JUPON_SIDE_POINTS }, (_, i) => {
    const k = Math.round(((i + 1) * 200) / JUPON_SIDE_POINTS);
    return { x: Math.round(quartJupon(k * pasJupon)), y: Math.round(arcJupon[k]!) };
  });
  return {
    tailleJupon,
    ourletJupon,
    hauteurJupon,
    longueurJupon: Math.round(arcJupon[200]!),
    coteJupon,
    tourOurletMm: 4 * Math.round(quartJupon(hauteurJupon)),
  };
}

/** Tour d'ourlet de la jupe (mm, à sa longueur réelle, dôme compris) et du jupon qu'elle recouvre. */
export function skirtHemVsJupon(
  parameters: PatternParameters,
  measurements: MeasurementSet,
): { skirtHemMm: number; juponHemMm: number } {
  const profile = withEase(resolveCutProfile(parameters.cutType), parameters.ease);
  const hauteurJupe = skirtHeightMm(parameters, measurements);
  const jupon = juponProfile(parameters, measurements, profile, hauteurJupe);
  const longueurJupe = hauteurJupe + (jupon.longueurJupon - jupon.hauteurJupon);
  return { skirtHemMm: Math.round(skirtHemMm(parameters, measurements, profile, longueurJupe)), juponHemMm: jupon.tourOurletMm };
}

/** Avertissement « jupe plus étroite que son jupon », avec ce qu'il faudrait pour le recouvrir ; null sinon. */
function skirtOverJuponWarning(parameters: PatternParameters, measurements: MeasurementSet): string | null {
  const { skirtHemMm, juponHemMm } = skirtHemVsJupon(parameters, measurements);
  const neededMm = juponHemMm * (1 + SKIRT_OVER_JUPON_MARGIN);
  // Moins d'un demi-centimètre : arrondi du millimètre des pièces, pas un défaut.
  if (skirtHemMm + 5 >= neededMm) return null;
  const cm = (mm: number) => Math.round(mm / 10);
  const block = resolveDrape(parameters).skirt;
  const missingMm = neededMm - skirtHemMm;
  let suggestion: string;
  if (block?.kind === 'PLEATED_SKIRT') {
    const perPleat = block.type === 'BOX' ? 2 : 1;
    const pleats = Math.max(block.pleats, 1);
    const depthMm = Math.ceil((block.depthMm + missingMm / (pleats * perPleat)) / 5) * 5;
    suggestion = depthMm <= 80
      ? `Prévoir au moins ${pleats} plis de ${depthMm} mm`
      : `Prévoir au moins ${Math.ceil((neededMm - (skirtHemMm - pleats * block.depthMm * perPleat)) / (80 * perPleat))} plis de 80 mm`;
  } else if (block?.kind === 'GATHERED_SKIRT') {
    suggestion = `Prévoir une ampleur de fronces d'au moins ${(Math.ceil((block.fullness * neededMm) / skirtHemMm * 10) / 10).toFixed(1).replace('.', ',')}`;
  } else if (block?.kind === 'CIRCLE_SKIRT') {
    suggestion = 'Prévoir une jupe plus évasée (demi-cercle ou cercle complet)';
  } else {
    suggestion = `Prévoir ${cm(missingMm)} cm d'évasement en plus à l'ourlet (coupe plus évasée)`;
  }
  return (
    `Jupe plus étroite que son jupon (${cm(skirtHemMm)} cm d'ourlet pour ${cm(juponHemMm)} cm) : elle ne peut pas le recouvrir. ` +
    (parameters.fullness?.skirt !== undefined && parameters.fullness.skirt > 1
      ? `${suggestion}, ou réduire l'ampleur du jupon (\`fullness.skirt\`).`
      : `${suggestion} (le jupon tient au moins le tour de hanches).`)
  );
}

/**
 * Lés froncés d'une demi-jupe, du milieu devant au milieu dos : Devant, Côté Devant, Côté (devant), Côté Dos, puis le
 * panneau de traîne (milieu dos). Chaque pièce a x = 0 du côté de son centre (milieu devant pour les lés devant, milieu
 * dos pour les lés dos) ; les deux bords d'une couture ont la même longueur (l'ourlet monte en pente vers la traîne).
 */
export function goredBallSkirt(
  tourTailleJupe: number,
  longueurDevant: number,
  traine: number,
  ourletJuponMm: number,
  /** Taille en pointe : demi-largeur de la pointe du bustier à la taille (mm) et sa profondeur ; absent : taille droite. */
  point?: { halfWidthMm: number; dropMm: number },
): PatternPieceGeometry[] {
  const panels = 10; // 8 lés + 2 panneaux de traîne
  const top = Math.round((GORE_GATHER * tourTailleJupe) / panels);
  const hemTotal = Math.max(ourletJuponMm * GORE_HEM_OVER, GORE_GATHER * tourTailleJupe * 1.3);
  // Les 2 panneaux de traîne comptent pour TRAIN_PANEL_HEM lés chacun à l'ourlet.
  const hem = Math.round(hemTotal / (8 + 2 * TRAIN_PANEL_HEM));
  const len = (k: number) => Math.round(longueurDevant + GORE_TRAIN_STEPS[k]! * traine);
  const fabric = 'Taffetas de soie, Duchesse ou Mikado (extérieur)';
  // Sous une taille en pointe, le haut des lés devant suit la pointe sur toute sa largeur froncée (GORE_GATHER × la
  // demi-pointe du bustier) : le lé milieu devant et ses voisins descendent ensemble, chaque couture garde sa longueur.
  const pointSpan = point ? GORE_GATHER * point.halfWidthMm : 0;
  const dipAt = (d: number) => (point && d < pointSpan ? Math.round(waistPointDepthAt(d / pointSpan, point.dropMm)) : 0);
  let offset = 0;
  const topEdge = (width: number, front: boolean): Array<{ x: number; y: number }> => {
    const start = offset;
    if (front) offset += width;
    if (!front || start >= pointSpan) return [{ x: 0, y: 0 }, { x: width, y: 0 }];
    const xs = new Set<number>([0, width]);
    for (const u of [0.25, 0.5, 0.75, 1]) {
      const x = Math.round(u * pointSpan - start);
      if (x > 0 && x < width) xs.add(x);
    }
    return [...xs].sort((a, b) => a - b).map((x) => ({ x, y: dipAt(start + x) }));
  };
  const gore = (name: string, width: number, hemWidth: number, innerLen: number, outerLen: number, front: boolean): PatternPieceGeometry => {
    const top = topEdge(width, front);
    return {
      name,
      fabricRecommendation: fabric,
      quantity: 2,
      seamAllowanceMm: 10,
      grainline: { angleDegrees: 90, originX: Math.round(width / 2), originY: Math.round(Math.min(innerLen, outerLen) / 2) },
      // Repères de fronces : le haut se fronce (plis d'orgue) sur la couture de taille.
      notches: [
        { positionAlongEdge: 0, edgeIndex: 0 },
        { positionAlongEdge: 1, edgeIndex: top.length - 2 },
      ],
      outlineMm: [...top, { x: hemWidth, y: outerLen }, { x: 0, y: innerLen }, { ...top[0]! }],
    };
  };
  return [
    gore('Jupe Devant (lé froncé)', top, hem, len(0), len(0), true),
    gore('Jupe Côté Devant (lé froncé)', top, hem, len(0), len(0), true),
    gore('Jupe Côté (lé froncé)', top, hem, len(0), len(1), true),
    gore('Jupe Côté Dos (lé froncé)', top, hem, len(2), len(1), false),
    gore('Jupe Dos — panneau de traîne (froncé)', top, Math.round(hem * TRAIN_PANEL_HEM), len(3), len(2), false),
  ];
}

export const RobeMarieeRule: IPatternRule = {
  garmentType: 'ROBE_MARIEE',
  requiredMeasurementKeys: REQUIRED_MEASUREMENTS,
  appliesTo(parameters: PatternParameters): boolean {
    return parameters.garmentType === 'ROBE_MARIEE';
  },
  warnings(parameters: PatternParameters, measurements: MeasurementSet): string[] {
    const drape = resolveDrape(parameters);
    const notes: string[] = [];
    const tooNarrow = skirtOverJuponWarning(parameters, measurements);
    if (tooNarrow) notes.push(tooNarrow);
    if (drape.skirt) {
      notes.push(
        drape.train
          ? 'Bloc de jupe sur robe de mariée : le jupon structurant est ajouté sous le bloc.'
          : 'Bloc de jupe sur robe de mariée : pas de traîne (ajoutez un bloc Traîne) ; le jupon structurant est ajouté sous le bloc.',
      );
    }
    if (drape.hem && drape.skirt?.kind === 'CIRCLE_SKIRT') {
      notes.push("Ourlet asymétrique ignoré : le bord d'une jupe cercle est un arc, il ne se décale pas.");
    }
    return notes;
  },
  computePieces(
    parameters: PatternParameters,
    measurements: MeasurementSet,
  ): PatternPieceGeometry[] {
    const tourPoitrine = measurements['TOUR_POITRINE'] ?? 90;
    const tourTaille = measurements['TOUR_TAILLE'] ?? 70;
    const tourBassin = hipGirthCm(measurements);
    const longueurDos = measurements['LONGUEUR_DOS'] ?? 40;
    const longueurTraine = measurements['LONGUEUR_TRAINE'] ?? 90; // 90cm de traîne par défaut

    const tp = tourPoitrine * 10;
    const tt = tourTaille * 10;
    const tb = tourBassin * 10;
    const lgDos = Math.round(longueurDos * 10 * bodiceLengthFactor(parameters.lengths));
    const drape = resolveDrape(parameters);
    // Un bloc TRAIN fixe la longueur de traîne (prioritaire sur LONGUEUR_TRAINE).
    const traine = drape.train ? drape.train.lengthMm : longueurTraine * 10;

    // Choix du wizard (voir shared/cut-profile.ts) : DROITE = construction historique de la règle.
    const profile = withEase(resolveCutProfile(parameters.cutType), parameters.ease);
    const neck = resolveNecklineChoice(parameters.details);
    // Manche longue à la longueur du bras mesurée (LONGUEUR_BRAS), comme la robe.
    const armMm = measurements['LONGUEUR_BRAS'] !== undefined ? measurements['LONGUEUR_BRAS'] * 10 : undefined;
    const sleeve = fitSleeve(resolveSleeve(parameters.details['manches'], armMm), parameters, armMm);

    // Bustier structuré — aisance minimale (~5mm), maintien par la structure/baleinage.
    // L'écart de coupe se répartit entre devant (60 %), côté (40 %) et dos (100 %).
    const largeurBustierDevant = Math.round(tp / 4 * 0.55 + 5 + profile.bodiceDeltaMm * 0.6);
    const largeurBustierCote = Math.round(tp / 4 * 0.35 + 5 + profile.bodiceDeltaMm * 0.4);
    const largeurTailleDevant = Math.round(tt / 4 * 0.55 + 5 + profile.waistDeltaMm * 0.6);
    const largeurTailleCote = Math.round(tt / 4 * 0.35 + 5 + profile.waistDeltaMm * 0.4);
    const hauteurBustierDevant = lgDos + 30;

    const largeurBustierDos = Math.round(tp / 4 - 15 + profile.bodiceDeltaMm);
    const largeurTailleDos = Math.round(tt / 4 - 15 + profile.waistDeltaMm);
    const hauteurBustierDos = lgDos;

    const hauteurJupe = skirtHeightMm(parameters, measurements);
    const tourTailleJupe = tt + 40 + 4 * profile.waistDeltaMm;
    const { tailleJupon, hauteurJupon, longueurJupon, coteJupon, tourOurletMm: ourletJupon } = juponProfile(parameters, measurements, profile, hauteurJupe);
    const jupon: PatternPieceGeometry = {
      name: 'Jupon / Doublure Jupe',
      fabricRecommendation: 'Tulle rigide ou taffetas de doublure',
      quantity: 2, // Devant et dos, coupés au pli
      seamAllowanceMm: 10,
      grainline: {
        angleDegrees: 90,
        originX: Math.round(tailleJupon / 2),
        originY: Math.round(longueurJupon / 2),
      },
      notches: [],
      outlineMm: [{ x: 0, y: 0 }, { x: tailleJupon, y: 0 }, ...coteJupon, { x: 0, y: longueurJupon }, { x: 0, y: 0 }],
    };
    // La jupe passe par-dessus le jupon : elle est coupée plus longue de ce qu'il ajoute à la verticale (un dôme de
    // robe de bal : plusieurs centimètres), sinon son ourlet remonte au-dessus du sol et le jupon dépasse dessous.
    const longueurJupeDevant = hauteurJupe + (longueurJupon - hauteurJupon);
    const longueurJupeDos = longueurJupeDevant + traine;
    const { largeurJupeDevant, largeurJupeCote, largeurJupeDos, flare } = skirtPanelWidths(parameters, tb, profile);
    // Sirène : le fourreau reste près du corps jusqu'au genou avant de s'évaser.
    const kneePoint = (width: number, length: number) =>
      profile.fishtail ? [{ x: width * 0.9, y: length * 0.55 }] : [];

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
        { x: 0, y: neck?.depthMm ?? 0 },
        { x: neck ? neck.widthMm + 10 : 90, y: -20 }, // Bord de bustier (décolleté cœur/bustier droit)
        { x: largeurBustierDevant, y: 30 },
        { x: largeurBustierDevant, y: hauteurBustierDevant },
        { x: largeurTailleDevant, y: hauteurBustierDevant },
        { x: 0, y: hauteurBustierDevant },
        { x: 0, y: neck?.depthMm ?? 0 },
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
        ...kneePoint(largeurJupeDevant, longueurJupeDevant),
        { x: largeurJupeDevant + flare, y: longueurJupeDevant },
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
        // Panneau côté : l'ourlet descend en pente de la longueur devant (bord cousu à la jupe devant, x = 0)
        // à la longueur dos+traîne (bord cousu à la jupe dos) — chaque couture a la longueur de sa voisine.
        ...kneePoint(largeurJupeCote, longueurJupeDevant),
        { x: largeurJupeCote + flare, y: longueurJupeDos },
        { x: 0, y: longueurJupeDevant },
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
        ...kneePoint(largeurJupeDos, longueurJupeDevant),
        { x: largeurJupeDos + 60 + flare, y: longueurJupeDevant }, // Élargissement progressif vers la traîne
        { x: largeurJupeDos + 120 + flare, y: longueurJupeDos }, // Pointe de traîne
        { x: 0, y: longueurJupeDos },
        { x: 0, y: 0 },
      ],
    };

    // Pince de poitrine sur la couture côté du bustier (seulement dépend des mesures de poitrine).
    const bustMeasures = Object.fromEntries(
      ['TOUR_POITRINE', 'TOUR_HAUT_POITRINE', 'TOUR_SOUS_POITRINE', 'HAUTEUR_POITRINE', 'ECARTEMENT_POINTS_POITRINE']
        .filter((k) => measurements[k] !== undefined)
        .map((k) => [k, measurements[k] as number]),
    );
    bustierDevant.outlineMm = fitTorsoOutline(bustierDevant.outlineMm, bustMeasures, {
      side: 'front',
      neckWidthMm: neck?.widthMm ?? 80,
      dartSegmentIdx: 2,
    });
    // Décolleté cœur : le bord du bustier s'arrondit sur la poitrine (après la pince, qui compte les points).
    if (neck?.shape === 'SWEETHEART') bustierDevant.outlineMm = sweetheartNeckline(bustierDevant.outlineMm);
    // Taille en pointe : le bustier devant descend en pointe au milieu devant, la jupe devant suit (un bloc de jupe
    // garde son bord droit : il est froncé / plissé le long de la pointe).
    const pointe = parameters.details['taille']?.toUpperCase() === 'POINTE';
    if (pointe) {
      bustierDevant.outlineMm = pointWaist(bustierDevant.outlineMm, WAIST_POINT_DROP_MM);
      jupeDevant.outlineMm = pointSkirtTop(jupeDevant.outlineMm, WAIST_POINT_DROP_MM);
    }
    // Hors épaules : le haut du bustier devient un seul bord, du milieu devant jusqu'à l'emmanchure sur le haut du bras
    // (plus de couture d'épaule) ; le côté continue le bord du devant, le dos le reprend au milieu dos.
    const offShoulder = neck?.shape === 'OFF_SHOULDER';
    const armDrop = neck?.armDropMm ?? 0;
    if (offShoulder) {
      bustierDevant.outlineMm = offShoulderNeckline(bustierDevant.outlineMm, 2, neck!.depthMm, armDrop);
      const seamY = bustierDevant.outlineMm[OFF_SHOULDER_EDGE_SEGMENTS]!.y;
      bustierCote.outlineMm = offShoulderNeckline(bustierCote.outlineMm, 2, seamY - bustierCote.outlineMm[1]!.y, armDrop);
      bustierDos.outlineMm = offShoulderNeckline(bustierDos.outlineMm, 2, OFF_SHOULDER_BACK_DEPTH_MM, armDrop);
    }

    // Blocs de drapé (S4). Un bloc de jupe remplace tous les panneaux de jupe (la traîne n'y est pas
    // incluse — elle viendra d'un bloc dédié, voir warnings) ; le portefeuille croise le bustier ;
    // le col bénitier ajoute une pièce taillée dans le biais.
    // Jupe en lés froncés (robe de bal) : 8 lés + 2 panneaux de traîne, à la place des 3 panneaux. Un bloc de jupe
    // l'emporte (il remplace tous les panneaux).
    const enLes = !drape.skirt && parameters.details['jupe']?.toUpperCase() === 'EN_LES';
    // Demi-largeur de la pointe : le bas du bustier devant (au pli), là où `pointWaist` la fait partir.
    // `pointWaist` met un point à mi-largeur juste avant la pointe (x = 0, le plus bas) : la pointe fait deux fois sa largeur.
    const bas = bustierDevant.outlineMm.reduce((best, p, i) => (p.x === 0 && p.y > bustierDevant.outlineMm[best]!.y ? i : best), 0);
    const pointHalf = 2 * (bustierDevant.outlineMm[bas - 1]?.x ?? largeurTailleDevant / 2);
    const panneaux = enLes
      ? goredBallSkirt(tourTailleJupe, longueurJupeDevant, traine, ourletJupon, pointe ? { halfWidthMm: pointHalf, dropMm: WAIST_POINT_DROP_MM } : undefined)
      : [jupeDevant, jupeCote, jupeDosTraine];
    let pieces: PatternPieceGeometry[] = [
      bustierDevant,
      bustierCote,
      bustierDos,
      ...(drape.skirt
        ? [...buildSkirtBlock(drape.skirt, tourTailleJupe, longueurJupeDevant, 'Duchesse, Mikado ou Organza'), jupon]
        : [...panneaux, jupon]),
    ];
    // Une jupe froncée lourde (lés, ou bloc froncé / plissé) pend d'une ceinture intérieure en gros-grain cousue à la
    // taille : elle porte le poids, le bustier baleiné ne se déforme pas.
    if (enLes || drape.skirt?.kind === 'GATHERED_SKIRT' || drape.skirt?.kind === 'PLEATED_SKIRT') {
      pieces.push({
        name: 'Ceinture intérieure (gros-grain)',
        fabricRecommendation: 'Gros-grain de coton ou de soie, 30 mm',
        quantity: 1,
        seamAllowanceMm: 0,
        grainline: { angleDegrees: 0, originX: Math.round(tt / 2), originY: WAIST_STAY_MM / 2 },
        notches: [],
        outlineMm: [
          { x: 0, y: 0 },
          { x: Math.round(tt + WAIST_STAY_OVERLAP_MM), y: 0 },
          { x: Math.round(tt + WAIST_STAY_OVERLAP_MM), y: WAIST_STAY_MM },
          { x: 0, y: WAIST_STAY_MM },
          { x: 0, y: 0 },
        ],
      });
    }
    if (drape.wrap) pieces = wrapFrontPiece(pieces, 'Bustier Devant (Princesse)', drape.wrap);
    if (drape.bodice) pieces = drapeBodicePiece(pieces, 'Bustier Devant (Princesse)', drape.bodice);
    if (drape.hem) pieces = asymmetricHemPieces(pieces, ['Jupe'], drape.hem);
    if (drape.cowl) pieces.push(computeCowlNeck(neck?.widthMm ?? 80, drape.cowl.depthMm));
    if (drape.overskirt) pieces.push(buildOverskirtPiece(drape.overskirt, tt + 40 + 4 * profile.waistDeltaMm, longueurJupeDevant));
    // With a skirt block the built-in train is gone: a TRAIN block adds it back as its own piece.
    if (drape.train && drape.skirt) pieces.push(buildTrainPiece(drape.train, Math.max(500, Math.round(2 * (largeurJupeDos + flare)))));
    if (sleeve) {
      pieces.push(sleevePiece('Manche', tp, sleeve, 'Dentelle, Organza ou Mikado', 10, measurements));
    }
    return offShoulder ? markOffShoulder(pieces, armDrop) : pieces;
  },
};
