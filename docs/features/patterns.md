# Feature — `patterns`

**Statut : ✅ Fait** (corrections session 2026-09-14 — voir Points d'attention). Phase 4 — Premium
(Angaly Pattern Studio).

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

- **Photo d'inspiration corrigée (session 2026-09-21)** — `uploadInspirationMedia()`
  (`apps/web/src/features/pattern-studio-wizard/api/pattern-projects.api.ts`) violait
  `.cursor/rules/002-nextjs-features.mdc` (raw `fetch` hors de `@/lib/api-client`) contre une
  route `/api/media/upload` que `apps/web` n'expose pas (seul route Next.js sous `app/api/`
  est le catch-all NextAuth) — la requête échouait donc au niveau réseau avant même d'atteindre
  le backend. Elle envoyait en plus `entityType: 'PATTERN_PROJECT'`, qui n'a jamais été une
  valeur valide de `MediaEntityType` (voir `docs/features/media.md`). Chaque échec tombait
  dans un fallback silencieux : un blob `URL.createObjectURL()` local (jamais persisté,
  invalide après un rechargement de page) + un `mediaId` fabriqué (`'mock-media-' + Date.now()`)
  qui ne correspond à aucune ligne `Media` réelle — c'est la cause de "la photo uploadée ne
  s'affiche pas correctement" remontée par un utilisateur. `analyzeInspirationPhoto()` avait
  en plus un mismatch de noms de champs des deux côtés avec
  `AiInspirationController`/`AnalyzeInspirationDto` (`imageUrl` envoyé au lieu de
  `inspirationImageUrl` attendu ; `detectedFeatures` lu au lieu de
  `detectedInspirationFeatures` reçu) — la requête échouait donc systématiquement (400) et
  retombait sur une analyse placeholder fixe (`SIRENE`, texte français codé en dur), affichée
  à chaque utilisateur indépendamment de sa photo réelle. **Corrigé** : `uploadInspirationMedia`
  suit désormais le flux presigned-upload → PUT direct navigateur→MinIO → confirm (même
  pattern que `personnalisation-creation`'s `useInspirationUpload.ts`, via `@/lib/api-client`
  uniquement, avec le nouveau `MediaEntityType.PATTERN_INSPIRATION`, voir
  `docs/features/media.md`) ; plus aucun fallback silencieux — un échec réel remonte comme une
  erreur visible dans l'UI existante (`InspirationStep.tsx` affiche déjà un message d'erreur,
  l'étape reste optionnelle). `analyzeInspirationPhoto` envoie/lit désormais les bons noms de
  champs.
- **Rendu du "meilleur patron" limité pour 3 des 8 `GarmentType` (session 2026-09-21, suivi
  requis)** — `packages/pattern-engine/src/rules/` n'implémente que `ROBE`/`JUPE`/`PANTALON`/
  `VESTE`/`CHEMISE`. `COSTUME`, `ROBE_MARIEE` et `AUTRE` n'ont aucune règle dédiée :
  `PatternEngine.generate()` retombe sur la première règle enregistrée dont `appliesTo()`
  accepte le type demandé (`VesteRule` pour `COSTUME`, `RobeRule` pour `ROBE_MARIEE`,
  `ChemiseRule` pour `AUTRE`) — voir `packages/pattern-engine/src/pattern-engine.ts`. Le cas le
  plus grave est `COSTUME` : `VesteRule` ne génère que les pièces d'une veste, jamais le
  pantalon/jupe qui complète un costume — la moitié du vêtement demandé n'est simplement pas
  produite. C'est la cause de "ce n'est pas le meilleur patron pour le type de vêtement
  sélectionné" remontée par un utilisateur. **Non corrigé dans cette session** (nécessite une
  vraie géométrie de construction par type, travail spécialisé patronage/couture — voir le
  skill `pattern-engine-rule`) ; voir `docs/phases/phase-4-premium-pattern-studio.md` pour le
  suivi.
- Le statut `REVIEW_REQUIRED` doit réellement bloquer `export-pattern-version` côté backend
  (pas seulement une désactivation de bouton côté UI) tant qu'une `COUTURIERE` n'a pas
  validé — voir spec §27 et `docs/phases/phase-4-premium-pattern-studio.md`.
- **Correction 2026-09-14 — cause racine du "Pattern Studio ne génère pas correctement"** :
  `generate-pattern-version.use-case.ts` retombait systématiquement sur un corps codé en dur
  (`TOUR_POITRINE: 90, TOUR_TAILLE: 70, TOUR_BASSIN: 95, ...`) car les mesures du wizard
  n'atteignaient jamais l'orchestrateur — `MeasurementsStep.tsx` utilisait un vocabulaire de
  clés différent (`TOUR_HANCHES`, `LARGEUR_EPAULES`…) de celui du pattern-engine
  (`TOUR_BASSIN`, `CARRURE_DOS`…), et `project.measurementProfileId` n'était jamais lu. Les deux
  sont corrigés : le wizard utilise désormais le vocabulaire canonique
  (`measurement-fields.const.ts`), et l'ordre de résolution des mesures est maintenant : profil
  de mesures lié → mesures manuelles du wizard → (si toujours incomplet) estimation IA via
  `EstimateMissingMeasurementsUseCase` (`ai-inference`), jamais de valeur par défaut silencieuse.
  Le type de vêtement (`GarmentType`) est aussi validé strictement contre les 8 valeurs connues
  au lieu d'un `includes()` fragile qui retombait sur `'ROBE'`.

## Vérification

- [x] `generate-pattern-version` testé : fusion profil/manuel, estimation IA sur mesures
      manquantes (avec retry unique), rejet d'un `GarmentType` inconnu, cas `ai-inference` en échec
- [ ] `export-pattern-version` testé pour les 3 formats (`PatternExportFormat`)
- [x] Guard "propriétaire du projet" testé (un client ne peut pas accéder au projet d'un autre)
- [x] `docs/checklist-implementation.md` : `patterns` passé à ✅
