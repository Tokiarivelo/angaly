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
- **Rendu du "meilleur patron" limité pour 3 des 8 `GarmentType` — corrigé (session
  2026-09-21)** — `packages/pattern-engine/src/rules/` n'implémentait auparavant que
  `ROBE`/`JUPE`/`PANTALON`/`VESTE`/`CHEMISE`. `COSTUME`, `ROBE_MARIEE` et `AUTRE` n'avaient
  aucune règle dédiée : `PatternEngine.generate()` retombait sur la première règle enregistrée
  dont `appliesTo()` acceptait le type demandé (`VesteRule` pour `COSTUME`, `RobeRule` pour
  `ROBE_MARIEE`, `ChemiseRule` pour `AUTRE`). Le cas le plus grave était `COSTUME` :
  `VesteRule` ne générait que les pièces d'une veste, jamais le pantalon qui complète un
  costume — la moitié du vêtement demandé n'était simplement pas produite. C'était la cause de
  "ce n'est pas le meilleur patron pour le type de vêtement sélectionné" remontée par un
  utilisateur.

  **Correction** (via le skill `pattern-engine-rule`, chaque nouvelle règle avec ses tests) :
  - `packages/pattern-engine/src/rules/costume.rule.ts` — nouvelle règle dédiée `COSTUME`.
    Décision documentée dans le fichier : un costume produit toujours un ensemble
    veste + pantalon (jamais de bascule automatique vers une jupe selon `details`/`style`,
    non spécifié par la spec — garder la règle simple et déterministe). Construction :
    adaptation autonome (pas de ré-import inter-règles, `packages/pattern-engine` reste sans
    dépendance externe ni interne) des formules buste/emmanchure/manche/col de
    `veste.rule.ts` et bassin/enfourchure/ceinture de `pantalon.rule.ts`, réunies en 7 pièces
    (4 veste + 3 pantalon) dans un seul `computePieces()`.
  - `packages/pattern-engine/src/rules/robe-mariee.rule.ts` — nouvelle règle dédiée
    `ROBE_MARIEE`, construction genuinely différente de `robe.rule.ts` : aisance quasi nulle
    au buste/taille (bustier structuré/baleiné plutôt que porté par l'aisance du tissu),
    découpe princesse à 3 panneaux (devant/côté/dos) au lieu de 2, jupe devant longueur au
    sol (1000mm) et jupe dos avec traîne significativement plus longue (+900mm par défaut,
    mesure `LONGUEUR_TRAINE` si fournie), plus une pièce jupon/doublure de structure — 7
    pièces au total contre 4 pour `RobeRule`. Hypothèses de patronage documentées en tête du
    fichier (la spec §19-24 ne détaille pas la construction bustier/traîne).
  - `packages/pattern-engine/src/rules/autre.rule.ts` — nouvelle règle dédiée `AUTRE`, mais
    **décision assumée de rester générique** (Option A, voir raisonnement complet en tête du
    fichier) : `AUTRE` couvre par définition une pièce arbitraire sur cahier des charges libre,
    sans famille de patron reconnue à adapter (contrairement à `COSTUME`/`ROBE_MARIEE`) — il
    n'existe pas de géométrie déterministe sensée à produire ici. La règle génère donc un bloc
    rectangulaire neutre (devant/dos, sans col/manche/aisance spécifique), et
    `generate-pattern-version.use-case.ts` ajoute désormais explicitement un avertissement
    dans `parametersJson.warnings` de la `PatternVersion` quand `garmentType === 'AUTRE'`
    ("patron de base générique… adaptation par une couturière requise"), lu côté `apps/web` de
    la même façon que `parametersJson.estimatedMeasurementKeys` l'est déjà par
    `PatternPreviewValidationPage.tsx` — un échec silencieux (présenter une géométrie de
    chemise comme si elle avait été construite pour la demande, l'ancien comportement) n'est
    plus possible. Option B (bloquer `AUTRE` sur `REVIEW_REQUIRED` sans jamais générer) a été
    écartée : ce statut est déjà un geste explicite de l'utilisateur ("Faire vérifier mon
    patron", `request-review.use-case.ts`, spec §27) indépendant du type de vêtement, et le
    court-circuiter automatiquement ici aurait cassé le contrat de
    `generate-pattern-version` (qui doit toujours renvoyer une `PatternVersion` avec des
    pièces) pour ce seul type.
  - `VesteRule.appliesTo()` et `RobeRule.appliesTo()` ont été resserrées pour n'accepter que
    leur propre `GarmentType` (`VESTE`/`ROBE`) maintenant que `COSTUME`/`ROBE_MARIEE` ont leur
    propre règle ; `ChemiseRule.appliesTo()` de même pour ne plus accepter `AUTRE`. Les 3
    nouvelles règles sont enregistrées dans
    `apps/api/src/pattern-engine/infrastructure/providers/pattern-engine.provider.ts`.

  Tests : `packages/pattern-engine/src/__tests__/{costume,robe-mariee,autre}.rule.test.ts`
  (appliesTo + géométrie + non-régression des règles voisines resserrées), et
  `apps/api/src/patterns/__tests__/unit/generate-pattern-version.use-case.spec.ts` (nouveau
  cas `parametersJson.warnings` pour `AUTRE`). `pnpm --filter @angaly/pattern-engine test` et
  `pnpm --filter @angaly/api test` passent intégralement.
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
