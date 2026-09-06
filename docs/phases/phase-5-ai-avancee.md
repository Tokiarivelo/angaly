# Phase 5 — IA avancée

**Statut : ⬜ À faire.** Dépend de : Phase 4 (`measurements`, `patterns`, `pattern-engine`
opérationnels avec au moins une règle concrète).

## Objectif (spec §101 Phase 5, §105)

Remplacer le mode placeholder d'`apps/ai-service` par un vrai modèle, et enrichir
l'assistance IA côté client : analyse de photo d'inspiration, suggestions de style à
partir des mesures, assistant conversationnel global. **Aucune nouvelle page** — cette
phase enrichit des pages déjà livrées (Phase 4 principalement, et `personnalisation-creation`
de Phase 2).

## Pages en scope

Aucune nouvelle. Pages existantes enrichies : `pattern-studio-wizard`,
`pattern-studio-preview-validation-export`, `personnalisation-creation`.

## Modules backend en scope

`ai-inference` (le seul module encore vide depuis Phase 0 — voir
`apps/api/src/modules/ai-inference/README.md`).

## Ordre suggéré

1. Dataset + entraînement dans `apps/ai-service/ml/` (notebooks, scripts — hors image
   Docker servie, voir `apps/ai-service/ml/README.md`)
2. Remplacer `PLACEHOLDER_MODEL_VERSION` dans `apps/ai-service/app/inference.py` par le
   vrai modèle chargé ; le contrat Pydantic (`app/schemas.py`) ne change pas — il est déjà
   aligné sur `packages/types`' `PatternAiSuggestionRequest/Response`
3. Module NestJS `ai-inference` : appelle `apps/ai-service` en HTTP interne, mappe la
   réponse, expose l'endpoint consommé par `patterns`
4. Analyse de photo d'inspiration (upload via `packages/storage` → `ai-service` →
   suggestions de paramètres pré-remplis dans le wizard)
5. Widget assistant conversationnel global (`AIConversation` model déjà en base depuis
   Phase 0) — scope minimal : FAQ + orientation, pas de génération de contenu libre non
   modérée

## Points d'attention

- **Rappel ADR-005** (`docs/architecture.md`) : le modèle entraîné reste une **suggestion**,
  jamais la source de vérité géométrique — `packages/pattern-engine` garde le dernier mot.
  `confidence` doit être affiché à l'utilisateur, pas masqué.
- Toute route `ai-inference` doit avoir un plan de repli si `apps/ai-service` est down
  (timeout court + message clair, jamais un 500 qui bloque tout le wizard).
- Documenter le modèle utilisé (architecture, dataset, limites connues) dans
  `apps/ai-service/README.md` — obligatoire avant de sortir du mode placeholder.

## Vérification de sortie de phase

- `apps/ai-service` répond avec un `modelVersion` réel (plus `placeholder-0.0.0`) et une
  `confidence` > 0 sur au moins un `GarmentType`
- Un client peut uploader une photo d'inspiration et voir des paramètres suggérés dans le
  wizard (e2e ou test manuel documenté si l'e2e est trop coûteux à automatiser pour de l'IA)
- `docs/checklist-implementation.md` : `ai-inference` passé à ✅

## Phase suivante

`docs/phases/phase-6-admin-cms.md`.
