# Feature — `pattern-engine`

**Statut : ✅ Fait.** Phase 4 — Premium (Angaly Pattern Studio).

## Objet

Module NestJS interne qui **expose** l'orchestrateur `IPatternEngine`/`IPatternRule` de
`@angaly/pattern-engine` (déterministe, sans dépendance externe — voir ADR-005 dans
`docs/architecture.md` et `.cursor/rules/007-pattern-engine.mdc`). Son rôle se limite à :
enregistrer une `IPatternRule` par `GarmentType` au démarrage, valider que les
`PatternParameters` reçus correspondent à une règle enregistrée et que les mesures requises
sont présentes, puis renvoyer un `PatternPieceGeometry[]`. **Ce module ne possède aucun modèle
Prisma en propre** et ne construit jamais lui-même de géométrie — toute la logique de
construction vit dans les fichiers `*.rule.ts` de `packages/pattern-engine/src/rules/`.

Ce module est appelé exclusivement par le use-case `generate-pattern-version` du module
`patterns` (voir `docs/features/patterns.md`, section « Points d'intégration ») : la classe
`PatternEngineService` documentée dans `patterns/infrastructure/services/pattern-engine.service.ts`
est le client interne (injection Nest) de ce module — `patterns` ne doit jamais importer
`@angaly/pattern-engine` directement, uniquement le service exporté par `pattern-engine`.

## Emplacement Clean Architecture

`apps/api/src/pattern-engine/`

```
domain/
  ports/pattern-generation.port.ts   → IPatternGenerationPort (entrée PatternParameters + MeasurementSet,
                                        sortie PatternGenerationResult) — réexporte les types de
                                        @angaly/pattern-engine (package pur, zéro Prisma/NestJS, donc
                                        compatible avec la contrainte « Domain sans dépendance externe »)
application/
  use-cases/
    generate-pattern-pieces.use-case.ts → résout la IPatternRule via le GarmentType, appelle
                                           IPatternEngine.generate(), traduit PatternEngineValidationError
                                           en erreur applicative (mesures manquantes listées)
infrastructure/
  providers/pattern-engine.provider.ts → factory NestJS : instancie PatternEngine et enregistre
                                          chaque IPatternRule concrète (packages/pattern-engine/src/rules/*)
                                          via registerRule() au bootstrap du module
  registry/garment-rule-registry.ts    → table GarmentType → IPatternRule effectivement enregistrées,
                                          utilisée pour un rejet explicite si aucune règle n'existe
                                          encore pour un GarmentType donné
presentation/
  (aucun controller — module interne, pas de surface HTTP publique ; exposé uniquement via
   les exports du module Nest, consommés en injection de dépendance par `patterns`)
__tests__/
  unit/generate-pattern-pieces.use-case.spec.ts → avec une IPatternRule stub, indépendante des
                                                   règles concrètes (même principe que
                                                   packages/pattern-engine/src/__tests__/pattern-engine.test.ts)
```

## Modèles Prisma

Aucun modèle dédié. Le module lit implicitement des `PatternParameters`/`MeasurementSet` déjà
résolus par `patterns` (lui-même lisant `PatternProject`/`MeasurementProfile` via le module
`measurements`) — `pattern-engine` ne fait jamais de requête Prisma.

## Cas d'usage clés

- Résoudre la `IPatternRule` correspondant au `GarmentType` d'un `PatternProject`
- Valider la présence de toutes les `requiredMeasurementKeys` de la règle avant tout calcul
- Générer un `PatternGenerationResult` (`pieces: PatternPieceGeometry[]`, `warnings`,
  `metadata.engineVersion`) que `patterns` persiste en `PatternVersion`/`PatternPiece`
- Rejeter explicitement (sans deviner de valeur par défaut) un `GarmentType` sans règle
  enregistrée ou des mesures manquantes, via `PatternEngineValidationError`

## Endpoints exposés

Aucun endpoint HTTP — module strictement interne à `apps/api`, exposé uniquement via les
exports NestJS (`PatternEngineModule`) et consommé en injection de dépendance par le module
`patterns`. Aucun autre module ni contrôleur ne doit l'importer directement.

## Points d'intégration

- **`packages/pattern-engine`** : dépendance directe et unique importeur autorisé côté
  `apps/api` — voir `.cursor/rules/007-pattern-engine.mdc` (« nouvelle règle → nouveau fichier
  dans `packages/pattern-engine/src/rules/`, jamais un `switch` géant »).
- **`patterns`** : seul consommateur autorisé, via `generate-pattern-version` (cross-référence
  `docs/features/patterns.md`, « Points d'intégration ») — reçoit des `PatternParameters` déjà
  confirmés par l'utilisateur/la couturière, jamais une suggestion `ai-inference` brute. Depuis
  le 2026-09-14, `generate-pattern-version` ne fournit plus jamais de mesures par défaut codées
  en dur : à la première `PatternEngineValidationError` (clés manquantes), il appelle
  `EstimateMissingMeasurementsUseCase` (`ai-inference`) puis relance une seule fois — ce module
  continue de rejeter explicitement si les clés manquent toujours, conformément à la règle
  ci-dessous.
- **`ai-inference`** : aucune dépendance, directe ou indirecte — ce module ne reçoit et ne
  connaît jamais de `PatternAiSuggestionResponse`. C'est `patterns` qui arbitre entre suggestion
  IA et confirmation utilisateur avant de transmettre des `PatternParameters` figés ici (ADR-005).

## Points d'attention

- Aucun contrôleur en dehors de `patterns` ne doit importer ce module — l'encapsulation est
  assurée par les `exports` du `PatternEngineModule` NestJS (n'exporter que le provider
  nécessaire à `generate-pattern-pieces`, pas l'accès brut à `IPatternEngine`).
- `PatternEngineValidationError` est une erreur du package pur (`packages/pattern-engine`),
  sans notion HTTP — c'est au use-case `generate-pattern-version` de `patterns` de la traduire
  en réponse HTTP (ex. 422 avec la liste `missingMeasurementKeys`), jamais à ce module.
- Une règle absente pour un `GarmentType` donné doit produire une erreur claire et
  actionnable, jamais un plantage silencieux ou une géométrie approximative. Les 8
  `GarmentType` ont désormais chacun leur `IPatternRule` dédiée (session 2026-09-21 — voir
  `packages/pattern-engine/src/rules/README.md` pour le tableau de couverture et
  `docs/features/patterns.md` pour le détail du bug corrigé) ; chaque `appliesTo()` ne matche
  plus que son propre `GarmentType`, plus aucune règle ne sert de filet de repli permissif
  pour un type voisin.
- CLAUDE.md règle 18 autorise désormais, en politique, qu'un modèle IA produise directement
  de la géométrie (voir `docs/architecture.md` ADR-005) ; un premier prototype de recherche
  existe (`docs/features/ai-model-settings.md`, entraîné sur des échantillons réels de ce
  module via `packages/pattern-engine/scripts/generate-training-data.js`) mais n'est **pas**
  branché ici — ce module reste, en pratique, la seule source de géométrie effectivement
  utilisée en production.

## Vérification

- [x] `generate-pattern-pieces` testé avec une `IPatternRule` stub (succès, mesures manquantes, `GarmentType` sans règle enregistrée)
- [x] Au moins un test d'intégration avec une règle concrète une fois `pattern-engine-rule` utilisé pour en scaffolder une (cf. `docs/features/patterns.md`)
- [x] Aucun import de `@angaly/pattern-engine` détecté en dehors de `apps/api/src/pattern-engine/` (vérification statique/lint)
- [x] `docs/checklist-implementation.md` : `pattern-engine` passé à ✅

## Choix de design → géométrie (2026-10-07)

Avant cette date, `ROBE` et `JUPE` ignoraient `cutType` et `details` : tous les patrons étaient identiques.
`src/shared/cut-profile.ts` (fonctions pures) traduit désormais les choix du wizard en nombres :

| Choix | Effet |
| --- | --- |
| `cutType` (DROITE, EVASEE, SIRENE, PRINCESSE, AJUSTEE, OVERSIZE) | aisance buste/taille/bassin (écart par rapport à DROITE), évasement de l'ourlet, point de genou « sirène » ; coupe inconnue = DROITE |
| `details.longueur` (MINI, MIDI, MAXI, SOL, ASYMETRIQUE) | longueur taille→ourlet de la jupe |
| `details.decollete` / `details.col` | profondeur et largeur de l'encolure devant (`decollete` prime sur `col`) |
| `details.manches` | pièce `Manche` (courtes, 3/4, longues, ballon, papillon) ; aucune pièce si absent ou `SANS_MANCHES` |

Le corsage de la robe suit maintenant la taille (couture côté buste → taille).

### Extension aux autres vêtements (2026-10-07)

| Vêtement | Coupe | Détails pris en compte |
| --- | --- | --- |
| `CHEMISE`, `VESTE`, `COSTUME` (veste) | aisance buste/taille, léger évasement du bas | `longueur` (×0,8 → ×1,8), `col`/`decollete` (encolure devant/dos), `manches` (longueur et ampleur de la pièce, aucune manche si `SANS_MANCHES`) ; pièce **Col** retirée pour col rond/V/bateau/sans col ; **Poignet** (chemise) retiré sans manche, manches courtes ou papillon |
| `PANTALON`, `COSTUME` (pantalon) | forme de jambe : ajustée 80 → droite 100 → évasée 125 (genou plus étroit que l'ourlet) → sirène → princesse 140 → oversize 150 mm de demi-ourlet, aisance bassin/taille ; mots-clés SLIM / PALAZZO conservés | `longueur` : mini (short ×0,45), midi (pantacourt ×0,75), maxi, sol |
| `ROBE_MARIEE` | aisance bustier (devant 60 % / côté 40 % / dos 100 %), jupe : hanches + évasement de l'ourlet, point de genou pour la sirène | `longueur` (jupe devant), `col`/`decollete` (décolleté du bustier), `manches` (pièce Manche optionnelle) |

Une coupe inconnue ou absente donne exactement la géométrie historique (testé pour chaque règle). Les profils et
helpers sont dans `shared/cut-profile.ts` ; les formes réutilisées (jupe, manche) dans `shared/shapes.ts`.


## Paramètres étendus : aisance, ampleur, longueurs (Phase 5b S1 — contrat uniquement)

`PatternParameters` accepte désormais, **tous optionnels** (absent = géométrie historique à
l'identique) :

| Paramètre | Valeurs / bornes | Pas | Défaut |
|-----------|------------------|-----|--------|
| `ease` | `AJUSTE` \| `CONFORT` \| `AMPLE` | — | `CONFORT` (= géométrie actuelle) |
| `fullness.skirt` | 1 – 4 (ratio de tissu / largeur finie) | 0,25 | selon la coupe |
| `fullness.sleeve` | 1 – 2,5 | 0,25 | selon le détail `manches` |
| `lengths.skirtPct` | 40 – 130 (% de la longueur de référence) | 1 | 100 |
| `lengths.sleevePct` | 0 – 100 (0 = sans manches) | 1 | 100 |
| `lengths.bodicePct` | 80 – 120 | 1 | 100 |

- Source des bornes : `packages/types/src/pattern-fit.ts` (`validatePatternExtParameters`) —
  **rejet** (jamais de clamp silencieux) des valeurs hors bornes ou mal typées ; arrondi au pas.
- Stockage : colonne `pattern_projects.parametersExtJson` (migration additive
  `20261008130000_add_pattern_project_parameters_ext`), `PATCH /api/pattern-projects/:id` →
  400 « Paramètres étendus invalides » ; `{}` ou `null` = retour aux défauts. Revalidé à la
  génération et enregistré dans `parametersJson.parameters`.
- Le moteur n'importe pas `@angaly/types` ; les types sont recopiés structurellement dans `types.ts`.

## Aisance, proportions et mesures dans les règles (Phase 5b S2, engine `0.2.0-fit`)

Code : `src/shared/fit.ts` (+ `geometry-checks.ts`). Principe : **chaque paramètre absent ou neutre
(`CONFORT`, 100 %, ampleur 1) reproduit la géométrie historique au millimètre.**

**Aisance** — `delta_final = delta_coupe + delta_aisance` (mm par quart de corps ; la coupe donne la
silhouette, l'aisance le confort) :

| `ease` | poitrine | taille | bassin | emmanchure |
|--------|----------|--------|--------|------------|
| `AJUSTE` | −20 | −15 | −15 | −10 |
| `CONFORT` | 0 | 0 | 0 | 0 |
| `AMPLE` | +30 | +25 | +30 | +15 |

Appliquée à robe, jupe, pantalon, veste, chemise, costume (veste + pantalon), robe de mariée et
« autre » (largeur du bloc, poitrine seulement). Test de monotonie AJUSTE < CONFORT < AMPLE sur les 8.

**Longueurs / ampleur**
- `lengths.skirtPct` : longueur de jupe (robe, jupe, mariée), bornée 300–1500 mm (1600 mariée).
- `fullness.skirt` : largeur d'ourlet ajoutée = `(ampleur − 1) × largeur de hanche du panneau`
  (1 = rien ; s'ajoute à l'évasement de la coupe).
- `lengths.sleevePct` (0 = pas de manche, ni poignet) et `fullness.sleeve` (× largeur de tête de manche).
- `lengths.bodicePct` : hauteur du corsage / longueur de veste, chemise, costume.

**Mesures consommées** (si présentes ; sinon comportement historique — `shared/fit.ts`) :

| Mesure(s) | Effet | Vêtements |
|-----------|-------|-----------|
| `LONGUEUR_JUPE` | longueur de jupe (prioritaire sur le détail `longueur`) | jupe, robe, mariée |
| `HAUTEUR_TAILLE_SOL` | longueur de jupe de la robe de mariée (sans `LONGUEUR_JUPE`) | mariée |
| `HAUTEUR_BASSIN` | ligne de bassin de la jupe | jupe |
| `LONGUEUR_DEVANT` | hauteur du corsage devant | robe |
| `CARRURE_DEVANT` / `CARRURE_DOS` (sinon `LARGEUR_EPAULE`) | pointe d'épaule : ½ carrure (ou col + épaule), bornée à [col + 40 mm ; défaut + 30 mm] | robe, veste, chemise, costume |
| `PROFONDEUR_EMMANCHURE` | hauteur du dessous de bras (+ 20 mm), bornée | veste, chemise, costume |
| `TOUR_SOUS_POITRINE` + `TOUR_POITRINE`, `HAUTEUR_POITRINE`, `ECARTEMENT_POINTS_POITRINE` | **pince de poitrine** sur la couture côté du devant : prise = 5 mm par cm d'écart au-delà de 12 cm (max 60 mm), à la hauteur de poitrine, pointant à ½ écart du milieu devant ; aucune pince si l'écart est trop faible | robe, veste, chemise, costume, mariée (bustier) |
| `TOUR_BRAS`, `TOUR_POIGNET` | manche jamais plus étroite que le bras (+ 6 cm) ni que le poignet (+ 3 cm) | toutes les manches |
| `TOUR_EMMANCHURE` | hauteur de tête de manche = emmanchure / 3 (100–220 mm) | toutes les manches |
| `TOUR_COU` | longueur du col = tour de cou + 2 cm | chemise, veste, costume |
| `TOUR_CUISSE` | élargit la ligne de bassin (devant + dos) si la cuisse estimée serait trop serrée (+ 6 cm d'aisance) | pantalon, costume |
| `TOUR_GENOU`, `TOUR_CHEVILLE` | largeurs minimales de genou / bas de jambe (+ 4 cm d'aisance) | pantalon, costume |
| `HAUTEUR_FOURCHE` | hauteur de fourche | pantalon, costume |
| `HAUTEUR_TAILLE_GENOU` | hauteur du genou (bornée entre fourche et ourlet) | pantalon, costume |
| `HAUTEUR_ENTREJAMBE` | longueur totale = fourche + entrejambe, si ni `LONGUEUR_JAMBE` ni `LONGUEUR_PANTALON` | pantalon, costume |
| `LONGUEUR_JAMBE`, `LONGUEUR_BRAS`, `LONGUEUR_TRAINE` | déjà utilisées | pantalon/costume, manches, mariée |

Limites assumées : les blocs restent des constructions simplifiées (pas d'emmanchure courbe sculptée) ;
la pince de poitrine est un coin sur la couture côté, pas un dessin de pince pivotée. Un test garantit que
**chaque mesure du catalogue est lue par une règle** (`apps/api/.../pattern-fit.spec.ts`).

**Garde-fous** — `PatternEngine.generate()` renvoie maintenant `warnings[]` : contour non fermé,
coordonnées non finies, surface < 25 cm², contour auto-sécant. Un test balaie vêtement × coupe × aisance
(avec ampleur et longueurs extrêmes) et exige zéro avertissement. Les règles peuvent aussi émettre leurs propres
avertissements (`IPatternRule.warnings?`) : `AutreRule` signale le bloc de base générique (l'API ne l'ajoute plus).

## Blocs de drapé déterministes (Phase 5b S4, engine `0.3.0-drape`)

Code : `packages/pattern-engine/src/blocks/` (fonctions pures : tour de taille / longueur / paramètres →
pièces fermées en mm). Entrée : `parameters.drape = { blocks: [...] }` (stocké dans
`pattern_projects.parametersExtJson.drape`, validé par `validatePatternExtParameters`). **Absent = géométrie
historique à l'identique** (test bit à bit).

| Bloc | Paramètres (bornes) | Formule | Pièces |
|------|---------------------|---------|--------|
| `GATHERED_SKIRT` | `fullness` 1,25–4 (pas 0,25) | largeur de coupe totale = taille × ampleur, 2 panneaux ; repères de fronces aux ¼, ½, ¾ | « Jupe froncée (panneau) » ×2 |
| `PLEATED_SKIRT` | `pleats` 4–60, `depthMm` 10–80, `type` KNIFE\|BOX | largeur = taille + plis × extra ; extra = `depthMm` (plat) ou 2 × `depthMm` (creux) ; 1 repère par pli et par panneau | « Jupe plissée … (panneau) » ×2 |
| `CIRCLE_SKIRT` | `fraction` 0,25 \| 0,5 \| 1 | secteur annulaire, rayon intérieur `r = taille / (2π × fraction)`, rayon extérieur `r + longueur` ; arcs échantillonnés à 65 points ; le cercle complet est livré en 2 demi-pièces | quart / demi / « cercle (demi-pièce) » ×2 |
| `WRAP_FRONT` | `overlapMm` 40–250, `side` LEFT\|RIGHT | le devant (coupé au pli) devient « dessus croisé » (milieu devant décalé de `overlapMm`, repères de fermeture à 20 % / 80 %) + « dessous croisé » (35 % du croisement) | remplace Corsage Devant / Bustier Devant / Devant (jupe) |
| `COWL_NECK` | `depthMm` 60–300 | trapèze taillé **dans le biais** (fil à 45°) : haut = ouverture d'encolure, bas = haut + 1,2 × profondeur, hauteur = profondeur + 12 cm | « Col bénitier (taillé dans le biais) » |

Règles d'intégration (`jupe`, `robe`, `robe-mariee`) :
- un **bloc de jupe** remplace les panneaux de jupe ; le tour de taille utilisé = tour de taille + 4 cm +
  4 × delta de taille (donc il suit la coupe et l'aisance), la longueur = longueur de jupe résolue
  (`LONGUEUR_JUPE`, détail `longueur`, `lengths.skirtPct`) ;
- **mariée** : un bloc de jupe remplace jupe devant/côté/dos **et jupon** ; la traîne n'est pas incluse
  (avertissement, bloc dédié prévu en S5) ;
- **jupe** : `WRAP_FRONT` + bloc de jupe → le portefeuille est ignoré (avertissement) ;
- au plus un bloc par type et un seul bloc de jupe (sinon rejet 400 au PATCH) ; 3 blocs maximum.

**Métrage indicatif** — `metadata.yardage = { fabricWidthMm: 1400, lengthMm, method }` pour **toute**
génération : somme des encombrements (marges de couture incluses) × quantité ÷ laize 140 cm, +12 % de chutes,
arrondi à 5 cm. Une pièce qu'aucune orientation ne permet de placer dans la laize déclenche
« tissu d'au moins N cm de large requis ». Indicatif seulement : la couturière confirme.

Limites : pas encore de sélection de bloc par l'IA ni d'écran de choix (S5) ; l'export PDF/SVG de l'API est
encore un gabarit (`export-pattern-version.use-case.ts`), donc l'export des pièces de blocs n'est pas testé de
bout en bout — l'aperçu web et les tests moteur valident la fermeture, l'absence d'auto-intersection et la
symétrie des contours.
