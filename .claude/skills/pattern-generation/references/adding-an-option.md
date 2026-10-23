# Ajouter (ou modifier) une option de détail — liste de contrôle

Exemples complets : `devant: MANTEAU_OUVERT` + `fermeture: CORDELIERE` (session du 2026-10-14), les manches `EVEQUE`…`CAP`,
le col `CHALE`. Faire **toutes** les étapes dans le même changement ; cocher chacune.

## 1. Vocabulaire partagé
- [ ] `packages/types/src/pattern-detail-options.ts` : ajouter l'id (un groupe par ligne, `group: ['ID', …],` — le test python
      parse ce fichier). Nouveau groupe = nouvelle ligne.
- [ ] Champ de fit informatif (couleur, tenue) : `GarmentFit` dans `packages/types/src/pattern-fit.ts`.
- [ ] `pnpm --filter @angaly/types build` (l'API et le web lisent `dist/`).

## 2. Lecture (ai-service)
- [ ] `apps/ai-service/app/garment_knowledge.py` → `DETAIL_OPTIONS[group][ID]` : description **visuelle** (ce que l'œil voit).
- [ ] Règle de décision dans le prompt (section « Choix de la famille… ») quand l'option se confond avec une autre.
- [ ] Nouveau groupe non pertinent pour jupe/pantalon : l'ajouter à l'ensemble filtré près de `_NO_SLEEVES_NECK_FOR`.
- [ ] Nouveau champ de fit : `schemas.py` (alias camelCase) + `normalize_fit` (validation, liste `informative`).
- [ ] Tests `tests/test_garment_knowledge.py` (normalisation garde/rejette la valeur, le prompt contient la règle) ;
      `tests/test_taxonomy_sync.py` vérifie la synchro avec `@angaly/types`.

## 3. Wizard (web)
- [ ] `apps/web/src/features/pattern-studio-wizard/consts/details.const.ts` : libellé français. Le test
      `details-options-sync.test.ts` échoue tant que les ids diffèrent.

## 4. API
- [ ] Rien à coder en général (validation et `missingGroups` lisent `PATTERN_DETAIL_OPTIONS`), **mais** un nouveau groupe change
      `missingGroups` : mettre à jour `inspiration-parameters.service.spec.ts` et les fixtures « détails complets » de
      `generate-pattern-version.use-case.spec.ts`.
- [ ] Redémarrer l'API après les builds (`references/verification-loop.md`).

## 5. Moteur (géométrie)
- [ ] Choisir l'endroit : spécification (`shared/cut-profile.ts` : `resolveSleeve`, `resolveNecklineChoice`…), forme
      (`shared/shapes.ts` : fonction pure, `Outline` fermé, mm, pas de dépendance), application (`rules/<type>.rule.ts`).
- [ ] Constantes nommées et commentées (pas de nombre magique), comme `COAT_OPEN_*`, `GIGOT_*`, `SLEEVE_CAP_SEGMENTS`.
- [ ] Noms de pièces **stables et parlants** : la 3D les classe par nom (`corsage`/`jupe` + `devant`/`dos`, `manche`, `col…`,
      `plastron`, `cordelière`). Renommer une pièce = vérifier `classifyPiece`, `collarKindOf`, `layout.trims`.
- [ ] Tests Vitest `src/__tests__/<sujet>.test.ts` : contour fermé, `hasSelfIntersection` faux, mesures qui caractérisent la
      forme (largeurs à des hauteurs données), absence de la pièce quand l'option n'est pas choisie.
- [ ] Un test dépend d'indices de points (`outline[3]`) ? Le réécrire en relatif (`o[o.length - 3]`) : les contours gagnent des
      points (courbes).

## 6. Rendu 3D (web, `utils/garment3d/`)
- [ ] La pièce est-elle posée ? Sinon elle finit dans `model.ignored` : l'ajouter à la classification (`classifyPiece`,
      `collarKindOf`, `layout.trims`) et à `drapeGarment`.
- [ ] Nouvelle zone de panneau : unions `PanelRole` / `zone` + `ZONE_COLORS` (`ui/Garment3DViewer.tsx`) + choix du tissu.
- [ ] Pièges déjà rencontrés :
  - rang de patron très étroit (bord en biais) ⇒ `along = x × k` part à la couture côté ⇒ **jour** dans le vêtement ; voir
    `SKIRT_TOP_SLOPE_MM` ;
  - anneau très large accroché au bras incliné ⇒ **lame** plate ; voir `PUFF_RING_FROM/FULL` ;
  - manche courte très large ⇒ **ailes** si la longueur est fausse ; vérifier `sleevePct` avant de toucher à la 3D ;
  - remplissage calé sur l'étendue d'un rang ⇒ bande le long d'une couture ; filtrer par médiane (plastron).
- [ ] Tests Vitest `__tests__/garment3d<Sujet>.test.ts` sur le modèle réel (`RobeRule.computePieces` → `buildGarmentModel`) :
      dimensions, positions (milieu devant, taille), absence quand l'option n'est pas choisie.
- [ ] `referenceDressFit.test.ts` doit rester vert (couverture des épaules, longueur de manche de la robe de référence).

## 7. Docs
- [ ] `docs/features/pattern-engine.md` (vocabulaire / géométrie), `docs/features/patterns.md` (flux),
      `references/vocabulary.md` de ce skill, `docs/handoff.md`.
