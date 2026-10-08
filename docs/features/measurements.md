# Feature — `measurements`

**Statut : ✅ Fait.** Phase 4 — Premium (Angaly Pattern Studio).

## Objet

Gestion des profils de mesures d'un client (spec §22-23, §56) : `MeasurementProfile` (un
regroupement nommé, ex. « Mesures 2026 ») et ses `Measurement` (une valeur par clé, ex.
`TOUR_POITRINE`). Données personnelles sensibles, lues par `patterns` pour générer un patron et
par `ai-inference` pour construire ses suggestions.

## Emplacement Clean Architecture

`apps/api/src/measurements/`

```
domain/
  entities/measurement-profile.entity.ts   → invariants (label non vide, clés de mesure sans doublon dans un même profil)
  repositories/measurement-profile.repository.ts → IMeasurementProfileRepository (zéro import Prisma)
  value-objects/measurement-value.vo.ts    → valeur positive, cohérente avec l'unité déclarée
application/
  use-cases/
    create-measurement-profile.use-case.ts
    update-measurement-profile.use-case.ts  → label, unité, valeurs
    duplicate-measurement-profile.use-case.ts → spec §56 « dupliquer »
    delete-measurement-profile.use-case.ts
    list-measurement-profiles.use-case.ts
    get-measurement-profile.use-case.ts
  dtos/
infrastructure/
  repositories/prisma-measurement-profile.repository.ts
  mappers/measurement-profile.mapper.ts
presentation/
  controllers/measurement-profiles.controller.ts
  controllers/size-charts.controller.ts     → GET /measurements/size-charts (données statiques, pas de
                                               guard — référence AFNOR/ISO 8559-1, pas une donnée client)
  guards/ (propriétaire du profil uniquement)
__tests__/
  unit/create-measurement-profile.use-case.spec.ts
  unit/duplicate-measurement-profile.use-case.spec.ts
  unit/get-size-charts.use-case.spec.ts
  integration/measurement-profiles.controller.spec.ts
  integration/size-charts.controller.spec.ts
```

### Tailles standard (session 2026-09-14)

Le wizard `pattern-studio-wizard` (étape 7, `MeasurementsStep.tsx`) offre désormais un mode
« Taille standard » (XS/S/M/L/XL…) en alternative à la saisie manuelle, adressant l'absence
totale de sélecteur de taille relevée en diagnostic. Les données proviennent de
`packages/types/src/size-charts.ts` (`STANDARD_SIZE_CHARTS`), une table AFNOR/ISO 8559-1
(tailles FR 34-52 femme, 44-58 homme) portée depuis
`apps/ai-service/ml/data/standard_measurements.json` (auparavant présente mais totalement
inutilisée) — même vocabulaire de clés que `measurement-fields.const.ts`
(`TOUR_POITRINE`, `TOUR_TAILLE`, `TOUR_BASSIN`, `LONGUEUR_DOS`, `CARRURE_DOS`, `TOUR_COU`).
`GET /measurements/size-charts?gender=FEMME|HOMME` sert cette table ; c'est une donnée de
référence statique, pas une donnée client — pas de guard d'authentification. Sélectionner une
taille pré-remplit les champs de mesure côté client (`onApplyMeasurements`), qui restent
éditables — aucune persistance serveur d'un « profil de taille standard » distinct d'un
`MeasurementProfile`.

## Modèles Prisma

`MeasurementProfile` (`label`, `unit` — enum `MeasurementUnit`), `Measurement` (`key`,
`valueCm`, unique par `[profileId, key]`) ; relation `Customer`, référencé en lecture par
`PatternProject.measurementProfileId`.

## Cas d'usage clés

- Créer, modifier, dupliquer, supprimer un profil de mesures (spec §56)
- Lister les profils d'un client
- Exposer un profil sous forme de `MeasurementSet` (`Record<string, number>`, clé → valeur en
  cm) consommable directement par `packages/pattern-engine` et par le contrat
  `PatternAiSuggestionRequest.measurements`

## Endpoints exposés

| Méthode | Route | Use-case | Auth |
| --- | --- | --- | --- |
| `GET` | `/api/measurement-profiles` | `list-measurement-profiles` | `CLIENT` (ses profils) |
| `GET` | `/api/measurement-profiles/:id` | `get-measurement-profile` | `CLIENT` (propriétaire) |
| `POST` | `/api/measurement-profiles` | `create-measurement-profile` | `CLIENT` |
| `PATCH` | `/api/measurement-profiles/:id` | `update-measurement-profile` | `CLIENT` (propriétaire) |
| `POST` | `/api/measurement-profiles/:id/duplicate` | `duplicate-measurement-profile` | `CLIENT` (propriétaire) |
| `DELETE` | `/api/measurement-profiles/:id` | `delete-measurement-profile` | `CLIENT` (propriétaire) |
| `GET` | `/api/measurements/size-charts` | `get-size-charts` | Public (données statiques) |

## Points d'intégration

- **`patterns`** : lecture seule d'un `MeasurementProfile` existant (via
  `PatternProject.measurementProfileId`) — `measurements` n'a jamais connaissance d'un
  `PatternProject`, la dépendance est à sens unique.
- **`ai-inference`** : les valeurs (`Measurement.valueCm`) alimentent le champ `measurements`
  de `PatternAiSuggestionRequest` — converties en `Record<string, number>` par le module
  appelant, jamais transmises brutes en base par `ai-inference`.
- **Pages consommatrices** : `mes-mesures` (gestion complète), étape 7 de
  `pattern-studio-wizard` (sélection/saisie inline).

## Points d'attention

- **Données personnelles sensibles** (spec §56) : chaque opération doit vérifier que le
  `MeasurementProfile` ciblé appartient bien au `customerId` de l'utilisateur authentifié — au
  niveau du Guard, pas seulement filtré côté requête. Ne jamais journaliser une valeur de mesure
  en clair dans les logs applicatifs.
- **Historisation** : la spec §56 mentionne « historiser » les profils de mesures, mais le
  schéma Prisma actuel (`MeasurementProfile`/`Measurement`) ne définit aucune table de version
  (contrairement à `PatternVersion` côté patrons ou `PageSectionVersion` côté contenu) — la
  duplication (`duplicate-measurement-profile`) sert de solution de contournement immédiate
  (« Mesures 2026 » dupliquée en « Mesures 2026 (copie) » avant modification), mais une vraie
  historisation nécessiterait une évolution de schéma hors périmètre de cette fiche ; documenter
  ce gap explicitement plutôt que de l'implémenter de façon détournée.
- Les valeurs sont toujours persistées en centimètres (`valueCm`) quelle que soit l'unité
  d'affichage choisie par le client (`MeasurementUnit.INCH` reste un détail de présentation).

## Vérification

- [x] `create-measurement-profile`/`update-measurement-profile` testés (validation des clés/valeurs)
- [x] `duplicate-measurement-profile` testé (copie fidèle, nouveau `id`)
- [x] Guard "propriétaire du profil" testé (un client ne peut pas accéder au profil d'un autre)
- [x] `get-size-charts`/`size-charts.controller` testés (filtrage par genre, rejet d'un genre invalide)
- [x] `docs/checklist-implementation.md` : `measurements` passé à ✅


## Catalogue de mesures pour un ajustement parfait (Phase 5b S1)

Source unique : `packages/types/src/pattern-fit.ts` (`MEASUREMENT_CATALOG`). Consommée par la
validation API, le formulaire « Mes mesures », l'étape Mesures du wizard et vérifiée contre les
règles du pattern-engine (`apps/api/src/measurements/__tests__/unit/pattern-fit.spec.ts` :
les clés **requises** par garment = `requiredMeasurementKeys` des règles, aucune clé lue par une
règle hors catalogue ; `LONGUEUR_PANTALON` reste un alias historique de `LONGUEUR_JAMBE`).

- **Indispensable** (`requiredFor`) : le moteur refuse de générer sans (sinon estimation IA explicite).
- **Recommandé** (`recommendedFor`) : demandé dans le wizard pour améliorer l'ajustement, jamais bloquant.
- Toutes les valeurs sont en **cm** côté wizard/API-pattern ; un profil en pouces est converti
  (×2,54) pour le seul contrôle de plausibilité.
- **Validation (400 « Mesures invalides »)** à la création/modification d'un profil et à la
  génération (`measurements` manuelles) : nombre fini, > 0 (0 toléré pour `LONGUEUR_TRAINE`),
  dans la plage plausible ci-dessous. Clés inconnues (anciens profils) : positives, ≤ 400 cm.
- `checkMeasurementCoherence()` renvoie des **avertissements non bloquants** (sous-poitrine >
  poitrine, genou > cuisse, bassin < taille…), affichés dans le wizard.
- Les 6 clés historiques (poitrine, taille, bassin, longueur dos, carrure dos, cou) restent celles
  des tables de tailles standard / de l'imputation IA ; les nouvelles clés sont saisies à la main
  (l'estimation IA ne les produit pas encore).
- Les règles du moteur **ne consomment pas encore** les nouvelles mesures : c'est l'objet de S2
  (aucun changement de géométrie en S1, test de non-régression `ease-contract.test.ts`).

| Clé | Libellé | Groupe | Plage cm | Indispensable pour | Recommandé pour |
|-----|---------|--------|----------|--------------------|-----------------|
| `TOUR_POITRINE` | Tour de poitrine | CIRCONFERENCES | 60–170 | ROBE, VESTE, COSTUME, CHEMISE, ROBE_MARIEE, AUTRE | — |
| `TOUR_SOUS_POITRINE` | Tour sous la poitrine | CIRCONFERENCES | 55–150 | — | ROBE_MARIEE |
| `TOUR_TAILLE` | Tour de taille | CIRCONFERENCES | 45–160 | ROBE, JUPE, PANTALON, VESTE, COSTUME, CHEMISE, ROBE_MARIEE, AUTRE | — |
| `TOUR_HAUT_BASSIN` | Tour de hanches (haut) | CIRCONFERENCES | 55–170 | — | JUPE, PANTALON, COSTUME, ROBE_MARIEE |
| `TOUR_BASSIN` | Tour de bassin | CIRCONFERENCES | 65–180 | ROBE, JUPE, PANTALON, COSTUME, ROBE_MARIEE | VESTE |
| `TOUR_COU` | Tour de cou | CIRCONFERENCES | 25–55 | — | VESTE, COSTUME, CHEMISE |
| `TOUR_EMMANCHURE` | Tour d’emmanchure | CIRCONFERENCES | 30–70 | — | VESTE, COSTUME, CHEMISE |
| `TOUR_CUISSE` | Tour de cuisse | CIRCONFERENCES | 35–100 | — | PANTALON, COSTUME |
| `TOUR_GENOU` | Tour de genou | CIRCONFERENCES | 25–60 | — | PANTALON, COSTUME |
| `TOUR_CHEVILLE` | Tour de cheville | CIRCONFERENCES | 15–40 | — | PANTALON |
| `TOUR_BRAS` | Tour de bras | BRAS | 15–60 | — | manches |
| `TOUR_POIGNET` | Tour de poignet | BRAS | 11–30 | — | VESTE, COSTUME, CHEMISE |
| `CARRURE_DOS` | Carrure dos | LARGEURS | 25–55 | — | manches |
| `CARRURE_DEVANT` | Carrure devant | LARGEURS | 25–55 | — | manches |
| `LARGEUR_EPAULE` | Largeur d’épaule | LARGEURS | 8–20 | — | haut (robe, veste, costume, chemise, mariée, autre) |
| `ECARTEMENT_POINTS_POITRINE` | Écart des pointes de poitrine | LARGEURS | 8–30 | — | ROBE, ROBE_MARIEE, VESTE |
| `LONGUEUR_DOS` | Longueur dos | LONGUEURS_TORSE | 30–60 | ROBE, JUPE, VESTE, COSTUME, CHEMISE, ROBE_MARIEE, AUTRE | — |
| `LONGUEUR_DEVANT` | Longueur devant | LONGUEURS_TORSE | 30–65 | — | ROBE, ROBE_MARIEE, VESTE |
| `HAUTEUR_POITRINE` | Hauteur de poitrine | LONGUEURS_TORSE | 18–40 | — | ROBE, ROBE_MARIEE, VESTE |
| `HAUTEUR_BASSIN` | Hauteur de bassin | LONGUEURS_TORSE | 14–28 | — | ROBE, JUPE, PANTALON, COSTUME, ROBE_MARIEE |
| `PROFONDEUR_EMMANCHURE` | Profondeur d’emmanchure | LONGUEURS_TORSE | 15–30 | — | VESTE, COSTUME, CHEMISE |
| `LONGUEUR_BRAS` | Longueur de bras | BRAS | 40–85 | — | manches |
| `HAUTEUR_COUDE` | Longueur épaule–coude | BRAS | 20–45 | — | VESTE, COSTUME |
| `LONGUEUR_JUPE` | Longueur de jupe souhaitée | BAS_DU_CORPS | 25–140 | — | JUPE, ROBE, ROBE_MARIEE |
| `HAUTEUR_TAILLE_GENOU` | Hauteur taille–genou | BAS_DU_CORPS | 40–75 | — | JUPE, PANTALON, COSTUME |
| `HAUTEUR_FOURCHE` | Hauteur de fourche | BAS_DU_CORPS | 18–40 | — | PANTALON, COSTUME |
| `HAUTEUR_ENTREJAMBE` | Hauteur d’entrejambe | BAS_DU_CORPS | 55–100 | — | PANTALON, COSTUME |
| `LONGUEUR_JAMBE` | Longueur de jambe (extérieure) | BAS_DU_CORPS | 70–130 | — | PANTALON, COSTUME |
| `HAUTEUR_TAILLE_SOL` | Hauteur taille–sol | BAS_DU_CORPS | 80–140 | — | robes |
| `LONGUEUR_TRAINE` | Longueur de traîne | BAS_DU_CORPS | 0–400 | — | ROBE_MARIEE |
| `HAUTEUR_TOTALE` | Taille (hauteur totale) | BAS_DU_CORPS | 130–220 | — | ...BOTTOMS, ...DRESSES |
