# Feature — `patterns`

**Statut : ⬜ À faire.** Phase 4 — Premium (Angaly Pattern Studio).

## Objet

Orchestration des projets de patron : cycle de vie (`PatternProject` → `PatternVersion` →
`PatternPiece`/`PatternExport`), et point d'intégration unique entre le wizard client,
`packages/pattern-engine` (calcul géométrique déterministe) et le module `ai-inference`
(suggestions, jamais la source de vérité — voir ADR-005 dans `docs/architecture.md`).

## Emplacement Clean Architecture

`apps/api/src/patterns/`

```
domain/
  entities/pattern-project.entity.ts
  entities/pattern-version.entity.ts
  repositories/pattern-project.repository.ts   → IPatternProjectRepository
  repositories/pattern-version.repository.ts   → IPatternVersionRepository
  value-objects/pattern-status.vo.ts
application/
  use-cases/
    create-pattern-project.use-case.ts
    update-pattern-project-step.use-case.ts     → PATCH incrémental à chaque étape du wizard
    generate-pattern-version.use-case.ts        → orchestre pattern-engine (+ ai-inference optionnel)
    request-review.use-case.ts                  → passe le statut à REVIEW_REQUIRED
    export-pattern-version.use-case.ts          → PDF/SVG/DXF via packages/storage
  dtos/
infrastructure/
  repositories/prisma-pattern-project.repository.ts
  repositories/prisma-pattern-version.repository.ts
  services/pattern-engine.service.ts    → adapte @angaly/pattern-engine à l'interface interne
  services/ai-inference-client.service.ts → appel HTTP interne vers apps/ai-service (via module ai-inference)
  mappers/
presentation/
  controllers/pattern-projects.controller.ts
  controllers/pattern-versions.controller.ts
  guards/ (auth + propriétaire du projet)
__tests__/
  unit/generate-pattern-version.use-case.spec.ts
  unit/export-pattern-version.use-case.spec.ts
  integration/pattern-projects.controller.spec.ts
```

## Modèles Prisma

`PatternProject`, `PatternVersion`, `PatternPiece`, `PatternExport`, `MeasurementProfile`
(lecture, via `measurements`), `Media` (photo d'inspiration + fichiers d'export).

## Cas d'usage clés

- Créer un projet (étape 1 du wizard) → `PatternProject` en statut `DRAFT`
- Mettre à jour incrémentalement les champs du projet à chaque étape du wizard
- Générer une version : appelle `PatternEngineService` (déterministe, obligatoire) et, si
  disponible, enrichit avec une suggestion `ai-inference` (optionnel, jamais bloquant)
- Exporter une version validée en PDF/SVG/DXF, uploadé dans le bucket MinIO `patterns/`

## Endpoints exposés

| Méthode | Route | Use-case | Auth |
| --- | --- | --- | --- |
| `POST` | `/api/pattern-projects` | `create-pattern-project` | `CLIENT` (propriétaire) |
| `PATCH` | `/api/pattern-projects/:id` | `update-pattern-project-step` | `CLIENT` (propriétaire) |
| `POST` | `/api/pattern-projects/:id/generate` | `generate-pattern-version` | `CLIENT` (propriétaire) |
| `POST` | `/api/pattern-projects/:id/request-review` | `request-review` | `CLIENT` (propriétaire) |
| `POST` | `/api/pattern-versions/:id/export` | `export-pattern-version` | `CLIENT` (propriétaire) ou `COUTURIERE` |

## Points d'intégration

- **`packages/pattern-engine`** : dépendance directe et obligatoire — `generate-pattern-version`
  ne doit jamais réussir sans un appel à l'orchestrateur `PatternEngine`. Voir
  `.cursor/rules/007-pattern-engine.mdc`.
- **`ai-inference`** : appelé en best-effort avec timeout court ; une panne d'`ai-inference`
  ne doit jamais faire échouer `generate-pattern-version` (voir
  `.cursor/rules/008-ai-service-integration.mdc`).
- **`measurements`** : lecture seule d'un `MeasurementProfile` existant du client.
- **`media`/`packages/storage`** : bucket `patterns/` pour les photos d'inspiration et les
  exports générés.
- **Pages consommatrices** : `pattern-studio-wizard`,
  `pattern-studio-preview-validation-export`, `mes-projets-patron`.

## Points d'attention

- Le statut `REVIEW_REQUIRED` doit réellement bloquer `export-pattern-version` côté backend
  (pas seulement une désactivation de bouton côté UI) tant qu'une `COUTURIERE` n'a pas
  validé — voir spec §27 et `docs/phases/phase-4-premium-pattern-studio.md`.

## Vérification

- [ ] `generate-pattern-version` testé avec au moins une règle `IPatternRule` concrète
      (via le skill `pattern-engine-rule`), y compris le cas où `ai-inference` timeout
- [ ] `export-pattern-version` testé pour les 3 formats (`PatternExportFormat`)
- [ ] Guard "propriétaire du projet" testé (un client ne peut pas accéder au projet d'un autre)
- [ ] `docs/checklist-implementation.md` : `patterns` passé à ✅
