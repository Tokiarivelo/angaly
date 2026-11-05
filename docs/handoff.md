# Fiche de Passation Inter-Agents (Handoff)

> **Date** : 2026-11-05 · **Dernière mise à jour par** : Claude Code (lot 2 du plan rendu 3D studio)
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

- Branche `master` : la session doc, les lots 1-2 du plan rendu 3D et le passage du web au port 3001 sont **commités**
  (4 commits après `57a2102`, voir `git log`). Rien d'autre en attente.
- Lot 2 : modifiés `ui/RealisticRenderViewer.tsx`, `ui/Garment3DViewer.tsx` (fond déplacé), `ui/studio3d/StudioPost.tsx`,
  `utils/studio3d/{studio-config,studio-scene,studio-composer}.ts` ; nouveaux `ui/studio3d/StudioBackdrop.tsx`,
  `__tests__/RealisticRenderViewer.test.tsx`.
- Tests au 2026-11-05 (lot 2) : `pnpm typecheck` 10/10, eslint propre ; suite web 344 fichiers ✓, 8 en échec dont
  6 par délai sous charge (repassent seuls : contact, demande-sur-mesure, fiche-produit, PatternPreviewValidationPage,
  pret-a-porter, reservation-essayage) et les 2 **antérieurs** : `apps/web/.headdump/dump.test.ts`,
  `MeasurementGuideImage.test.tsx` (`PENTE_EPAULE.webp` absente). Ces 2 échecs empêchent l'écriture du rapport de
  coverage (dernier chiffre connu : lignes 85,8 %, lot 1).

## 2. Dernière session (2026-11-05, Claude Code) — lot 2 du plan rendu 3D studio

- `RealisticRenderViewer` monte le studio du lot 1 tel quel (softboxes PMREM, clé avec ombre VSM, sol « ombre seule »,
  GTAO, MSAA, `NeutralToneMapping`, niveaux de qualité, shaders préchauffés) ; les 3 lumières fixes ont disparu.
- Fond papier gris sorti de `Garment3DViewer` vers `ui/studio3d/StudioBackdrop.tsx` (réutilisé par les deux viewers).
- Ombres du `.glb` : `applyStudioShadows` (`utils/studio3d/studio-scene.ts`) — reçoit toujours, projette sauf couche
  transparente (fil de broderie). AO à 0,9 sur les plis simulés (`SIMULATED_CLOTH_AO_BLEND`, option `aoBlend`).
- Smocks/broderie du rendu réaliste passent par `withNormalGuard`.
- Tests : `__tests__/RealisticRenderViewer.test.tsx` (nouveau, 4), `studio-scene`/`studio-composer` complétés ;
  `studio3dComponents.test.tsx` ajusté (6e argument du composer).
- **Non fait** : e2e `rendu-realiste.spec.ts` et revue visuelle avant/après. L'API 3003 était arrêtée (watcher resté
  d'une session précédente, serveur « Terminated ») et son redémarrage a été refusé en mode auto.
- Détails : fiche page, section « 2026-11-05 — Rendu réaliste sur le même studio ».

## 3. Prochaines actions (dans l'ordre)

1. **Vérifier le lot 2 à l'écran** : arrêter l'ancien `next dev` du port 3100 s'il tourne encore, `make dev` (web 3001 +
   API 3003 avec le nouveau CORS) (personne d'autre ne l'utilise ; un ancien `nest start --watch`
   sans serveur peut traîner : `ps aux | grep nest`), puis `pnpm --filter @angaly/web test:e2e -- pattern-studio/rendu-realiste`
   et captures avant/après du rendu réaliste (plis plus marqués, aucun pixel noir, couleurs proches de l'aperçu).
   Si l'AO 0,9 grise trop : baisser `SIMULATED_CLOTH_AO_BLEND` (`utils/studio3d/studio-config.ts`).
2. Hors plan, rapide : supprimer ou exclure `apps/web/.headdump/` des tests ; ajouter `PENTE_EPAULE.webp` (débloque
   le rapport de coverage).
3. **Lot 3 de `docs/plans/studio-3d-rendering.md`** (réglages studio dans le viewer) : lire §0 + « Lot 3 » ; mesurer
   les fps sur un vrai GPU (critère du lot 1). Écran Stitch à revoir (JSX de contrôles).
4. Lots 4 → 5 du même plan, un par session.
5. Restes de `docs/plans/pattern-construction-suite.md` :
   - Lot 1 (écran Stitch du catalogue) **bloqué** : prompt prêt dans `stitch-prompts/34-pattern-studio-catalogue.md`,
     à créer à la main dans Stitch ;
   - Lot 5 (le modèle local de vision apprend `construction`) ;
   - couleur propre du tablier (`APRON`) en 3D : porter la couleur sur la zone de détail comme `DetailArea.color` ;
   - republier l'artefact des planches https://claude.ai/artifact/PYe887bFgkSq2v93mchkcV.

## 4. Pièges encore actifs

- **Ports** : web sur **3001** via `make dev.web` (ou `make dev`) — `WEB_PORT ?= 3001` dans le `Makefile` ; 3000 = un
  autre projet. API 3003 (`apps/api/.env` : `API_CORS_ORIGINS="http://localhost:3001"`) ; ai-service 8001 ; MinIO 9000 ;
  Postgres 5432.
  Logins de seed : `packages/database/prisma/seed.ts`. Les projets de patron ne s'ouvrent qu'avec le compte propriétaire
  (les projets du catalogue appartiennent à `client@angaly.mg`).
- **Sessions en parallèle** : ne pas relancer l'API 3003 partagée si une autre session tourne ; tester sur une 2e instance
  (ex. 3023, `outDir` séparé) ; modifications ciblées sur les fichiers partagés, relus juste avant.
- **API 3003** : peut encore être une ancienne build (`GET /api/pattern-catalog` → 404) ; la relancer seulement si
  aucune autre session ne l'utilise.
- **TypeScript** : `exactOptionalPropertyTypes` → `field?: T | undefined` pour un champ qui peut recevoir `undefined`.
- **`agy -p --dangerously-skip-permissions`** est refusé en mode auto de Claude Code : utiliser `agy --print` simple
  (fonctionne en lecture), sinon session interactive ou MCP Stitch.
- **zsh** : ne pas nommer une variable de boucle `path` (écrase `PATH`).
- **Rendu 3D studio** : tout matériau à carte de relief (bump/normal) doit passer par `utils/studio3d/normal-guard.ts`
  (une normale NaN = pixel noir après post-traitement) ; un objet transparent, en surimpression ou découpé (alphaTest)
  est exclu de l'AO automatiquement (`excludedFromAo`). Captures Playwright headless = SwiftShader : lent, fps non
  représentatifs.
- Données de travail hors dépôt : `~/angaly-catalog-inspirations/` (photos), `~/angaly-catalog-run/results.json`
  (projets du catalogue : fourreau df576026, péplum 3a7ebe43, biais e6966074, portefeuille 16c37a2a, dirndl 0099e9eb,
  paysanne 6ec398b0).

## 5. Plans ouverts

| Plan                                               | Statut                                                | À lire pour reprendre |
| -------------------------------------------------- | ----------------------------------------------------- | --------------------- |
| `docs/plans/studio-3d-rendering.md`                | lots 1-2 faits, 2/5 ; lot 2 à vérifier à l'écran      | §0 + le lot en cours  |
| `docs/plans/pattern-construction-suite.md`         | lots 2-4 faits, 1 bloqué, 5 à faire                   | §0 + le lot en cours  |
| `docs/phases/phase-5b-fidelite-photo-et-drapes.md` | voir `docs/checklist-implementation.md` (grep « 5b ») | la session visée      |
