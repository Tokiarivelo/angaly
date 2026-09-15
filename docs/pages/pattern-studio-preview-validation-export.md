# Page — `pattern-studio-preview-validation-export`

**Statut : ✅ Fait.** Phase 4 — Premium (Angaly Pattern Studio).

## Objet

Affiche les pièces générées d'un projet de patron, permet de demander une vérification
professionnelle par une couturière Angaly, suit le statut (`PatternStatus`) jusqu'à validation,
puis exporte le document final et donne accès à l'historique des versions.

## Route(s)

`apps/web/src/app/(client)/pattern-studio/projects/[projectId]/page.tsx` →
`/pattern-studio/projects/:projectId`

Client Component dès la racine (sélection de pièce, zoom, statut en temps réel via polling ou
websocket léger — pas de bénéfice SSR sur cet écran d'atelier interactif).

## Référence maquette

- Prompt Stitch : `stitch-prompts/18-pattern-studio-preview-validation-export.md`
- Écran Stitch : **ANGALY — Validation de Patron (Studio)**
- Section spécification : §26-29 (`docs/specifications/ANGALY_Specifications_Completes.md`)

## Arborescence de composants attendue

```
apps/web/src/features/pattern-studio-preview-validation-export/
  ui/
    PatternPreviewValidationPage.tsx  → shell : header statut + layout 3 colonnes (pièces / canvas / détails)
    ProjectStatusHeader.tsx            → référence projet (projectRef) + badge de statut PatternStatus
    PatternPiecesSidebar.tsx           → liste des PatternPiece sélectionnables (Devant, Dos, Manche, Col, Jupe, Ceinture…)
    PatternPieceCanvas.tsx             → rendu technique SVG de la pièce sélectionnée (droit-fil, marges, crans), zoom +/-, toggle Vue technique/simplifiée
    PatternPieceDetailsPanel.tsx       → nom, dimensions, tissu, quantité, droit-fil, marge de couture, repères
    ValidationActionBar.tsx            → "Modifier les paramètres" / "Faire vérifier mon patron par Angaly"
    ReviewStatusTimeline.tsx           → stepper Brouillon → Génération → À vérifier → Correction demandée → Validé → Exporté
    CorrectionNoteCard.tsx             → commentaire couturière (état CORRECTION_REQUIRED)
    ExportPanel.tsx                    → cartes de formats PatternExportFormat + checklist du contenu de l'export
    VersionHistoryDrawer.tsx           → historique des PatternVersion, action "Restaurer cette version"
  hooks/
    usePatternVersion.ts               → charge le projet + sa version courante (pièces incluses) via react-query
    usePatternPieceSelection.ts        → état UI local : pièce sélectionnée, zoom, toggle de vue (pas de logique métier)
    useRequestReview.ts                → mutation → statut REVIEW_REQUIRED
    useExportPattern.ts                → mutation d'export par format
    useVersionHistory.ts               → liste + restauration de version
  api/
    pattern-versions.api.ts             → usePatternVersionQuery, useRequestReviewMutation, useExportPatternMutation, useRestoreVersionMutation
  consts/
    export-format-labels.const.ts
  types/
    pattern-piece-view.types.ts
  __tests__/
    usePatternVersion.test.ts
    useRequestReview.test.ts
    useExportPattern.test.ts
  index.ts
```

Toute logique (chargement, sélection de pièce, mutations de statut/export/restauration) vit
dans `hooks/` — `PatternPreviewValidationPage.tsx` et ses panneaux ne contiennent que du JSX +
appels de hooks.

## Endpoints API consommés

| Endpoint | Module | Usage |
| --- | --- | --- |
| `GET /api/pattern-projects/:id` | `patterns` | Statut, référence, projet + version courante |
| `POST /api/pattern-projects/:id/request-review` | `patterns` | Bouton "Faire vérifier mon patron par Angaly" |
| `POST /api/pattern-versions/:id/export` | `patterns` | Génère l'export au format choisi (`PatternExportFormat`) |
| `GET /api/pattern-projects/:id/versions` | `patterns` | Historique des versions (endpoint à ajouter — non encore listé dans `docs/features/patterns.md`) |
| `POST /api/pattern-versions/:id/restore` | `patterns` | Restaurer une version (endpoint à ajouter, idem) |

## Modèles Prisma touchés

`PatternProject` (statut), `PatternVersion` (pièces, `changeLabel`, `versionNumber`,
`reviewNote`), `PatternPiece` (`dimensionsJson`, `fabricRecommendation`, `quantity`,
`grainlineJson`, `seamAllowanceCm`, `notchesJson`), `PatternExport` (`format`, `mediaId` →
`Media`).

## Points d'attention

- Cette page est le "après-wizard" : `GenerationLoadingScreen` de `pattern-studio-wizard`
  redirige ici une fois la génération terminée (voir `docs/pages/pattern-studio-wizard.md`), et
  l'action "Ouvrir le projet" de `mes-projets-patron` y renvoie également.
- Les endpoints de détail projet+version courante, de listing et de restauration de version ne
  sont pas encore explicitement listés dans `docs/features/patterns.md` (qui ne couvre à ce jour
  que create/update/generate/request-review/export) — à ajouter lors de la prochaine session sur
  ce module, sans changer le principe : le use-case reste dans `patterns`, jamais côté frontend.
- Export bloqué tant que le statut n'est pas `VALIDATED` ou `EXPORTED` : le panneau d'export doit
  être désactivé côté UI **et** le backend doit refuser la requête si le statut ne le permet pas
  (voir `docs/features/patterns.md`, section "Points d'attention" sur `REVIEW_REQUIRED`).
- Le rendu technique du canvas (droit-fil, marges de couture, crans) doit être dérivé
  directement de `PatternPiece.grainlineJson`/`seamAllowanceCm`/`notchesJson` — jamais recalculé
  côté frontend (la géométrie vient exclusivement de `packages/pattern-engine`, voir ADR-005
  dans `docs/architecture.md`).
- Statut `CORRECTION_REQUIRED` : le commentaire de la couturière vit dans
  `PatternVersion.reviewNote` — l'afficher tel quel, pas de nouvelle table de commentaires à ce
  stade.
- **Ajout 2026-09-14 — `EstimatedMeasurementsBanner.tsx`** : bandeau affiché quand
  `currentVersion.parametersJson.estimatedMeasurementKeys` (nouveau champ, voir
  `docs/features/patterns.md`) est non vide, signalant que certaines mesures viennent d'une
  estimation IA plutôt que d'une saisie réelle (règle absolue #18 — jamais présenté comme
  définitif). Comme pour l'ajout du sélecteur de taille standard sur `pattern-studio-wizard`,
  l'écran Stitch n'a pas pu être revérifié dans cet environnement (`agy --print` et les outils
  MCP Stitch directs échouent tous deux, voir `docs/pages/pattern-studio-wizard.md`) — le
  bandeau réutilise le style déjà établi de `CorrectionNoteCard.tsx` (carte colorée avec icône)
  plutôt qu'une nouvelle mise en page inventée ; à confirmer contre l'écran réel.

## Checklist d'acceptation

- [ ] Les 6 écrans (A à F) de `stitch-prompts/18-*.md` sont couverts (aperçu, demande de vérification, correction demandée, validé, export, historique)
- [ ] Sélection d'une pièce dans la sidebar met à jour le canvas et le panneau de détails
- [ ] "Faire vérifier mon patron par Angaly" fait passer le statut à `REVIEW_REQUIRED` et affiche `ReviewStatusTimeline`
- [ ] Export désactivé tant que le statut n'est pas `VALIDATED`/`EXPORTED`, fonctionnel pour les 5 `PatternExportFormat`
- [ ] Historique des versions affiché, restauration fonctionnelle
- [ ] Mobile : sidebar en chips horizontales scrollables, panneau de détails en bottom sheet (voir maquette)
- [ ] Tests : `usePatternVersion.test.ts`, `useRequestReview.test.ts`, `useExportPattern.test.ts`
- [ ] `docs/checklist-implementation.md` et `docs/mockup-reference.md` mis à jour à ✅
