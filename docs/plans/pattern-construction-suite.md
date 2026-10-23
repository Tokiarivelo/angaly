# Plan d'implémentation — suite des pièces de construction et du catalogue des patrons

> Rédigé le 2026-10-23 par Claude Code, après les sessions du 2026-10-21 (`docs/handoff.md` § sexquadragies et
> quinquadragies, `docs/reviews/dress-pattern-catalog.md` §6–7). Ce plan couvre les cinq écarts restants. Chaque lot
> est autonome, se livre avec ses tests et se vérifie en 3D sur les projets réels du catalogue.

## 0. Avant de commencer (tous les lots)

1. Lire `docs/handoff.md` (section la plus récente), puis la section du lot ci-dessous.
2. **Relancer l'API 3003** si ce n'est pas fait : sans cela, ni `construction` ni `GET /api/pattern-catalog` ne
   répondent (404). Vérifier qu'aucune autre session ne l'utilise (`docs/handoff.md`, activité récente du dépôt) ;
   sinon travailler sur une seconde instance (§7).
3. Règles du dépôt qui s'appliquent ici (`CLAUDE.md`) : `packages/pattern-engine` reste la seule source de géométrie,
   types partagés dans `@angaly/types`, tout média passe par MinIO via `@angaly/storage`, maquette Stitch réelle avant
   tout JSX/CSS, tests dans le même changement, `docs/handoff.md` à jour avant de clore.
4. Skill obligatoire pour les lots 2 à 5 : `pattern-generation` (`.claude/skills/pattern-generation/SKILL.md`),
   boucle « capturer la 3D → comparer à la photo → corriger à l'étage fautif ».
5. Données de travail hors dépôt (déjà présentes sur la machine) :
   - photos d'inspiration : `~/angaly-catalog-inspirations/` (`chosen.json`, `candidates*.jsonl`) ;
   - 36 projets réels (compte `client@angaly.mg`) : `~/angaly-catalog-run/results.json`, captures `3d/`.

### Ordre conseillé

| Ordre | Lot | Pourquoi dans cet ordre | Charge estimée |
|---|---|---|---|
| 1 | Lot 1 — Maquette Stitch du catalogue | débloque la conformité visuelle de la page | 0,5 j |
| 2 | Lot 2 — Paniers et tournure portent la jupe en 3D | défaut de silhouette le plus visible (robes 1750, 1780, 1885, 1924) | 1,5 j |
| 3 | Lot 3 — Broderie et smocks rendus comme motifs | détail visuel, indépendant du lot 2 | 1,5 j |
| 4 | Lot 4 — Photos d'inspiration plus fidèles | données seulement, aucun code produit | 0,5 j |
| 5 | Lot 5 — Le modèle local de vision apprend `construction` | dépend de lectures étiquetées (lot 4 en fournit) | 2 j |

---

## Lot 1 — Maquette Stitch dédiée « Catalogue des patrons »

> **Statut 2026-10-23 : bloqué** — génération Stitch en délai dépassé (×2 de plus) ; prompt prêt dans
> `stitch-prompts/34-pattern-studio-catalogue.md`, à créer à la main (voir `docs/handoff.md`).

### Constat

La page `/pattern-studio/catalogue` (`apps/web/src/features/pattern-studio-catalog/`) reprend les composants de l'écran
réel « ANGALY — Mes projets de patron », faute d'écran dédié. La génération a échoué quatre fois (trois appels MCP
`generate_screen_from_text`, un `agy --print`, tous en délai dépassé). `docs/mockup-reference.md` porte la mention
« à générer ».

### Étapes

1. Générer l'écran dans le projet Stitch `3703874896720765754` :
   - d'abord une session **`agy` interactive** (le mode `--print` échoue en sans-tête, voir `CLAUDE.md` étape 1) ;
   - sinon l'interface web de Stitch, à la main, avec le prompt de `docs/pages/pattern-studio-catalogue.md` §Maquette.
   - Titre exact : « ANGALY Pattern Studio — Catalogue des patrons ». Même design system que « Mes projets de patron ».
2. Récupérer l'écran (`mcp__stitch__list_screens` puis `get_screen` : capture + HTML) et noter son identifiant.
3. Comparer à la page actuelle, élément par élément : en-tête, puces de filtre, recherche, carte (rapport photo, ordre
   période → nom → description → méta → crédit → actions), boutons, état vide, état de chargement, fenêtre « Voir les pièces ».
4. Réaligner le JSX/les classes **uniquement** là où l'écran diffère :
   - `ui/PatternCatalogPage.tsx`, `ui/CatalogCard.tsx`, `ui/CatalogPiecesDialog.tsx` ;
   - garder les couleurs fixes de la maquette dans les cartes (#061938, #5C697A), parce que le thème sombre de l'espace
     client éclaircit `text-angaly-primary`.
5. Ajouter un prompt mémo `stitch-prompts/<n>-pattern-studio-catalogue.md` (prompt utilisé + identifiant d'écran).

### Tests

- `__tests__/PatternCatalogPage.test.tsx` : adapter les sélecteurs si la copie ou la structure change (libellés exacts
  de l'écran).
- Capture Playwright desktop 1440 px et mobile 400 px, comparée à la capture Stitch : script de la session précédente
  (`page.route` 3003 → API de test, connexion client).

### Fait quand

- La ligne de `docs/mockup-reference.md` porte le vrai titre d'écran et le statut ✅.
- `docs/pages/pattern-studio-catalogue.md` ne mentionne plus « non généré ».
- Les tests passent et les captures concordent avec l'écran.

---

## Lot 2 — Paniers, coussin et pouf portent la jupe en 3D

> **Statut 2026-10-23 : fait** — voir `docs/handoff.md` (session du 2026-10-23).

### Constat

`BUSTLE {style: PANIERS | COUSSIN | POUF}` produit les pièces du patron (« Panier (poche de hanche) » ×4,
« Coussin de tournure » ×2, « Drapé de tournure (pouf) »), mais en 3D :

- paniers et coussin sont des pièces intérieures (`INSIDE_NAMES` dans `garment-model.ts`), donc la jupe ne s'élargit
  pas aux hanches (robe à la française 1750, robe de style 1924) et ne se cambre pas au dos (tournure 1885) ;
- seul le pouf est drapé, posé sur la jupe sans la soulever (`construction-model.ts`, `poufPanel`).

### Mécanisme existant à réutiliser

Le jupon (« Jupon / Doublure Jupe ») soutient déjà la jupe : `petticoatRadius` donne un rayon par hauteur, puis
`zoneDrape(...).support(y)` prend `supportMax([env.torso(y), anneau du jupon])` et la jupe se drape par-dessus
(`garment-model.ts`, `zoneDrape`, ~l. 771). Un `Support` est un `Float32Array(ANGLES)` : un rayon par angle. Une
forme non circulaire (large aux hanches, plate devant/derrière ; ou bombée au dos) s'y exprime donc directement.

### Conception

1. **Nouveau module pur** `utils/garment3d/understructure.ts` (aucune dépendance three.js) :
   ```ts
   export type UnderstructureKind = 'PANIERS' | 'COUSSIN';
   export interface Understructure { kind: UnderstructureKind; widthMm: number; depthMm: number; }
   /** Rayon supplémentaire (m) par angle à une hauteur, ou null hors de la structure. */
   export const understructureSupport = (u: Understructure, waistY: number, angles: number):
     ((y: number, torso: Float32Array) => Float32Array | null);
   ```
   - **PANIERS** : de 3 cm sous la taille jusqu'à ~35 cm sous la taille, demi-ellipse de chaque côté :
     `r(θ) = torso(θ) + W · |sin θ|^p · profil(y)` avec `W` = profondeur de la poche (`depthMm` du « Panier », 300 mm,
     à moduler entre 0,6 et 1 × selon l'ampleur de la jupe), `p ≈ 3` (plat devant et derrière),
     `profil(y)` en cloche (0 à la taille, 1 vers −20 cm, 0,7 en bas de la poche).
   - **COUSSIN** : demi-lune au dos, du creux des reins à ~20 cm dessous :
     `r(θ) = torso(θ) + H · max(0, −cos θ)^2 · profil(y)` avec `H` = 120 mm (hauteur de la demi-ellipse du coussin).
   - Mesures lues sur la pièce du moteur (boîte englobante), comme les autres pièces de construction.
2. **Classement** (`buildGarmentModel`) : sortir « panier (poche de hanche) » et « coussin de tournure » de
   `INSIDE_NAMES` (petite modification, après lecture à jour du fichier : l'autre session l'édite aussi) ; les ranger
   dans un nouveau champ `GarmentLayout.understructure?: Understructure[]` (toujours listées comme pièces intérieures
   dans `inside` pour l'atelier, mais pas drapées).
3. **Support** (`zoneDrape`) : pour la zone `skirt`, prendre le max entre le support actuel et
   `understructureSupport(...)` à chaque hauteur. La jupe se drape alors par-dessus, comme sur un jupon.
4. **Pouf** (`construction-model.ts`, `poufPanel`) : le poser sur la surface de la jupe déjà soulevée par le coussin
   (rien à changer si la surface est relue après le drapé de la jupe : c'est déjà le cas).
5. **Optionnel** : dessiner les paniers en filaire très léger, seulement en vue « éclatée », pour l'atelier.

### Tests (web, Vitest)

Nouveau `__tests__/understructure.test.ts` (fonction pure) :
- paniers : rayon augmenté sur les côtés (θ = ±90°) d'au moins 0,8·W au creux, inchangé à θ = 0 et θ = 180° (< 1 cm),
  rien au-dessus de la taille ni sous la poche ;
- coussin : bosse au dos seulement, maximum sous la taille, nulle devant.

Dans `garment3dConstructionPieces.test.ts` :
- avec `BUSTLE PANIERS`, la largeur de la jupe aux hanches (x max des panneaux `skirt` à la hauteur du bassin)
  dépasse celle sans paniers d'au moins 15 cm, et la profondeur (z) reste à ±2 cm ;
- avec `BUSTLE COUSSIN`, le z minimal de la jupe au dos (sous la taille) recule d'au moins 8 cm.

### Vérification 3D

Recapturer `francaise-1750`, `polonaise-1780`, `tournure-1885`, `robe-de-style-1924`
(`apps/ai-service/ml/scripts/dress_3d_capture.mjs`, filtre de `results.json`) et comparer aux photos : silhouette
large aux hanches de face, plate de profil (1750) ; cambrure au dos de profil (1885).

### Fait quand

Les quatre robes ont la silhouette de leur photo, face et côté, et les tests passent. Mettre à jour
`docs/reviews/dress-pattern-catalog.md` §7 (limite 1 levée) et le vocabulaire du skill.

---

## Lot 3 — Broderie et smocks rendus comme des motifs

> **Statut 2026-10-23 : fait** — voir `docs/handoff.md` (session du 2026-10-23, lot 3).

### Constat

`EMBROIDERY` et `SMOCKING` posent une zone de détail sur la pièce hôte (`InternalLine.detail`). La 3D la dessine comme
un aplat : broderie dans le tissu contrastant (`contrast: true`), smocks dans le tissu de la robe, sans motif ni relief.

### Conception

1. **Moteur** (`packages/pattern-engine/src/types.ts`, `DetailArea`) : ajout facultatif, rétrocompatible :
   ```ts
   /** How the 3D draws the area: a motif instead of plain cloth. */
   motif?: 'BRODERIE' | 'SMOCKS';
   /** Thread or motif colour (#rrggbb). */
   color?: string;
   ```
   `shared/construction.ts` le renseigne dans `embroidery()` (`motif: 'BRODERIE'`, `color: item.color`) et dans
   `smocking()` (`motif: 'SMOCKS'`). Ne pas toucher `contrast` (compatibilité des anciennes versions).
2. **Lecture web** (`utils/garment3d/detail-patch.ts`, `detailAreasOf`) : lire `motif` et `color` dans `DetailSpec`.
3. **Panneau** (`garment-model.ts`, `detailPanel`) : reporter `motif` et `trimColor` sur `PanelMeshData` (nouveau champ
   facultatif `motif?: 'BRODERIE' | 'SMOCKS'`).
4. **Textures** (`ui/fabricTextures.ts`, à côté de `laceAlphaMap`) : deux générateurs Canvas déterministes :
   - `embroideryMap(color)` : rinceaux et fleurs (courbes de Bézier en fil, points de nœud), carreau de ~8 cm,
     fond transparent : appliqué en **alphaMap + couleur du fil**, posé au-dessus du tissu ;
   - `smockingMaps()` : nid d'abeille en losanges (pas ~12 mm) : **normalMap** (relief) + légère **aoMap**, sur le tissu
     de la robe.
   Les UV des patchs sont déjà en mètres sur la pièce (`drapePatch`) : régler `repeat` pour l'échelle réelle.
5. **Rendu** (`ui/Garment3DViewer.tsx`) : dans `Panel`/`ClothMaterial`, si `panel.motif === 'BRODERIE'`, dessiner une
   couche transparente (comme `LacePanel`) avec `embroideryMap` ; si `'SMOCKS'`, le tissu de la robe avec la normalMap
   des smocks. Modifications ponctuelles (fichier partagé avec d'autres sessions : relire juste avant).
6. **Rendu réaliste Blender** (`apps/cloth-sim`) : hors périmètre ; noter la limite.

### Tests

- Moteur (`construction.test.ts`) : les zones de broderie portent `motif: 'BRODERIE'` et la couleur du fil ; celles des
  smocks `motif: 'SMOCKS'`.
- Web : `detailPatch.test.ts` lit `motif`/`color` (et ignore une valeur inconnue) ; `garment3dConstructionPieces.test.ts`
  : le panneau de broderie a `motif === 'BRODERIE'` et `trimColor` ; `fabricTextures` : test des générateurs (taille du
  canvas, pixels non vides, déterminisme : deux appels donnent la même image).

### Vérification 3D

Recapturer `paysanne-smocks`, `dirndl` (broderie d'encolure), `romantique-1835` si une broderie y est ajoutée ; zoomer
sur l'encolure et le plastron : motif lisible, relief des smocks visible en lumière rasante.

### Fait quand

La broderie se lit comme un motif dans sa couleur de fil et les smocks comme un nid d'abeille. Mettre à jour
`docs/features/pattern-engine.md` (champ `motif`), le vocabulaire et la revue (§7 limite 2).

---

## Lot 4 — Photos d'inspiration plus fidèles

> **Statut 2026-10-23 : fait** — voir `docs/handoff.md` (session du 2026-10-23, lot 4) et
> `docs/reviews/dress-pattern-catalog.md` §7 limite 3.

### Constat

Pour quelques robes, la photo retenue est « la plus proche » sous licence libre et diffère du modèle :

| Robe | Photo actuelle | Écart |
|---|---|---|
| `peplum` | haut à basque (Commons) | ce n'est pas une robe |
| `fourreau-double` | robe de cocktail Dior 1954 | jupe ample, pas un fourreau |
| `biais-1933` | robe du soir rouge à manches (Auckland Museum) | ni col bénitier ni dos nu |
| `paysanne-smocks` | robe smockée 1890 (Met) | époque différente de la fiche |
| `portefeuille` | photo recadrée sur deux mannequins | lecture difficile |
| `sirene-soiree`, `mariee-sirene-dentelle` | photos portées | à garder si rien de mieux |

### Étapes

1. Étendre `apps/ai-service/ml/scripts/fetch_catalog_inspirations.py` :
   - **sources** : Met v1.1 (domaine public), Wikimedia Commons (catégories plutôt que recherche plein texte, voir
     `commons_extra` de la session précédente), puis musées à licence ouverte : Rijksmuseum (CC0), Smithsonian Open
     Access (CC0), Cooper Hewitt (CC0), Europeana (filtre `reusability=open`), Los Angeles County Museum of Art (domaine public).
     Respecter leurs CGU et en-têtes `User-Agent` ; journaliser licence + page source dans `candidates*.jsonl` ;
   - **cibles** : « sheath dress », « wiggle dress », « peplum dress 1950s », « Vionnet bias gown », « cowl neck
     evening gown 1930s », « smocked peasant dress 1970s », « wrap dress 1970s » ;
   - **filtre** : refuser NC/ND, garder les CC BY/CC BY-SA avec auteur.
2. Choisir à l'œil sur planche-contact (comme le 2026-10-21) et mettre à jour `~/angaly-catalog-inspirations/chosen.json`.
3. Si aucune photo libre ne convient, **ajuster la fiche plutôt que la photo** : par exemple renommer « Robe
   péplum » en « Robe à basque 1950 » si la meilleure photo est une robe de jour à basque, et adapter
   `parameters`/`look` dans `packages/pattern-engine/src/catalog/dress-catalog.ts` (le test du catalogue garde la
   cohérence des pièces).
4. Renvoyer les photos : `seed_pattern_catalog.py --dir ~/angaly-catalog-inspirations` (la dernière ligne Media
   `catalog:<id>` l'emporte ; supprimer l'ancienne via `DELETE /api/media/:id` en admin si on ne veut pas la garder).
   Mettre à jour `apps/api/src/pattern-catalog/infrastructure/data/catalog-inspirations.json` (crédits nettoyés à la main).
5. Rattacher les projets existants à la nouvelle photo (PATCH `inspirationMediaId`), recapturer leur 3D, puis
   republier l'artefact des planches (même fichier, même lien).

### Tests

Aucun code produit modifié, sauf le catalogue (`dress-catalog.test.ts` doit passer). Ajouter si besoin un test qui
vérifie que chaque id du catalogue a un crédit dans `catalog-inspirations.json` (`pattern-catalog.use-cases.spec.ts`).

### Fait quand

Chaque robe a une photo dont la coupe correspond à sa fiche, ou une fiche réécrite pour correspondre à sa photo. Le
tableau de la revue §7 limite 3 est vide.

---

## Lot 5 — Le modèle local de vision apprend `construction`

### Constat

La lecture par fournisseur (`app/construction_knowledge.py`) propose `construction`, mais le modèle local
(`app/local_vision.py`, entraîné par `ml/scripts/train_vision_model.py` sur les lectures `ml/data/vision/labels_part*.py`)
ne prédit que les classes (coupe, détails) et l'ampleur de jupe.

### Conception

1. **Étiquettes** : ajouter `construction` (même format que le profil) aux lectures existantes quand une pièce est
   visible. Sources : les 36 robes du catalogue (lecture connue, photo choisie : `~/angaly-catalog-inspirations`), le banc
   des 31 robes (`dress_benchmark_notes.json` liste déjà volants, bandes, jabots, nœuds), puis une passe de relecture
   des photos d'entraînement. Les étiquettes produites par un modèle ne sont **pas validées par une couturière** : ne pas
   les mélanger au golden set (`ml/data/eval`), les marquer `readBy`.
2. **Têtes de prédiction** (`train_vision_model.py`) : une classification binaire « présent / absent » par type visible
   fréquent (au moins 25 exemples positifs) : `HEM_FLOUNCE`, `HEM_BANDS`, `BOW`, `JABOT`, `CAPELET`, `PEPLUM`,
   `BUSTLE`, `EMBROIDERY`. Même encodeur, régression logistique, seuil `min_proba` choisi en validation croisée comme
   les autres champs ; ne garder une tête que si sa précision en validation croisée dépasse la base (fréquence de classe)
   d'au moins 10 points. Paramètres par défaut quand la pièce est détectée : ceux de `DEFAULT_CONSTRUCTION`
   (`apps/web/src/features/pattern-studio-wizard/utils/construction.ts`), à recopier côté Python dans
   `construction_knowledge.py` (`DEFAULTS`) avec un test de synchronisation.
3. **Prédiction** (`local_vision.py`, `predict_profile`) : ajouter `profile["construction"] = [...]` pour chaque tête
   au-dessus du seuil, avec `certainty: "MEDIUM"` ; la sortie passe ensuite par `normalize_construction` comme pour un
   fournisseur.
4. **Métriques** : écrire précision / rappel par type dans `ml/data/vision/metrics.json` ; ajouter `construction` aux
   métriques du rapport d'évaluation (`make eval.photo`) : F1 par type.

### Tests (pytest)

- `tests/test_local_vision.py` : un modèle factice avec une tête `construction.HEM_FLOUNCE` produit
  `construction: [{kind: 'HEM_FLOUNCE', …}]` au-dessus du seuil, rien en dessous ; le résultat passe
  `normalize_profile`.
- `tests/test_construction_knowledge.py` : `DEFAULTS` valide chaque type selon `FIELDS`/`BOUNDS` et concorde avec
  `DEFAULT_CONSTRUCTION` du web (lecture du fichier TS, comme pour les bornes).
- Couverture ≥ 80 % (`make test.ai`).

### Fait quand

Le modèle local propose au moins les volants, bandes et nœuds sur les photos du banc où ils sont visibles, avec une
précision au-dessus de la base ; `docs/features/ai-model-settings.md` et `docs/handoff.md` décrivent les nouvelles têtes.

---

## 6. Fichiers touchés (récapitulatif)

| Lot | Créer | Modifier (insertions ciblées) |
|---|---|---|
| 1 | `stitch-prompts/<n>-pattern-studio-catalogue.md` | `features/pattern-studio-catalog/ui/*`, `docs/mockup-reference.md`, `docs/pages/pattern-studio-catalogue.md` |
| 2 | `utils/garment3d/understructure.ts`, `__tests__/understructure.test.ts` | `garment-model.ts` (`INSIDE_NAMES`, `GarmentLayout`, `buildGarmentModel`, `zoneDrape`), `garment3dConstructionPieces.test.ts` |
| 3 | — | `pattern-engine/src/types.ts` (`DetailArea`), `shared/construction.ts`, `detail-patch.ts`, `garment-model.ts` (`detailPanel`, `PanelMeshData`), `ui/fabricTextures.ts`, `ui/Garment3DViewer.tsx`, tests associés |
| 4 | — | `ml/scripts/fetch_catalog_inspirations.py`, `catalog/dress-catalog.ts` (si fiche réécrite), `catalog-inspirations.json` |
| 5 | — | `ml/data/vision/labels_part*.py`, `ml/scripts/train_vision_model.py`, `app/local_vision.py`, `app/construction_knowledge.py`, tests |

Fichiers aussi modifiés par d'autres sessions : `garment-model.ts`, `Garment3DViewer.tsx`, `types.ts` du moteur,
`docs/handoff.md`. Toujours les relire juste avant d'y insérer, ne rien supprimer, garder les changements petits.

## 7. Vérification commune

```bash
# Tests
pnpm --filter @angaly/pattern-engine test
cd apps/web && npx vitest run src/features/pattern-studio-preview-validation-export src/features/pattern-studio-wizard src/features/pattern-studio-catalog
cd apps/api && npx jest src/patterns src/pattern-catalog src/ai-inference
cd apps/ai-service && .venv/bin/python -m pytest -q
pnpm typecheck && pnpm lint

# Moteur et types recompilés pour l'API
pnpm --filter @angaly/types build && pnpm --filter @angaly/pattern-engine build

# API de test sans toucher à la 3003 partagée
cd apps/api && cat > tsconfig.3023.json <<'EOF'
{ "extends": "./tsconfig.build.json", "compilerOptions": { "outDir": "./dist-3023", "incremental": false },
  "exclude": ["node_modules", "dist", "dist-3023", "**/*.spec.ts", "**/__tests__/**"] }
EOF
npx tsc -p tsconfig.3023.json && API_PORT=3023 API_CORS_ORIGINS=http://localhost:3100 node dist-3023/main.js
# (supprimer dist-3023 et tsconfig.3023.json à la fin)

# Captures 3D des projets du catalogue
cd apps/ai-service && node ml/scripts/dress_3d_capture.mjs ~/angaly-catalog-run/results.json ~/angaly-catalog-run/3d
```

Planche de comparaison : photo | 3D face | 3D côté (`montage`, voir la session du 2026-10-21) ; ne déclarer un lot
conforme qu'après avoir regardé la face **et** le côté.

## 8. Définition de « terminé » (chaque lot)

- [ ] Tests écrits et verts (couverture ≥ 80 % sur les fichiers touchés).
- [ ] `pnpm typecheck` et lint propres.
- [ ] Vérification visuelle (3D ou page) faite et décrite, captures conservées hors dépôt.
- [ ] Documentation : fiche de la page ou `docs/features/*`, `docs/reviews/dress-pattern-catalog.md` §7,
      vocabulaire du skill si une option change.
- [ ] `docs/handoff.md` mis à jour (résumé, tests, reste à faire).
