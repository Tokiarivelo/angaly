import type {
  IPatternRule,
  MeasurementSet,
  PatternParameters,
  PatternPieceGeometry,
} from '../types';

/**
 * AUTRE — "Autre vêtement — Pièce spéciale sur cahier des charges"
 * (apps/web/src/features/pattern-studio-wizard/consts/garment-types.const.ts).
 *
 * Décision documentée (voir docs/features/patterns.md, "Points d'attention" — Option A) :
 * ce type couvre par définition une pièce arbitraire décrite par un cahier des charges libre
 * (`parameters.details`), sans forme garantie (accessoire, pièce hybride, vêtement non listé,
 * etc.). Il n'existe **aucune géométrie de construction déterministe sensée** à produire pour
 * un vêtement générique — contrairement à `COSTUME`/`ROBE_MARIEE`, il n'y a pas ici une seule
 * famille de patron reconnue à adapter.
 *
 * Avant cette règle, `ChemiseRule.appliesTo()` acceptait aussi `AUTRE` et lui présentait une
 * géométrie de chemise/blouse comme si elle avait été construite pour la demande — silencieux
 * et trompeur (un pantalon ou un accessoire recevait un patron de chemise).
 *
 * On a choisi de **ne pas** faire basculer `AUTRE` sur le statut `REVIEW_REQUIRED` en évitant
 * toute génération (option B envisagée dans la consigne) : ce statut est déjà un geste explicite
 * de l'utilisateur ("Faire vérifier mon patron par Angaly", voir `request-review.use-case.ts`
 * et spec §27) déclenché indépendamment du type de vêtement, et le shunter automatiquement ici
 * casserait le pipeline `generate-pattern-version` (qui doit toujours renvoyer une
 * `PatternVersion` avec des pièces) pour ce seul type.
 *
 * On retient donc l'**option A** : un bloc de base générique (rectangle simple, buste/taille,
 * sans col/manche/aisance spécifique à un vêtement précis) qui sert de point de départ neutre
 * — jamais présenté comme un patron "prêt à confectionner". Le contrat `IPatternRule` ne
 * permet pas à une règle d'émettre un avertissement (`PatternGenerationResult.warnings` est
 * construit par l'orchestrateur, toujours `[]`, voir `pattern-engine.ts`) ; l'avertissement
 * explicite ("base générique nécessitant une adaptation couturière") est donc ajouté au niveau
 * du use-case `generate-pattern-version.use-case.ts` (`apps/api/src/patterns/application/`),
 * qui connaît déjà le `GarmentType` demandé et écrit `parametersJson` sur la `PatternVersion` —
 * voir le champ `parametersJson.warnings` qui y est ajouté spécifiquement pour `AUTRE`, lu côté
 * `apps/web` de la même façon que `parametersJson.estimatedMeasurementKeys` l'est déjà par
 * `PatternPreviewValidationPage.tsx`.
 */
const REQUIRED_MEASUREMENTS = ['TOUR_POITRINE', 'TOUR_TAILLE', 'LONGUEUR_DOS'];

export const AutreRule: IPatternRule = {
  garmentType: 'AUTRE',
  requiredMeasurementKeys: REQUIRED_MEASUREMENTS,
  appliesTo(parameters: PatternParameters): boolean {
    return parameters.garmentType === 'AUTRE';
  },
  computePieces(
    _parameters: PatternParameters,
    measurements: MeasurementSet,
  ): PatternPieceGeometry[] {
    const tourPoitrine = measurements['TOUR_POITRINE'] ?? 90;
    const tourTaille = measurements['TOUR_TAILLE'] ?? 70;
    const longueurDos = measurements['LONGUEUR_DOS'] ?? 40;

    const tp = tourPoitrine * 10;
    const tt = tourTaille * 10;
    const lg = longueurDos * 10;

    // Bloc rectangulaire neutre : demi-largeur = le plus large de poitrine/taille + aisance
    // minimale, hauteur = torse complet approximatif. Aucune forme d'emmanchure, de col ou de
    // pince — volontairement générique, à retravailler entièrement selon le cahier des charges.
    const largeur = Math.round(Math.max(tp, tt) / 4 + 20);
    const hauteur = Math.round(lg * 2);

    const blocBaseDevant: PatternPieceGeometry = {
      name: 'Bloc de Base — Devant (générique, à adapter)',
      fabricRecommendation: null,
      quantity: 1,
      seamAllowanceMm: 10,
      grainline: { angleDegrees: 90, originX: largeur / 2, originY: hauteur / 2 },
      notches: [],
      outlineMm: [
        { x: 0, y: 0 },
        { x: largeur, y: 0 },
        { x: largeur, y: hauteur },
        { x: 0, y: hauteur },
        { x: 0, y: 0 },
      ],
    };

    const blocBaseDos: PatternPieceGeometry = {
      name: 'Bloc de Base — Dos (générique, à adapter)',
      fabricRecommendation: null,
      quantity: 1,
      seamAllowanceMm: 10,
      grainline: { angleDegrees: 90, originX: largeur / 2, originY: hauteur / 2 },
      notches: [],
      outlineMm: [
        { x: 0, y: 0 },
        { x: largeur, y: 0 },
        { x: largeur, y: hauteur },
        { x: 0, y: hauteur },
        { x: 0, y: 0 },
      ],
    };

    return [blocBaseDevant, blocBaseDos];
  },
};
