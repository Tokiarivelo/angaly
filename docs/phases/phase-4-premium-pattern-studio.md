# Phase 4 — Premium : Angaly Pattern Studio

**Statut : ⬜ À faire.** Dépend de : Phase 2 (`auth`, `customers`), Phase 0
(`packages/pattern-engine` orchestrateur déjà testé, `apps/ai-service` en mode placeholder).

## Objectif (spec §101 Phase 4, §18-30)

Le module différenciant : profil de mesures, génération paramétrique de patron, prévisualisation,
vérification professionnelle, export. **Sans le vrai modèle IA** (Phase 5) — les suggestions
restent en mode placeholder (`confidence: 0`), ce qui doit être visible dans l'UI, jamais
présenté comme une suggestion fiable.

## Pages en scope

| Page | Fiche |
| --- | --- |
| pattern-studio-landing | `docs/pages/pattern-studio-landing.md` |
| pattern-studio-wizard | `docs/pages/pattern-studio-wizard.md` |
| pattern-studio-preview-validation-export | `docs/pages/pattern-studio-preview-validation-export.md` |
| mes-projets-patron | `docs/pages/mes-projets-patron.md` |
| mes-mesures | `docs/pages/mes-mesures.md` |

## Modules backend en scope

`measurements`, `patterns`, `pattern-engine` (module NestJS — le package
`@angaly/pattern-engine` a déjà son orchestrateur, il reste à écrire les règles concrètes
par `GarmentType` avec le skill `pattern-engine-rule`).

## Ordre suggéré

1. `measurements` → page `mes-mesures` (profils de mesures, spec §22-23, données sensibles —
   voir spec §56)
2. Au moins une règle `IPatternRule` concrète (ex. `JUPE` ou `ROBE`, la plus simple
   géométriquement) via le skill `pattern-engine-rule`, avec ses tests
3. `patterns` (module NestJS orchestrant `pattern-engine` + appel `ai-inference` en mode
   placeholder) → pages `pattern-studio-landing`, `pattern-studio-wizard`
4. `pattern-studio-preview-validation-export` (prévisualisation des pièces, statut
   `PatternStatus`, export PDF/SVG/DXF via `packages/storage`)
5. `mes-projets-patron` (liste + historique de versions, spec §29)
6. Étendre les règles pour couvrir progressivement `ROBE_MARIEE`, `COSTUME`, etc. — ne pas
   bloquer la sortie de phase sur la couverture de tous les types de vêtements ; documenter
   dans `docs/features/pattern-engine.md` lesquels sont couverts.

## Points d'attention

- **Ne jamais** faire dépendre la génération finale uniquement de `apps/ai-service` (spec
  §105/ADR-005) — un patron doit pouvoir être généré même si l'IA est indisponible, à partir
  de paramètres saisis manuellement.
- Le statut `REVIEW_REQUIRED` doit réellement bloquer l'export tant qu'une couturière n'a
  pas validé (spec §27) — ce n'est pas un badge cosmétique.

## Vérification de sortie de phase

- Un client peut créer un projet, entrer ses mesures, générer un patron pour au moins un
  type de vêtement, et l'exporter en PDF (e2e Playwright)
- `docs/checklist-implementation.md` : les 5 pages + 3 modules passés à ✅ (ou 🟡 avec les
  types de vêtements non couverts listés explicitement)

## Phase suivante

`docs/phases/phase-5-ai-avancee.md`.
