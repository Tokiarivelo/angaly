# Feature — `pattern-engine`

**Statut : ⬜ À faire.** Phase 4 — Premium (Angaly Pattern Studio).

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
  confirmés par l'utilisateur/la couturière, jamais une suggestion `ai-inference` brute.
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
- Une règle absente pour un `GarmentType` donné (Phase 4 en cours de couverture progressive,
  voir `packages/pattern-engine/src/rules/README.md`) doit produire une erreur claire et
  actionnable, jamais un plantage silencieux ou une géométrie approximative.

## Vérification

- [ ] `generate-pattern-pieces` testé avec une `IPatternRule` stub (succès, mesures manquantes, `GarmentType` sans règle enregistrée)
- [ ] Au moins un test d'intégration avec une règle concrète une fois `pattern-engine-rule` utilisé pour en scaffolder une (cf. `docs/features/patterns.md`)
- [ ] Aucun import de `@angaly/pattern-engine` détecté en dehors de `apps/api/src/pattern-engine/` (vérification statique/lint)
- [ ] `docs/checklist-implementation.md` : `pattern-engine` passé à ✅
