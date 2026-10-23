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
| `CHEMISE`, `VESTE`, `COSTUME` (veste) | aisance buste/taille, léger évasement du bas | `longueur` (×0,8 → ×1,8), `col`/`decollete` (encolure devant/dos), `manches` (longueur et ampleur de la pièce, aucune manche si `SANS_MANCHES`) ; pièce **Col** retirée pour col rond/V/bateau/sans col ; `col = CHALE` : la veste (et la veste du costume) prend le `Col châle` de `collarPiece` (col et revers d'une pièce, nuque → bas du revers) au lieu du `Col Tailleur` (2026-10-16, `isShawl`) ; **Poignet** (chemise) retiré sans manche, manches courtes ou papillon |
| `PANTALON`, `COSTUME` (pantalon) | forme de jambe (tour genou / tour ourlet, 2026-10-20) : droite 47/43 cm, ajustée (slim) 41/35, évasée (bootcut) 43/52, sirène (pattes d'éléphant) 41/69 ajustée au genou, princesse (palazzo) ≈ 72/72 large dès la hanche, oversize (baggy) 68/55 resserré à la cheville ; aisance bassin/taille ; mots-clés libres SLIM, BOOTCUT, PATTE/ELEPHANT/BELL, PALAZZO/LARGE, BAGGY renvoient à ces formes. Ligne du genou : `trouserKneeMm` (mesurée, sinon 47 % de la jambe entière sous la fourche, quelle que soit la longueur coupée) | `longueur` : mini (short ×0,45), midi (pantacourt ×0,75), maxi, sol |
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
| `lengths.sleevePct` | 0 – 100 (0 = sans manches, % du **bras entier** : 100 = poignet, 25 ≈ manche courte) | 1 | 100 |
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
« autre » (largeur du bloc, poitrine seulement). Test de monotonie AJUSTE < CONFORT < AMPLE sur les 8 (en tissu
`STRETCH`, voir ci-dessous).

**Aisance minimale de porter (robe, 2026-10-15)** — les deltas sont *par quart* : ils comptent quatre fois au tour.
Une robe PRINCESSE (taille −15) en `AJUSTE` (taille −15) sortait 12 cm sous le tour de taille et 8 cm sous la
poitrine : un velours qui ne ferme pas, et une jupe en A dont la droite partait de cette taille trop étroite et passait
pile sur le bassin (elle collait aux hanches et aux fesses avant de s'évaser : une sirène). Désormais, en tissu tissé,
le tour de la robe ne descend jamais sous `corps + MIN_WEARING_EASE_MM` (`shared/fit.ts` : poitrine +20, taille +20,
bassin +10 mm au tour, soit l'aisance propre de DROITE + CONFORT, dont la géométrie ne change donc pas) :
`floorQuarters` élargit devant et dos d'autant. `PatternParameters.fabric` (`FLUIDE`/`STRUCTURE`/`RIGIDE`/`STRETCH`,
renseigné par l'API depuis `profile.fit.fabricBehavior`) : `STRETCH` n'a pas de plancher.

**Longueurs / ampleur**
- `lengths.skirtPct` : longueur de jupe (robe, jupe, mariée), bornée 300–1500 mm (1600 mariée).
- `fullness.skirt` : largeur d'ourlet ajoutée = `(ampleur − 1) × largeur de hanche du panneau`
  (1 = rien ; s'ajoute à l'évasement de la coupe).
- `lengths.sleevePct` (0 = pas de manche, ni poignet ; sinon longueur = % de `LONGUEUR_BRAS`, 59 cm par défaut — corrigé le 2026-10-14, avant c'était un % de la longueur du préréglage) et `fullness.sleeve` (× largeur de tête de manche ; pour `CLOCHE` il ouvre l'ourlet).
- Robe-manteau (`devant = MANTEAU_OUVERT`) : devants coupés hors pliure, ouverture de 45 mm (col) → 25 mm (taille) → 150 mm (ourlet) par demi-devant (`openCentreFront`), pièce `Plastron (sous-robe)` ; `fermeture = CORDELIERE` ajoute la `Cordelière`. `fermeture = CEINTURE_NOUEE` ajoute `Ceinture`, `Nœud (boucles)`, `Nœud (milieu)`, `Pans du nœud` (`beltPieces`). La robe-manteau a ses parementures (`facingPiece` : bord d'ouverture du corsage et de la jupe, encolure dos, 60 mm). Manches `BALLON` / `EVEQUE` jusqu'au poignet : `Poignet` ×2 (`cuffPiece`, 35 mm fini, manche raccourcie d'autant). Gigot très ample : coude plafonné à 1,15 × la manche standard (`GIGOT_ELBOW_FIT`) et ventre arrondi (`GIGOT_ROUND_*`), 2026-10-14. `devant = MANTEAU_REVERS` ajoute « Revers » ×2 ; `jupe = EN_LES` coupe chaque demi-jupe en panneau + côté (`goreSplit`, `shared/panels.ts`) et lui donne la ligne en **cloche** des jupes à lés 1890 (`skirtOutline(…, bell)`, `GORED_BELL` 0,65 : x = taille + (ourlet − taille) · t^0,65, mesuré sur la planche de la robe-manteau : au cinquième de la longueur, 35 % de l'écart taille → ourlet ; 2026-10-15) ; gigot long en deux pièces (`twoPieceSleeve`) ; jupe évasée en A dès la taille (point de hanche jamais à l'intérieur de la droite taille → ourlet). Cols de robe : `collarPiece` (officier, chemise, lavallière, châle). **Forme d'encolure** (2026-10-15) : `Neckline.shape` (`ROUND` par défaut, `V` pour `col = EN_V` et `decollete = PLONGEANT`, `SQUARE` pour `decollete = CARRE`, `SWEETHEART` pour `decollete = COEUR` — 2026-10-16 : `sweetheartNeckline`, lobe qui part à la verticale de la pointe du milieu devant, s'arrondit à plat au-dessus de la poitrine (à 55 % de la largeur, mi-profondeur), puis remonte en bord de bretelle jusqu'au point d'encolure ; appliqué au corsage de robe et au haut du bustier de la mariée) ; `curveNeckline` n'arrondit que les encolures rondes (un V reste droit, un carré garde son angle) ; `decollete` donne la taille, la forme vient du décolleté sinon du col (un V a sa propre échelle de profondeur sous `decollete` : `SAGE` 10 cm, `MOYEN` 13 cm, `V_DEPTH_MM` ; avant, `EN_V` + `MOYEN` devenait une encolure ronde de 8 cm).
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
| `TOUR_HAUT_POITRINE` (sinon `TOUR_SOUS_POITRINE`) + `TOUR_POITRINE`, `HAUTEUR_POITRINE`, `ECARTEMENT_POINTS_POITRINE` | **pince de poitrine** sur la couture côté du devant (`bustDartIntakeMm`) : avec le haut de poitrine, 12 mm par cm d'écart poitrine − haut de poitrine au-delà de 2,5 cm (bonnet B = bloc de base) ; sinon 5 mm par cm d'écart poitrine − sous-poitrine au-delà de 12 cm ; max 60 mm, à la hauteur de poitrine, pointant à ½ écart du milieu devant ; aucune pince si l'écart est trop faible | robe, veste, chemise, costume, mariée (bustier) |
| `TOUR_BRAS`, `TOUR_POIGNET` | manche jamais plus étroite que le bras (+ 6 cm) ni que le poignet (+ 3 cm) | toutes les manches |
| `TOUR_EMMANCHURE` | hauteur de tête de manche = emmanchure / 3 (100–220 mm) | toutes les manches |
| `TOUR_COU` | longueur du col = tour de cou + 2 cm | chemise, veste, costume |
| `TOUR_CUISSE` | élargit la ligne de bassin (devant + dos) si la cuisse estimée serait trop serrée (+ 6 cm d'aisance) | pantalon, costume |
| `TOUR_GENOU`, `TOUR_CHEVILLE` | largeurs minimales de genou / bas de jambe (+ 4 cm d'aisance) | pantalon, costume |
| `HAUTEUR_FOURCHE` | hauteur de fourche | pantalon, costume |
| `HAUTEUR_TAILLE_GENOU` | hauteur du genou (bornée entre fourche et ourlet) ; sans elle, 47 % de la jambe entière sous la fourche (`trouserKneeMm`) | pantalon, costume |
| `HAUTEUR_ENTREJAMBE` | longueur totale = fourche + entrejambe, si ni `LONGUEUR_JAMBE` ni `LONGUEUR_PANTALON` | pantalon, costume |
| `LONGUEUR_JAMBE`, `LONGUEUR_BRAS`, `LONGUEUR_TRAINE` | déjà utilisées | pantalon/costume, manches, mariée |
| `TOUR_HANCHE_COMPLET` | tour de hanches passant aussi sur le ventre : le moteur prend le plus grand de `TOUR_BASSIN` et de celui-ci (`hipGirthCm`) | jupe, robe, mariée, pantalon, costume |
| `STATURE` | les longueurs du détail `longueur` (jupe, robe, mariée) suivent la stature : × stature / 168 cm, borné à ±25 % (`resolveSkirtLengthMm`) | jupe, robe, mariée |

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
- **mariée** : un bloc de jupe remplace jupe devant/côté/dos, **le jupon reste** (2026-10-16 : une robe de bal tient
  sur lui) ; la traîne vient d'un bloc `TRAIN` (avertissement sinon) ;
- **jupon de la mariée** (2026-10-16, `robe-mariee.rule.ts`) : « Jupon / Doublure Jupe » ×2 coupé au pli (tour = 4 ×
  largeur), 3 cm plus court que la jupe devant. Ourlet = `fullness.skirt` (défaut 2,2, plafond 3,6) × tour de taille du
  corps × `JUPON_ROUND` 1,13 (un ourlet rond est moins large de face qu'une taille ovale de même rapport). Ampleur ≥ 2,5 :
  dôme de crinoline (`JUPON_DOME` 0,5, pleine largeur à `JUPON_DOME_FULL` 85 % de la hauteur — mesuré sur Met 108161) ;
  sinon ligne A ; sirène : fourreau jusqu'au genou. Le profil est tracé en hauteur verticale, la pièce a la longueur de
  tissu le long du profil, et **la jupe est coupée plus longue d'autant** (sinon son ourlet remonte au-dessus du sol) ;
  calcul partagé par la pièce et l'avertissement (`juponProfile`) ;
- **jupe plus étroite que son jupon** (2026-10-16) : `skirtHemVsJupon` compare le tour d'ourlet de la jupe (panneaux :
  2 × (devant + côté + dos + 60 + 3 × évasement) ; plissé : taille + plis × profondeur, × 2 en plis creux ; froncé :
  ampleur × taille ; cercle : taille + 2π × fraction × longueur) à celui du jupon. En dessous de jupon × 1,05
  (`SKIRT_OVER_JUPON_MARGIN`), `warnings` signale « Jupe plus étroite que son jupon (… cm d'ourlet pour … cm) » avec une
  correction chiffrée (plis × profondeur, ampleur de fronces, coupe plus évasée). **Sans `fullness.skirt`**, le jupon
  par défaut (2,2) est plafonné à ce que la jupe recouvre (une coupe droite a un jupon droit, jamais sous les hanches) ;
  une ampleur demandée est gardée et c'est elle que l'avertissement vise. Côté lecture IA, `cover_petticoat`
  (`garment_knowledge.py`) élargit un bloc froncé / plissé de mariée trop étroit pour son `fullness.skirt` (taille de
  référence 74 cm) ;
- **panneau côté de la mariée** : ourlet en pente de la longueur devant (x = 0) à la longueur dos + traîne ;
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

## Blocs de drapé avancés — lot 2 (Phase 5b S5, engine `0.4.0-drape-advanced`)

| Bloc | Paramètres (bornes) | Construction | Pièces / effet |
|------|---------------------|--------------|----------------|
| `TRAIN` | `lengthMm` 200–1200 (pas 10) | demi-ellipse suspendue à un bord droit (largeur d'attache = ourlet dos, ≥ 50 cm), 33 points | « Traîne (demi-ellipse) » ; sur la **robe de mariée sans bloc de jupe**, il fixe la longueur de la traîne existante (prioritaire sur `LONGUEUR_TRAINE`) |
| `OVERSKIRT` | `lengthPct` 50–100, `side` | panneau asymétrique : haut = 60 % de la taille, bas = 1,8 × le haut, coin haut de l'ourlet à 70 % | « Surjupe asymétrique (gauche/droite) » |
| `DRAPED_BODICE` | `pleats` 3–12, `side` | +18 mm de tissu par pli sur la couture côté du devant + un repère par pli | devant du corsage / bustier (et ses variantes croisées) renommé « — drapé (plis à …) » |
| `ASYMMETRIC_HEM` | `dropMm` 100–500 (pas 10), `side` | l'ourlet s'allonge linéairement du milieu (0) vers le côté (`dropMm`), bande de 10 % du bas seulement | panneaux de jupe ; **ignoré** (avertissement) pour une jupe cercle |

Manches ballon / papillon : ce ne sont **pas** des blocs — ce sont les détails `manches = BALLON | PAPILLON`, réglés par
`fullness.sleeve` (S2). Familles de manches (`SleeveSpec.kind`, `shared/shapes.ts`) : manche montée à tête courbe en S
(`COURTES`, `TROIS_QUARTS`, `LONGUES`, `CAP`), gigot (`BALLON`, ventre à 18 %, coude ≥ 50 % du haut), `EVEQUE` (ample, froncée
dans un poignet), `CLOCHE` (ajustée au coude puis évasée ; `fullness.sleeve` ouvre l'ourlet), `LANTERNE` (froncée en haut et
au poignet), `RAGLAN` (couture diagonale du col), `KIMONO` (pente d'épaule, sans emmanchure marquée). Applicabilité par vêtement (`DRAPE_BLOCKS_BY_GARMENT`) : jupe = froncée, plissée, cercle,
portefeuille, traîne, surjupe, ourlet ; robe et robe de mariée = les 9 blocs ; les autres vêtements aucun.
Jusqu'à 6 blocs ; un bloc de jupe max ; un bloc par type. Une liste **vide explicite** (`{ blocks: [] }`) est un
choix valide (« aucun bloc ») qui l'emporte sur une suggestion de la photo.

### Arbre de décision « meilleure approche » (`apps/api/.../construction-approach.ts`)

| Méthode de construction (photo) | Blocs appliqués | Approche | Pièces plates |
|---------------------------------|-----------------|----------|---------------|
| `DRAPING` (sari, lamba, drapé grec) | aucun (jamais) | `MANNEQUIN_ONLY` | doublure / bloc de base seulement + avertissement « moulage requis » + fiche |
| `MIXED` (base ajustée + drapé libre) | oui ou non | `FLAT_BASE_PLUS_MANNEQUIN` | base + blocs réguliers + fiche pour la partie libre |
| `FLAT_PATTERN` ou inconnue | oui | `FLAT_WITH_BLOCKS` | patron complet avec blocs |
| `FLAT_PATTERN` ou inconnue | non | `FLAT_FULL` | patron complet |

Enregistré dans `parametersJson.constructionApproach` (+ `constructionApproachReason`). Table de vérité testée.

### Fiche de moulage (`mannequin-sheet.ts`)
Générée seulement pour `MANNEQUIN_ONLY` / `FLAT_BASE_PLUS_MANNEQUIN`, stockée dans `parametersJson.mannequinSheet`,
affichée sur la page d'aperçu. **Cinq sections obligatoires** : zones à draper, sens du fil, quantité de tissu estimée,
étapes d'épinglage, précautions. Contenu **déterministe** (règles + `constructionNotes` de la photo, déjà validées à 400
caractères) : aucune phrase libre d'un modèle n'atteint la fiche. Bornes : 700 caractères par section, 3500 au total.
Quantité de tissu : métrage indicatif du patron plat (`metadata.yardage`) + 40 % (mixte) ou × 1,6 (drapé intégral).
> Écart avec le plan : le plan prévoyait un texte généré par l'IA puis validé ; la version livrée est déterministe
> (traçable, sans coût ni hallucination). Un enrichissement par IA reste possible plus tard, derrière la même validation.

## Options et mesures ajoutées d'après un concepteur en ligne (2026-10-16)

Relevé fait sur des pages Sewist enregistrées (étapes du concepteur de robe : coupe, longueur, emmanchure, encolure,
col, fermeture, silhouette, bas, pinces, manches). Seuls les **faits** (quelles options et mesures existent) ont été
repris ; aucun dessin ni texte n'a été copié. Le site refuse la lecture automatique (403).

- Mesures : `TOUR_HAUT_POITRINE` (pince de poitrine), `TOUR_HANCHE_COMPLET` (hanches + ventre), `STATURE` (longueurs).
- `longueur: GENOU` (600 mm taille → ourlet ; haut ×1,05 ; pantalon bermuda ×0,6). `MIDI` devient « mi-mollet ».
- `decollete: EN_U` (95 × 160 mm, forme ronde : plus creusée qu'une encolure ronde).
- `decollete: HORS_EPAULES` (2026-10-16, bardot) : `Neckline.shape = 'OFF_SHOULDER'`, `depthMm` 130 (milieu devant sous la
  ligne d'épaule, même échelle que `MOYEN` 8 cm / `EN_U` 16 cm, mesuré contre la 3D sur Met 108161), `armDropMm` 50 (bord à
  l'emmanchure sous le point d'épaule). `shapes.offShoulderNeckline(outline, tipIdx, depth, drop)` remplace encolure +
  couture d'épaule par un bord continu (horizontal au milieu, qui remonte doucement vers les bras, emmanchure gardée ≥ 60 mm
  au-dessus du dessous de bras) : corsage devant / dos de la robe (dos à 80 mm), bustier devant / côté (qui reprend le bord du
  devant à la couture) / dos de la mariée. `markOffShoulder` (en dernier) suffixe les pièces de corsage et les manches
  « (hors épaules) » et coupe la tête de manche droit 50 mm sous son sommet (`offShoulderSleeve`) ; pas de pièce col.
  3D (`garment-model.ts`) : `isOffShoulder` (nom) → pas de `restOnShoulders` (le bord reste où le patron le met, sur le haut
  des bras et de la poitrine), haut de manche abaissé de `OFF_SHOULDER_SLEEVE_DROP` 5 cm. Test `garment3dOffShoulder`.
- `fermeture: ZIP_DEVANT`, `BOUTONS_TAILLE` (informatifs, comme les autres fermetures).
- Non repris (pas encore de géométrie) : encolures festonnées, Sabrina, trapèze, fer à cheval, trou de serrure ;
  bas arrondi aux coutures côté ; choix de pinces (emmanchure, sans pinces de dos) ; silhouettes tente et chemise ;
  manches par huitièmes (couvertes par `lengths.sleevePct`), manche à poignet plissé ou à fente.

## Bas du corps : hauteur de taille, ceinture, fermeture, plis, poches, bas, fente (2026-10-20)

Module partagé `shared/bottoms.ts` (pur, mm), lu par `PantalonRule`, `JupeRule` et le pantalon du costume (`draftTrousers`,
pièces suffixées « (Costume) »). Groupes de `@angaly/types` (`PATTERN_DETAIL_OPTIONS`) et liste par vêtement
`DETAIL_GROUPS_BY_GARMENT` (`pattern-detail-groups.ts`, partagée par l'assistant et l'API : l'IA n'est interrogée que sur
les groupes du vêtement).

| Groupe | Options | Effet |
|---|---|---|
| `taille` (pantalon, jupe) | `NATURELLE`, `HAUTE` (+40 mm), `BASSE` (−40 mm) | bord haut au-dessus / au-dessous de la taille naturelle (y = 0 sur la pièce), tour au bord haut (`topGirthMm`), ligne `WAIST` tracée dans la pièce (la 3D s'y cale) |
| `ceinture` | `DROITE` 40 mm, `FORMEE` 50 mm galbée (4 pièces), `ELASTIQUEE`, `COULISSE` (+ « Cordon de serrage »), `SANS` (« Parementure de taille ») | pièce « Ceinture » (dessinée en 3D), longueur = tour + 8 cm ; à enfiler = tour de bassin + 4 cm |
| `fermeture` | pantalon : `BRAGUETTE_ZIP` (défaut), `BRAGUETTE_BOUTONS`, `ZIP_COTE`, `ELASTIQUE` ; jupe : `ZIP_INVISIBLE` (défaut), `ZIP_COTE`, `BOUTONS`, `ELASTIQUE` | braguette : « Parementure de braguette » + « Sous-patte de braguette » ; `ELASTIQUE` force une ceinture élastiquée |
| `plis` | `AUCUN`, `PINCES`, `UN_PLI`, `DEUX_PLIS` (jupe : `AUCUN`, `PINCES`) | 35 mm par pli à la taille du devant, la moitié au bassin ; plis et pinces tracés (`PLACEMENT`) ; le dos a toujours sa pince |
| `poches` | `AUCUNE`, `ITALIENNES` (défaut pantalon), `COUTURE`, `PLAQUEES` | fond + garniture / fond de couture / poche plaquée |
| `poches_dos` (pantalon) | `AUCUNE`, `PASSEPOIL`, `PLAQUEES` | passepoil + fond / poche plaquée arrière |
| `bas` (pantalon) | `OURLET`, `REVERS` | « Bande de revers de bas » (4 cm) |
| `fente` (jupe) | `AUCUNE`, `DOS` (rabat de 40 mm sur 18 cm), `COTE` | une jupe droite / ajustée / sirène ≥ 55 cm a une fente dos par défaut |

- **Mesures** : `LONGUEUR_ENFOURCHURE` (nouvelle, catalogue « Mes mesures ») — la couture d'enfourchure devant + dos est recalée
  (+3 cm d'aisance) : 40 % de l'écart sur la remontée du dos (15–80 mm), le reste sur les avancées de fourche (×0,6–2,4) ;
  `HAUTEUR_BASSIN` place la ligne de bassin du pantalon (sinon 18 cm).
- **Réglages continus** (`parametersExtJson`, lus sur la photo) : `fullness.leg` 0,6–1,8 (largeur d'ourlet × la coupe, le genou
  garde la coupe) ; `lengths.legPct` 40–110 (% de la jambe entière, l'emporte sur `longueur`).
- **Fournitures** : les règles déclarent leurs `notions` (glissière de braguette à la longueur vendue, bouton de ceinture,
  élastique) ; le moteur les ajoute enfin à `metadata.notions` (`rule.notions` n'était pas appelé).
- **3D** : les pièces intérieures (braguette, garnitures, passepoils, poches plaquées, cordon, revers) sont listées, jamais
  drapées (`INSIDE_NAMES`) ; aucun nom de pièce ajoutée ne contient « devant » / « dos ».

### Suite du 2026-10-20 : jupe, dos de robe, pente d'épaule, 3D du pantalon

- **Ourlet de jupe** (`JupeRule`) : `fullness.skirt` lu sur la photo = ourlet ÷ taille et **fixe** l'ourlet (n'est plus
  ajouté à l'évasement de la coupe) ; sans lui, l'évasement de la coupe est mis à l'échelle de la hauteur sous le bassin
  (référence 60 cm, ×0,3–1,4) — une jupe trapèze au genou ne s'ouvre plus comme une jupe longue. La robe garde son modèle
  additif (calibré sur 38 robes).
- **Costume** : `longueur` règle le pantalon seul ; la veste garde sa longueur (hanches).
- **Dos de robe** (`dos`, `RobeRule`) : `DECOLLETE_V` (milieu dos 20 cm), `DOS_NU` (jusqu'à 7 cm de la taille, bretelles à
  10,5 cm du milieu), `GOUTTE` (goutte de 8,5 cm sous la nuque, sur la couture milieu dos), `TRANSPARENT` (tissu en U à 17 cm
  + pièce « Tulle du dos (transparent) ») ; `FERME` = l'encolure de base.
- **Pente d'épaule** : mesure `PENTE_EPAULE` (cm, base du cou → pointe d'épaule, à la verticale) ; chute d'épaule = la mesure
  (dos −5 mm), bornée 15–90 mm (`fitTorsoOutline`, toutes les règles à corsage / buste).
- **3D du pantalon** (`drapeLeg`) : l'anneau du bassin ne compte plus les avancées de fourche (qui passent entre les jambes) ;
  au-dessus des hanches l'excédent est froncé à la taille (élastique, plis) ; l'aisance du bassin va surtout devant
  (`PELVIS_FRONT_BIAS`), le dos reste sur le fessier ; une jambe ample tombe droit depuis la hanche et le fessier
  (`LEG_FALL_*`, `LEG_LOOSE_*`) — plus de « culotte de cheval » ni de bosse au fessier.

### 2D = 3D : marques du patron sur le tissu, mannequin aux mesures (2026-10-20, soir)

- **Marques de détail** (`detailPlacementLines`, `shared/bottoms.ts`) : lignes `PLACEMENT` sur Devant/Dos du pantalon,
  du costume et de la jupe — J de braguette (un seul devant, `single: true`, 18 cm de zip : `FLY_ABOVE_CROTCH_MM = 65`),
  entrée de poche italienne, repère de poche couture, contour de poche plaquée devant/dos, passepoils, pli du revers.
  Bug corrigé : la profondeur de braguette retranchait la hauteur de taille (`hauteurMontant - rise` → `+ rise`).
- **3D** (`garment-model.ts`) : `detailLinesOf` (BONE + PLACEMENT) projetés sur le tissu, échantillonnés tous les 12 mm
  (`DETAIL_STEP_MM`) — jambes via `legPoint`, jupes / corsages via `onCloth`. Le marquage `single` n'est pas mis en miroir.
- **Anneau de jambe** (`legColumn` / `legColumnOf`) : le devant va de l'entrejambe au côté **par le devant**, le dos du côté
  à l'entrejambe **par le dos** ; au bassin chaque pièce occupe sa part du demi-tour (largeur devant ÷ devant+dos à la
  rangée). Avant, le devant couvrait devant→côté→dos et le dos était écrasé sur x = 0 : braguette et poches tombaient
  au mauvais endroit.
- **Mannequin** (`readBodyMeasurements`) : `STATURE` (sinon `HAUTEUR_TAILLE_SOL` ou `LONGUEUR_JAMBE`) fixe la stature ;
  une hauteur taille–sol mesurée place la taille ; `HAUTEUR_ENTREJAMBE` donne la fourche (si `HAUTEUR_FOURCHE` absente) ;
  `HAUTEUR_TAILLE_GENOU` place le genou (mannequin, pose, drapé) ; `TOUR_HAUT_POITRINE`, `TOUR_SOUS_POITRINE`,
  `HAUTEUR_POITRINE` (× 0,58 en vertical) façonnent la poitrine. Le drapé et la visionneuse prennent le genou là où le
  moteur trace la ligne de genou (`kneeY`, 47 % fourche→cheville, comme `trouserKneeMm`).
- Le jupon s'arrête 1 cm au-dessus du sol ; l'ondulation au sol ne passe plus sous le sol.
- Lissage Taubin des panneaux 3D (`smooth-mesh.ts`, bords figés) ; mesures saisies dans l'assistant conservées dans
  `parametersExtJson.measurements` (profil < projet < requête à la génération).

#### Épaules du mannequin et têtes de manches (2026-10-21)

- Largeur d'épaules du mannequin : `CARRURE_DOS` × 0,95, sinon `CARRURE_DEVANT`, sinon `LARGEUR_EPAULE` + cou — même
  priorité que `fitTorsoOutline`, pour que la pointe d'épaule du patron tombe sur celle du corps.
- `PENTE_EPAULE` (1,5–9 cm, bornes du moteur) place la pointe d'épaule sous la base du cou et monte / abaisse le bras
  avec elle (`fitHumanBody` étape 3b).
- Tête de manche : la poussée hors du buste est fondue sur les sommets voisins (`featherGridOffsets`) — plus de pointe
  au bord près de l'aisselle.

#### Pièces de détail en 3D et vue éclatée (2026-10-21)

- Moteur : chaque marque de détail des bas (`detailPlacementLines`) porte `detail: { pieces, area, inside? }` — les noms
  des pièces qu'elle place (parementure + sous-patte de braguette, fonds de poche / garniture, poche plaquée, passepoil,
  bande de revers) et leur zone fermée dans le repère de la pièce porteuse ; `inside` = cousue à l'intérieur. Zones
  rentrées de 12 mm sous la taille et 8 mm de la couture de côté (`AREA_*_INSET_MM`) pour rester dans la pièce.
  Test : `src/__tests__/detail-areas.test.ts`.
- 3D (`utils/garment3d/detail-patch.ts`) : chaque zone devient un panneau `zone: 'detail'` posé sur le tissu drapé
  (+3 mm dehors, −3 mm dedans, couture dessinée), au nom et aux ids des pièces du patron (surlignage). Fonds de poche en
  couleur doublure (`lining`). Jambes : un panneau par pièce (`legs-<±1>-front|back`), éclatés devant / derrière ; les
  détails partent 1,7 × plus loin que leur pièce, le revers (devant + dos d'une jambe) est un seul panneau qui descend.
  Jupes : mêmes panneaux via la carte du demi-panneau drapé.
- Corrigé au passage : la dernière colonne du dos s'arrêtait à ~1 cm du milieu dos (fente de peau entre les jambes) —
  `BACK_EDGE_F` ; la liaison d'entrejambe (milieu dos → milieu devant sous le corps) n'est plus dans les pièces découpées.

#### Robe de bal 1850 : jupe en lés froncés et traîne en deux panneaux (2026-10-21, nuit)

`ROBE_MARIEE` accepte le groupe `jupe` ; `jupe: EN_LES` (sans bloc de jupe — un bloc l'emporte) remplace les 3 panneaux
par `goredBallSkirt` : par demi-jupe « Jupe Devant / Côté Devant / Côté / Côté Dos (lé froncé) » ×2 (= 8 lés) + « Jupe
Dos — panneau de traîne (froncé) » ×2. Haut des lés = `GORE_GATHER` (2) × la couture de taille ÷ 10 (froncé en plis
d'orgue) ; ourlet total = `GORE_HEM_OVER` (1,45) × l'ourlet du jupon (trapèzes ~2 × plus larges en bas, comme la
planche), panneaux de traîne `TRAIN_PANEL_HEM` (1,6) × un lé. L'ourlet descend vers la traîne par paliers
`GORE_TRAIN_STEPS` (0 / 0,2 / 0,5 / 1 × la traîne) : chaque couture a la même longueur des deux côtés. Taille en pointe :
le haut des lés devant suit la pointe du bustier sur toute sa largeur froncée (2 × la demi-pointe, `waistPointDepthAt`),
pas le seul lé du milieu. Jupe froncée lourde (lés, bloc froncé ou plissé) : « Ceinture intérieure (gros-grain) » ×1 —
qui remplace alors la fourniture « Ruban de taille » des baleines (pas de doublon). 3D : un panneau `skirt` dont le nom
contient « fronc » est froncé (`gathered`) ; `joinPieces` recolle le milieu et **tous** ses côtés dans l'ordre du patron ;
sur un jupon, la profondeur des plis vient du tissu en trop (vague : A = √(surplus × λ) / π), plus d'un tiers forfaitaire.
Tests : `robe-bal-pieces.test.ts`, `trims.test.ts`.

#### Planche d'atelier : découpes princesse, manche tailleur, basque du gilet, finitions (2026-10-21, soir)

- `corsage = PRINCESSE` (`shared/panels.ts` `princessSplit`) : devant et dos coupés le long d'une couture qui part de
  l'emmanchure (55 % de l'épaule au dessous de bras), passe sur le buste et coupe la taille à mi-largeur
  → « Corsage Côté Devant / Dos » ×2, mêmes coordonnées que la pièce d'origine. 3D : recollées par `joinPieces`
  (`keepsFrame` : détails et boutons de la pièce du milieu restent placés ; pas de tissu d'accent sur un côté de corsage).
- `manches = TAILLEUR` : manche longue ajustée en deux pièces (`twoPieceSleeve`) + « Poignet » coupé simple (35 mm) +
  « Parementure de poignet ». 3D : poignet de toute la hauteur de la pièce quand il a sa parementure.
- `devant = GILET` + boutonnage : « Plastron (gilet) » en deux moitiés avec une croisure de 15 mm (`giletPiece`).
- `basque = AUCUNE | POINTES | PANS_CROISES` (nouveau groupe, ROBE) : les moitiés du gilet finissent en pointes
  (90 mm sous le corsage) ; avec `PANS_CROISES`, « Pan croisé » ×2. Pointes et pans sont des zones de détail de
  « Jupe Devant » (`DetailArea.contrast`, `layer`) : la 3D les pose sur la jupe dans le tissu du gilet, les pointes
  au-dessus (`PATCH_LAYER_LIFT`).
- Robe longue (MAXI/SOL) princesse ou en lés : « Ceinture intérieure (gros-grain) » ; jupe en lés au sol :
  « Parementure d'ourlet (…) » par panneau ; gilet boutonné : « Parementure de jupe (fente dos) » ×2.
- `fit.contrastTrims` (informatif) : col et poignets dans le tissu du gilet (3D : matière du plastron).
- Jupe plissée (bloc `PLEATED_SKIRT`) coupée en lés de laize (≤ 138 cm, nombre pair) au lieu de deux panneaux de
  plusieurs mètres ; la 3D lit largeur × quantité, rien ne change au rendu.
- 3D, taille en pointe sur une jupe-bloc froncée / plissée (`dipBlockSkirtUnderPoint`) : le haut de la jupe devant
  descend jusqu'à la pointe du corsage au milieu devant (la jupe recouvrait la pointe).

#### Corsage ouvert sur gilet, boutons, lés contrastés (2026-10-21)

- `devant = GILET` (`robe.rule.ts`, `GILET_OPEN_*_MM`) : seul le corsage s'ouvre (45 → 75 → 40 → 60 mm de demi-ouverture,
  col → buste → taille → bas de la basque) sur « Plastron (gilet) » de la longueur du corsage ; revers et parementures comme
  `MANTEAU_REVERS` ; la jupe reste d'un tenant. 3D : `opensAtFlatY` reconnaît « gilet ».
- `fermeture = BOUTONS | BOUTONS_TAILLE` : ligne `{ kind: 'PLACEMENT', buttons: { diameterMm: 12 } }` au milieu devant du
  corsage (35 mm d'écart), jusqu'au bas du corsage ou à la taille. 3D (`buttonsOn`) : sphères bronze sur la colonne
  centrale du plastron, sinon sur le tissu ; jamais dessinée comme un trait.
- `fit.contrastGores` (types, ai-service `normalize_fit`, prompt) : lés de côté d'une jupe `EN_LES` en tissu contrastant —
  le panneau recollé marque ses sommets de lé (`accentPiece`), la visionneuse les habille de `contrastMaterial`
  (motif à l'échelle du tissu principal, pas celle du plastron).
- Tête de manche bras le long du corps (pose Présentation) : au-dessus de l'articulation le repère de la manche garde au
  moins 0,34 rad d'inclinaison (`capAxis`, `turnedFrame`) — la tête montait à la verticale, peau visible à l'épaule.

## Pièces de construction et garnitures avancées (`construction`, 2026-10-21)

Couche ajoutée **après** la règle et ses garnitures (`shared/construction.ts`, `applyConstruction`), pilotée par
`parametersExtJson.construction = { items: [...] }` (validation `@angaly/types` `pattern-construction.ts`, transmis
par `generate-pattern-version.use-case.ts`). Chaque pièce est dérivée des pièces de la règle (balayage d'ourlet, tour de
jupe à une hauteur, encolure, ourlet de manche, hauteur du dos) : doublure (`LINING`), entoilage (`INTERFACING`),
volants d'ourlet / étagés froncés ou en forme (`HEM_FLOUNCE`), godets, basque rapportée (`PEPLUM`, sautée si une
basque existe), jabot, pèlerine (`CAPELET`), chou (`BOW`), bandes appliquées (`HEM_BANDS`), engageantes, balayeuse,
tournure / pouf / paniers (`BUSTLE`), pli Watteau, poches dans les coutures, biais, goussets, écharpe (`SASH`),
soutien de bouffant, tablier. Les pièces de jupe reçoivent les lignes `PLACEMENT` de ce qu'on y coud. Doublure et
entoilage sont exclus du métrage. Contrat de nommage avec la 3D, tableau complet des calculs, banc de 35 robes et
planches : `docs/reviews/dress-pattern-catalog.md`. Tests : `construction.test.ts`, `dress-catalog.test.ts`.

Ajouts du 2026-10-21 (soir) : `EMBROIDERY`, `SMOCKING`, `CONTRAST_CUFFS` ; les pièces posées sur le tissu (bandes,
pli Watteau, écharpe, broderie, smocks) portent leur zone (`InternalLine.detail`) sur la pièce hôte pour la 3D. Le
catalogue des robes réalisables est une donnée du moteur (`src/catalog/dress-catalog.ts`, `DRESS_CATALOG`, avec
`look` = couleurs lues sur la photo d'inspiration), servi par l'API `pattern-catalog`.

Ajout du 2026-10-23 : `DetailArea.motif?: 'BRODERIE' | 'SMOCKS'` et `DetailArea.color?` (#rrggbb, fil de broderie),
facultatifs et rétrocompatibles (`contrast` reste posé sur la broderie pour les anciennes lectures). La 3D dessine
alors un motif au lieu d'un aplat (`ui/motifTextures.ts`) : broderie = rinceaux, feuilles, fleurs et points de nœud
dans la couleur du fil, posés au-dessus du tissu (carreau de 8 cm) ; smocks = nid d'abeille en relief (normal map +
occlusion, losange de 12 mm) sur le tissu de la robe. Une broderie `OURLET` commence **au-dessus du plus haut volant
d'ourlet** (`HEM_FLOUNCE`), qui la cachait sinon.
