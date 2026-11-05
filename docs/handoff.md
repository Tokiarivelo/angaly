# Fiche de Passation Inter-Agents (Handoff)

> **Date** : 2026-11-05 · **Dernière mise à jour par** : Claude Code (lot 4 du plan rendu 3D studio : vues caméra)
> **Format** : 5 rubriques fixes, **150 lignes maximum**. On **remplace** les rubriques, on n'empile pas les sessions.
> Avant de réécrire, déplacer le résumé de la session précédente (rubrique 2) en haut de
> `docs/handoff-archive/<AAAA-MM>.md`. Historique jusqu'au 2026-10-23 : `docs/handoff-archive/2026-10-et-avant.md`
> (non lu par défaut, grep seulement). Protocole complet : `AGENTS.md` § « Handoff ».

Consigne de reprise pour une nouvelle session ou un nouvel agent :

```text
Lis docs/handoff.md et poursuis le travail selon les priorités définies.
```

Avec Claude Code : `/start` (skill `.claude/skills/start/`, même procédure, en lisant le minimum).

---

## 1. État du dépôt

- Branche `master`, dernier commit `4fd4b20`. **Non commité, trois sessions du 2026-11-05** :
  - session « ressources de dev » : `Makefile`, `package.json`, `apps/web/{next,vitest,playwright}.config.ts`,
    `packages/config/vitest/base.ts`, `packages/{types,storage,pattern-engine}/tsconfig.build.json`, ai-service
    (`app/feature_flags.py`, `local_model.py`, `local_vision.py`, `main.py`, `tests/conftest.py`,
    `tests/test_local_models_switch.py`), cloth-sim (`measure_guide.py`, `scripts/render_measure_guide.py`, test),
    2 images `measurement-guide/` + `index.json`, `docs/development.md`. Commits suggérés : `chore(config)`,
    `feat(ai)` (interrupteur), `feat(web)` (images du guide) ;
  - session lot 3 : `features/pattern-studio-preview-validation-export/` — `hooks/useStudioSettings.ts`,
    `utils/studio3d/studio-settings.ts`, `ui/StudioControls.tsx`, leurs tests, `e2e/pattern-studio/reglages-rendu.spec.ts`,
    `ui/{Garment3DPanel,Garment3DViewer,RealisticRenderViewer,RealisticRenderSection}.tsx`, `ui/studio3d/StudioLights.tsx`.
    Commit suggéré : `feat(web): studio render settings in the 3D viewers` ;
  - session lot 4 (cette session) : nouveaux `utils/studio3d/{camera-tween,camera-views}.ts` + tests
    `utils/studio3d/__tests__/camera-{tween,views}.test.ts`, `e2e/pattern-studio/vues-camera.spec.ts` ; modifiés
    `ui/Garment3DViewer.tsx` (`CameraRig` animé, `hemY`), `ui/Garment3DPanel.tsx` (boutons 3/4 / Ourlet, touches 5 / 2),
    `__tests__/Garment3DPanel.test.tsx` ; docs (fiche page, plan, checklist, handoff + archive). Les lots 3 et 4 touchent
    les mêmes fichiers `Garment3DViewer/Panel` : commiter le lot 3 puis le lot 4 avec `git add -p`, ou ensemble.
    Commit suggéré : `feat(web): 3/4 and hem camera views with eased transitions`.
- Tests au 2026-11-05 (fin de lot 4) : `pnpm typecheck` 10/10 ; web **355 fichiers ✓ (1 ignoré), 1 543 tests,
  coverage lignes 86,2 %, fonctions 80,2 %** ; e2e `pattern-studio/vues-camera` ✓ (28 s, GPU). Lint des fichiers
  touchés : 0 erreur.

## 2. Dernière session (2026-11-05, Claude Code) — lot 4 : vues caméra prédéfinies, transitions douces

- Vues **3/4** (35° de la face, au-dessus de la taille, touche `5`) et **Ourlet** (gros plan du bas du vêtement,
  touche `2`) ajoutées au groupe « Vues » du panneau 3D. Détails : fiche
  `docs/pages/pattern-studio-preview-validation-export.md` § « Vues caméra prédéfinies, transitions douces ».
- Positions des vues sorties du viewer : `utils/studio3d/camera-views.ts` (`viewPose`, `hemHeight` = point le plus bas
  des panneaux devant/dos principaux, genou à défaut). `ViewName` réexporté par `Garment3DViewer`.
- Transition 600 ms `cubic-bezier(0.65, 0, 0.35, 1)` (`camera-tween.ts`, pur) : la caméra tourne autour de la cible
  par le plus court chemin ; instantanée sous `prefers-reduced-motion` ; annulée dès que l'utilisateur saisit la vue.
- Stitch revu via `agy --print` : aucun groupe de vues caméra dans la maquette → style du groupe existant gardé (écart noté).
- e2e : une capture d'écran est trop lente pour saisir 600 ms → le test compte les images dessinées (0 au repos,
  ≈ 12 pendant la transition). Captures 3/4 et ourlet relues : cadrage correct.
- Pas de commit (consigne : commits sur demande de l'utilisateur).

## 3. Prochaines actions (dans l'ordre)

1. Faire relire/commiter les changements des trois sessions (rubrique 1) ; confirmer la stabilité de `make dev` en
   usage réel (Pattern Studio 3D ouvert + API + ai-service).
2. **Lot 5 de `docs/plans/studio-3d-rendering.md`** (capture HD + planches de revue) : lire §0 + « Lot 5 ».
   `viewPose` (`utils/studio3d/camera-views.ts`) donne les poses pour `setView(v)` du hook de capture ;
   `e2e/pattern-studio/reglages-rendu.spec.ts` capture déjà le canevas par éclairage. Écran Stitch à revoir
   (`agy --print`) pour le bouton « Capture HD ».
3. Restes de `docs/plans/pattern-construction-suite.md` :
   - Lot 1 (écran Stitch du catalogue) **bloqué** : prompt prêt dans `stitch-prompts/34-pattern-studio-catalogue.md`,
     à créer à la main dans Stitch ;
   - Lot 5 (le modèle local de vision apprend `construction`) — **en pause** tant que les modèles locaux sont coupés ;
   - couleur propre du tablier (`APRON`) en 3D : porter la couleur sur la zone de détail comme `DetailArea.color` ;
     petites taches sombres sur le tablier vert dans l'aperçu 3D (projet du compte client, encore visibles sur les
     captures du lot 4) ;
   - republier l'artefact des planches https://claude.ai/artifact/PYe887bFgkSq2v93mchkcV.
4. Si la RAM manque encore : builder SWC pour Nest (`nest start --watch` ≈ 670 Mo, `@swc/cli` + `@swc/core` à installer).

## 4. Pièges encore actifs

- **Ports** : web sur **3001** via `make dev.web` (ou `make dev`) — `WEB_PORT ?= 3001` dans le `Makefile` ; 3000 = un
  autre projet. API 3003 (`apps/api/.env` : `API_CORS_ORIGINS="http://localhost:3001"`) ; ai-service 8001 ; MinIO 9000 ;
  Postgres 5432. Logins de seed : `packages/database/prisma/seed.ts`. Les projets de patron ne s'ouvrent qu'avec le
  compte propriétaire (les projets du catalogue appartiennent à `client@angaly.mg`).
- **Modèles locaux coupés** : une analyse photo sans provider joignable retombe sur `fallback-0.0.0` (plus de repli CLIP).
  Les tests ai-service les réactivent via `tests/conftest.py`.
- **Paquets en `composite`** : `dist/.tsbuildinfo` vit dans `dist/` ; si un `dist/*.js` disparaît seul, supprimer tout
  `dist/` avant de rebuilder.
- **Sessions en parallèle** : ne pas relancer l'API 3003 partagée si une autre session tourne ; tester sur une 2e instance
  (ex. 3023, `outDir` séparé) ; modifications ciblées sur les fichiers partagés, relus juste avant.
- **Playwright** : `pnpm test:e2e -- <filtre>` ne filtre pas (lance tout) → `pnpm exec playwright test <fichier>`.
  WebGL GPU en local ; `PLAYWRIGHT_SOFTWARE_GL=1` pour SwiftShader (lent : le rendu réaliste n'y charge pas en 60 s).
- **TypeScript** : `exactOptionalPropertyTypes` → `field?: T | undefined` pour un champ qui peut recevoir `undefined`.
- **`agy -p --dangerously-skip-permissions`** est refusé en mode auto de Claude Code : utiliser `agy --print` simple
  (fonctionne en lecture), sinon session interactive ou MCP Stitch. Arrêter des processus (`kill`) est aussi refusé.
- **zsh** : ne pas nommer une variable de boucle `path` (écrase `PATH`).
- **Rendu 3D studio** : tout matériau à carte de relief (bump/normal) doit passer par `utils/studio3d/normal-guard.ts`
  (une normale NaN = pixel noir après post-traitement) ; un objet transparent, en surimpression ou découpé (alphaTest)
  est exclu de l'AO automatiquement (`excludedFromAo`). Caméra : une vue passe par `viewPose` + `CameraRig` (animé) ;
  ne pas repositionner la caméra ailleurs sans annuler la transition en cours.
- **Guide des mesures** : `make job.cloth VERSION=65c7c31b-66a6-47c7-8338-f5372e8931bb` (fourreau du catalogue) puis
  `make guide.cloth ARGS="--only CLÉ"` (≈ 45 s par image).
- Données de travail hors dépôt : `~/angaly-catalog-inspirations/` (photos), `~/angaly-catalog-run/results.json`
  (projets du catalogue : fourreau df576026, péplum 3a7ebe43, biais e6966074, portefeuille 16c37a2a, dirndl 0099e9eb,
  paysanne 6ec398b0).

## 5. Plans ouverts

| Plan                                               | Statut                                                | À lire pour reprendre |
| -------------------------------------------------- | ----------------------------------------------------- | --------------------- |
| `docs/plans/studio-3d-rendering.md`                | lots 1-4 faits et vérifiés, 4/5 ; lot 5 suivant       | §0 + « Lot 5 »        |
| `docs/plans/pattern-construction-suite.md`         | lots 2-4 faits, 1 bloqué, 5 en pause (modèles locaux) | §0 + le lot en cours  |
| `docs/phases/phase-5b-fidelite-photo-et-drapes.md` | voir `docs/checklist-implementation.md` (grep « 5b ») | la session visée      |
