# Pattern Studio — pistes à reprendre (fiche autonome, 2026-10-16)

Fiche de reprise pour un **nouveau contexte**. Elle se lit seule ; pour l'historique complet : `docs/handoff.md`
(sections « 0 quatertricies » et « 0 tertricies »). Avant de coder, charger le skill **`pattern-generation`**
(`.claude/skills/pattern-generation/SKILL.md`) — obligatoire pour toute génération de patron / rendu 3D (règle 4 de
`CLAUDE.md`). Une piste = une session.

Prompt de démarrage suggéré :

```text
Lis docs/features/pattern-studio-pistes.md et implémente la piste 1 (ou 2), en suivant le skill pattern-generation.
```

---

## État de départ

- Rien n'est commité : tout le travail des sessions du 2026-10-14 → 16 est dans l'arbre de travail (`git status`).
  Ne pas faire `git checkout`/`stash` sans demander.
- Tests verts au départ : moteur 289 (couverture 92,9 %), web 482 (`pattern-studio-preview-validation-export`,
  `pattern-studio-wizard`, `mes-mesures`, `components`), API `src/patterns src/ai-inference` 154, ai-service 132,
  `pnpm typecheck` OK.
- Environnement (détails : `.claude/skills/pattern-generation/references/verification-loop.md`) :
  web **3100** (le 3000 est un autre projet), API 3003 (`API_CORS_ORIGINS=http://localhost:3000,http://localhost:3100`),
  ai-service 8001, Postgres 5432 (`angaly_user` / `angaly_dev`), MinIO 9000. Après une modification du moteur ou des types :
  `pnpm --filter @angaly/pattern-engine build` (et/ou `@angaly/types`) **puis redémarrer l'API**
  (`pkill -f "enable-source-maps dist/mai[n]"`, relancer `node --enable-source-maps dist/main` depuis `apps/api`).
- Compte propriétaire des projets : `client@angaly.mg` / `Client@Angaly2026!` (un autre compte reçoit 403).
- Le fournisseur de vision configuré (Anthropic) n'a plus de crédits : l'analyse photo de l'app échoue. Ne pas contourner ;
  si une lecture de photo est nécessaire, la faire soi-même et le dire (§1 du skill).
- Projet de référence : **robe de mariée `207c1614-bdc3-4945-b8c0-6a4a6b7ae955`** (version 10), photo Met 108161 (CC0)
  attachée, copie locale `~/angaly-eval-set/mariee-006m.jpg`. Lecture actuelle (`parametersExtJson` / `detailsJson`) :
  PRINCESSE, `manches COURTES` (sleeve 1,8, `sleevePct` 20), `col BATEAU`, `longueur SOL`, `ease AJUSTE`,
  `fullness.skirt` 3,0, bloc `PLEATED_SKIRT` 40 plis × 80 mm KNIFE, tissu STRUCTURE SATIN `#d8c597`.

---

## Piste 1 — Option d'encolure hors-épaule (bardot) — ✅ FAIT (2026-10-16, voir `docs/handoff.md` § 0 quinquetricies)

### Pourquoi

L'encolure de la photo de référence (Met 108161) dégage les épaules : bord large, posé sur le haut des bras, environ
10 cm sous la base du cou au milieu devant. Aucune option ne la produit :
- `col = BATEAU` (140 × 20 mm) est large mais **haut** au milieu devant (2 cm sous la ligne d'épaule) ; la 3D le rend en
  encolure montante ;
- les `decollete` (`SAGE` 75×75, `MOYEN` 90×80, `EN_U` 95×160, `CARRE` 110×120…) sont trop étroits : leur bord reste sur
  l'épaule.
Convention à garder en tête : `depthMm` se mesure **depuis la ligne d'épaule au cou** (calibré sur photos, banc des 31
robes : `MOYEN` = 8 cm mesurés) — ne pas la changer, elle vaut pour tous les vêtements.
`references/vocabulary.md` liste « hors-épaule (bardot) » dans « Ce qui n'est pas (encore) modélisé ».

### Quoi faire

Suivre **toute** la liste `.claude/skills/pattern-generation/references/adding-an-option.md` (10 endroits, tests de
synchronisation). Points propres à cette option :

1. **Vocabulaire** : nouvelle valeur du groupe `decollete` (proposition : `HORS_EPAULES`) dans
   `packages/types/src/pattern-detail-options.ts`, description visuelle dans `apps/ai-service/app/garment_knowledge.py`
   (`DETAIL_OPTIONS['decollete']` + règle de décision : « bord sur le haut des bras, épaules nues → `HORS_EPAULES`,
   pas `BATEAU` »), libellé dans `apps/web/src/features/pattern-studio-wizard/consts/details.const.ts`, croquis
   d'option (`pattern-studio-wizard/utils/option-sketch.ts`, le test « draws every option of every group » l'exige).
2. **Spécification** (`packages/pattern-engine/src/shared/cut-profile.ts`) : nouvelle forme `Neckline.shape`
   (ex. `'OFF_SHOULDER'`) dans `DECOLLETE`. La largeur dépasse le point d'épaule : il faut décrire le bord, pas une
   « demi-largeur d'encolure » — p. ex. profondeur au milieu devant (~100–120 mm, **à mesurer sur la photo** avec la
   hauteur de la base du cou comme repère) et hauteur du bord à l'emmanchure (~40–60 mm sous le point d'épaule).
3. **Géométrie** (`shared/shapes.ts`, fonction pure + tests) : le haut du corsage devant **et** dos devient une ligne
   continue du milieu jusqu'à l'emmanchure, sous le point d'épaule ; plus de couture d'épaule. Appliquer dans
   `rules/robe.rule.ts` (corsage, cf. `curveNeckline`, `sweetheartNeckline` pour un exemple de forme d'encolure) et
   `rules/robe-mariee.rule.ts` (bustier : l'encolure y est tracée par `{ x: neck.widthMm + 10, y: -20 }`, à remplacer
   pour cette forme). Une manche (`COURTES` bouffante sur la photo) part sous ce bord : vérifier la tête de manche
   (`sleevePiece`) et l'emmanchure raccourcie.
4. **3D** (`apps/web/src/features/pattern-studio-preview-validation-export/utils/garment3d/garment-model.ts`) :
   `restOnShoulders` (vers la ligne 1009) cale le premier rang du corsage sur la crête des épaules — c'est ce qui fait
   remonter toute encolure ; pour la forme hors-épaules, le bord doit rester sur le haut des bras / de la poitrine
   (`pushOutOfTorso` seul, ou un appui sur les bras via `env.arm`). Vérifier aussi `drapeSleeve` (la manche part plus
   bas) et `necklineSeat` (collier des cols).
5. **Lecture de la référence** : passer le projet 207c1614 à `decollete = HORS_EPAULES` (garder `col BATEAU` ou le
   retirer, sans contradiction entre `detailsJson`, `parametersExtJson` et `inspirationAnalysisJson.profile`), générer
   (`POST /api/pattern-projects/:id/generate`), capturer et comparer à la photo (face **et** côté).

### Tests attendus

- Moteur `src/__tests__/` : contour fermé, `hasSelfIntersection` faux, bord du corsage sous le point d'épaule sur toute
  sa largeur, profondeur au milieu devant, pas de changement quand l'option n'est pas choisie.
- ai-service : `tests/test_garment_knowledge.py` (normalisation, règle dans le prompt), `test_taxonomy_sync.py`.
- Web : synchro des options, croquis, et un `__tests__/garment3d<Sujet>.test.ts` sur le modèle réel
  (`RobeRule.computePieces` → `buildGarmentModel`) : le bord du corsage reste sous la hauteur des épaules
  (`bodyLandmarks(...).shoulderY`) aux côtés, épaules nues ; `referenceDressFit.test.ts` toujours vert.
- API : fixtures « détails complets » si un groupe change (`inspiration-parameters.service.spec.ts`,
  `generate-pattern-version.use-case.spec.ts`).

### Fini quand

La 3D du projet 207c1614 montre des épaules dégagées comparables à la photo, de face et de côté ; tous les tests
listés en « État de départ » sont verts ; `references/vocabulary.md`, `docs/features/pattern-engine.md`,
`docs/features/patterns.md` et `docs/handoff.md` sont à jour.

---

## Piste 2 — Avertir quand une jupe est plus étroite que son jupon — ✅ FAIT (2026-10-16, voir `docs/handoff.md` § 0 quinquetricies)

### Pourquoi

Depuis le 2026-10-16, la robe de mariée garde toujours son « Jupon / Doublure Jupe » (crinoline en dôme pour une ampleur
≥ 2,5) et la 3D pose la jupe **sur** lui. Si le tissu de la jupe est plus court, à l'ourlet, que le tour du jupon, le
patron est faux (la jupe ne peut pas recouvrir son jupon) et la 3D montre une jupe tendue, lisse, sans plis.
Cas réel : première lecture de la référence, `PLEATED_SKIRT` 32 plis × 26 mm → jupe de 0,72 + 32 × 0,026 ≈ **1,55 m**
pour un ourlet de jupon de **≈ 2,5 m** (3,0 × 74 cm × 1,13). Corrigé à la main (40 × 80 mm ≈ 3,9 m) ; rien ne l'a signalé.

### Ce qui existe

- `IPatternRule.warnings?(parameters, measurements)` (`packages/pattern-engine/src/types.ts:126`) reçoit **les mesures** ;
  il est appelé par `PatternEngine.generate` (`src/pattern-engine.ts:65`) à côté de `checkPieceGeometry`. Dans
  `rules/robe-mariee.rule.ts`, `warnings(parameters)` ignore aujourd'hui le second argument : il suffit de l'ajouter.
- Le jupon est calculé dans `computePieces` de `robe-mariee.rule.ts` (bloc « Jupon structurant ») : ourlet de la pièce
  (¼ du tour) = `max(hanche, ampleur × TOUR_TAILLE(mm) × JUPON_ROUND / 4)`, `ampleur = fullness.skirt` si > 1 (plafond
  3,6) sinon `JUPON_DEFAULT_FULLNESS` 2,2 ; `JUPON_ROUND` = 1,13.
- Tour d'ourlet de la jupe selon sa construction :
  - `PLEATED_SKIRT` (`blocks/skirt-blocks.ts`, `computePleatedSkirt`) : taille + plis × profondeur (× 2 pour `BOX`) ;
  - `GATHERED_SKIRT` : `fullness` (du bloc) × taille ;
  - `CIRCLE_SKIRT` : 2π (r_int + longueur) × fraction ;
  - jupe à panneaux de la mariée : 2 × (devant + évasement) + 4 × (côté + évasement) + 4 × (dos + 60 + évasement)
    (largeurs `largeurJupe*`, `flare` dans la règle).
  La taille utilisée par les blocs est `tourTailleJupe` (= taille + 40 + 4 × delta de coupe).

### Quoi faire

1. Extraire le calcul du jupon dans une fonction pure (p. ex. `juponProfile(parameters, measurements, profile)` dans la
   règle ou `shared/`) pour que `computePieces` **et** `warnings` partagent le même ourlet (pas de deuxième formule).
2. Calculer le tour d'ourlet de la jupe (fonction pure, une branche par construction ci-dessus) ; avertir quand il est
   < ourlet du jupon × (1 + marge, p. ex. 5 %) — message en français, avec les deux tours en cm et une suggestion
   chiffrée (plis × profondeur, ou ampleur de fronces nécessaires). Exemple :
   « Jupe plus étroite que son jupon (155 cm d'ourlet pour 251 cm) : elle ne peut pas le recouvrir. Prévoir au moins
   40 plis de 45 mm, ou réduire l'ampleur du jupon (`fullness.skirt`). »
3. Optionnel, même session si simple : règle de cohérence pour la lecture IA dans `garment_knowledge.py` (un
   `PLEATED_SKIRT` / `GATHERED_SKIRT` doit fournir au moins le tour d'ourlet donné par `fullness.skirt`), avec test.
4. Rien à changer en 3D : l'avertissement apparaît déjà dans le panneau des notices (`GenerationNoticesPanel`) via
   `parametersJson.warnings`.

### Tests attendus

`packages/pattern-engine/src/__tests__/robe-mariee.rule.test.ts` : avertit pour `PLEATED_SKIRT` 32 × 26 avec
`fullness.skirt` 3 ; n'avertit pas pour 40 × 80 ; n'avertit pas pour la jupe à panneaux par défaut ; pas d'avertissement
quand `fullness` est neutre (1 ou absent) et que la jupe est assez large. Vérifier aussi `ease-contract.test.ts`
(« CONFORT with default-valued extras is identical to no extras » compare les pièces, pas les avertissements).

### Fini quand

L'ancienne lecture (32 × 26) génère l'avertissement, l'actuelle (40 × 80) non ; tests moteur et couverture ≥ 80 % ;
`docs/features/pattern-engine.md` (section des blocs / jupon de la mariée) et `docs/handoff.md` à jour.
