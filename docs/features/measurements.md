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
