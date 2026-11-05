# Archive du handoff — sessions jusqu'au 2026-10-23

> Historique déplacé de `docs/handoff.md` le 2026-11-05 (aucune modification du contenu). **Non lu par défaut** :
> chercher dedans avec grep (`grep -n "mot" docs/handoff-archive/*.md`) puis lire la section trouvée avec offset/limit.
> Les sections sont dans l'ordre d'origine (plus récentes en haut, puis notes plus anciennes de 2026-10-07/08).

---

## 0 sexagies. Session 2026-10-23 (suite) — Lot 4 du plan : photos d'inspiration plus fidèles (Claude Code) — TERMINÉ

**Fait** :
- `apps/ai-service/ml/scripts/fetch_catalog_inspirations.py --source commons-cat|europeana|smithsonian` : catégories
  Commons (un niveau de sous-catégories), Europeana (`reusability=open`, clé `api2demo` ou `EUROPEANA_API_KEY`),
  Smithsonian Open Access (CC0, `DEMO_KEY` ou `SMITHSONIAN_API_KEY`). Filtre de licence `free_licence` (refuse NC/ND),
  `download` borné (30 s et 15 Mo au total : un hôte Europeana lent bloquait le script indéfiniment). Journal par
  source `candidates-<source>.jsonl`. Europeana n'a rien donné d'utile (« sheath » ramène des fourreaux d'épée).
- `seed_pattern_catalog.py` : lit tous les `candidates*.jsonl` (dont `candidates-manual.jsonl` pour les recadrages
  faits à la main), `--only <ids>`, crédit des musées Europeana / Smithsonian.
- Photos choisies sur planche (`~/angaly-catalog-inspirations/chosen.json`, ancien : `chosen.before-lot4.json`),
  envoyées dans MinIO, crédits nettoyés dans `catalog-inspirations.json` ; fiches ajustées dans
  `packages/pattern-engine/src/catalog/dress-catalog.ts` (tableau complet : `docs/reviews/dress-pattern-catalog.md`
  §7 limite 3). Fourreau → Smithsonian (blanc, années 60) ; péplum → robe péplum en brocart, **sans manches** ;
  biais 1933 → Vionnet v. 1932 (RISD) ; portefeuille → robe rouge recadrée, **manches courtes** ; dirndl → dirndl en
  vitrine (corsage rayé, tablier vert anis, broderie rose) ; paysanne : même photo, **fiche réécrite** en robe smock
  Liberty (col plat brodé, poignets smockés `SMOCKING MANCHES`, genou, plus de volant ni de broderie d'ourlet).
- Nouveaux projets client créés du catalogue (API de test 3023, arrêtée, `dist-3023` supprimé) et capturés en 3D ;
  `~/angaly-catalog-run/results.json` pointe vers eux (ancien : `results.before-lot4.json`) : fourreau df576026,
  péplum 3a7ebe43, biais e6966074, portefeuille 16c37a2a, dirndl 0099e9eb, paysanne 6ec398b0. Planches photo | face |
  côté : `/tmp/claude-1000/-home-tokiarivelo-Documents-Projects-angaly/a3f4efbc-9d78-44a1-9669-1ccddf44b624/scratchpad/sheets/{lot4-compare,dirndl-after}.png`.
  Les six concordent de face et de côté avec leur photo (coupe, manches, longueur, couleurs).
- **Limite trouvée** : en 3D le tablier (`APRON`) est dessiné dans `look.contrastColor`, sa `color` ne va que dans
  la note de coupe → le dirndl met le vert du tablier en `contrastColor`. Correctif propre (non fait) : porter la
  couleur sur la zone de détail, comme `DetailArea.color` de la broderie.
- Artefact des planches (https://claude.ai/artifact/PYe887bFgkSq2v93mchkcV) **non republié** (étape 5 du lot).

**Tests** : ai-service 180 ✓ (couverture 94 %, nouveau `tests/test_fetch_catalog_inspirations.py`, 21 tests hors
réseau) ; moteur 539 ✓ ; API `patterns` + `pattern-catalog` + `ai-inference` 177 ✓ (nouveau : chaque robe du
catalogue a un crédit sous licence libre) ; web preview + assistant + catalogue 615 ✓ ; `pnpm typecheck` 10/10.
`pnpm lint` : 288 erreurs dans `apps/api`, antérieures et hors des fichiers touchés (module `pattern-catalog` : 0 erreur).
API 3003 partagée toujours l'ancienne (non relancée).

**Reste à faire** : Lot 1 (Stitch, bloqué), Lot 5 (modèle local `construction`), couleur propre du tablier en 3D,
republier l'artefact des planches.

---

## 0 novemquinquagies. Session 2026-10-23 (suite) — Lot 3 du plan : broderie et smocks rendus comme des motifs (Claude Code) — TERMINÉ

**Fait** :
- **Moteur** : `DetailArea.motif?: 'BRODERIE' | 'SMOCKS'` + `color?` (`packages/pattern-engine/src/types.ts`),
  posés par `embroidery()` (avec la couleur du fil) et `smocking()` dans `shared/construction.ts` ; `contrast` inchangé
  sur la broderie (compatibilité). **Une broderie `OURLET` commence au-dessus du plus haut volant** (`flounceTopMm`) :
  sur la robe paysanne, elle était entièrement cachée sous le volant d'ourlet de 15 cm.
- **Web** : `detailAreasOf` lit `motif`/`color` (valeur inconnue ou couleur mal formée ignorées) ; `detailPanel`
  reporte `motif` et `trimColor` sur `PanelMeshData.motif`. Nouveau `ui/motifTextures.ts` (pixels calculés par des
  fonctions pures, sans canvas → testables sous jsdom, déterministes, raccords sans couture) : broderie = rinceaux,
  vrilles, feuilles, fleurs, points de nœud, carreau de 8 cm ; smocks = nid d'abeille (normal map + occlusion),
  losange de 12 mm. Écart au plan : fichier séparé plutôt que `fabricTextures.ts`, et la broderie est une carte grise
  teintée par la couleur du matériau (une seule texture quel que soit le fil).
- `Garment3DViewer.tsx` (insertions ciblées) : `EmbroideryPanel` (couche transparente au-dessus du tissu, couleur =
  fil, sinon `contrastColor`, sinon or champagne `#C9A45C` ; **mélange alpha, pas alphaTest** : de loin les mipmaps
  moyennent la couverture et un alphaTest faisait disparaître le motif) ; panneau de smocks = tissu de la robe +
  `relief` (normalMap/aoMap) dans `ClothMaterial`.
- **Vérification 3D** (API de test 3023, arrêtée et supprimée ; web 3100) : nouvelles versions générées pour
  `paysanne-smocks` aa0b1fcf (v3), `dirndl` 66962625 (v2), `babydoll` 062a5600 (v2). Captures face/côté et gros plans :
  `/tmp/claude-1000/-home-tokiarivelo-Documents-Projects-angaly/27e6e65a-2513-4e4a-8123-a0ef2ba1bdb3/scratchpad/{sheet1,sheet2}.png`.
  Paysanne : frise rouge de rinceaux et fleurs lisible au-dessus du volant ✔, nid d'abeille visible sur le plastron ✔.
  Dirndl : broderie d'encolure rouge `#b8323a` sur corsage `#8a1c1c` → presque invisible (donnée du catalogue ; la photo
  ne montre pas de broderie — à trancher au lot 4). Babydoll : smocks des manches peu lisibles sur tissu noir.
- Docs : `docs/features/pattern-engine.md`, vocabulaire du skill, `docs/reviews/dress-pattern-catalog.md` §7 limite 2
  levée, statut dans le plan.

**Tests** : moteur 539 ✓ (2 nouveaux dans `construction.test.ts`) ; web preview + assistant + catalogue 611 ✓ dont
`motifTextures.test.ts` (6, couverture 100 % lignes), `detailPatch.test.ts` (+1), `garment3dConstructionPieces.test.ts`
(+1) ; API `patterns` + `pattern-catalog` 92 ✓ ; `pnpm typecheck` 10/10 ; lint web propre. Rien n'est commité.
Moteur recompilé (`dist`) ; l'API 3003 partagée n'a pas été relancée (elle sert les versions régénérées depuis la base).

**Suite (même jour) — motifs dans le rendu réaliste Blender** (limite levée) : le job porte `motif`/`trimColor`
(`tools/export-job.ts`, `cloth_sim/job.py`, conservés par `clean_panel`/`trim_hidden` via `dataclasses.replace`) ;
`cloth_sim/motifs.py` = port numpy des motifs du web (écart ≤ 1/255) ; `look.panel_material(zone, look, motif,
thread)` ; `render_look.py` dessine broderie (fil mélangé par couverture + Bump) et smocks (Bump + ombre des plis).
Web : `RealisticRenderViewer` retrouve le motif de chaque matériau du `.glb` (`panelMotifs`, `motifForMaterial`) et
applique le même matériau que l'aperçu (`embroideryMaterialParameters`, `threadColor` partagés). Vérifié : échantillon
Cycles + simulation complète de la paysanne v3 (`64149c16…`, `scratchpad/cloth/after.png`) : frise rouge au-dessus du
volant, nid d'abeille sur le plastron ✔. (Dans cette simulation, le corsage glisse des épaules et l'ourlet se froisse :
comportement de la simulation, géométrie du job inchangée par ce travail — non investigué.)
Tests : cloth-sim 158 ✓ (couverture 99 %, `test_motifs.py`, +job/look/prepare), ruff propre ; web 615 ✓.
Doc : `docs/features/realistic-render-blender.md` §20, README cloth-sim.

**Reste à faire** : Lot 1 (Stitch, bloqué), Lot 4 (photos ; dirndl : couleur du fil), Lot 5 (modèle local
`construction`).

---

## 0 octoquinquagies. Session 2026-10-23 (suite) — Lot 2 du plan : paniers et coussin de tournure portent la jupe en 3D (Claude Code) — TERMINÉ

**Fait** :
- Nouveau module pur `apps/web/src/features/pattern-studio-preview-validation-export/utils/garment3d/understructure.ts` :
  paniers = ellipse (fonction de support) large aux hanches, plate devant / derrière, de 3 à ~35 cm sous la couture de
  la jupe (pic à 20 cm, 70 % en bas) ; coussin = ellipse derrière le corps, bosse de 12 cm à 5 cm sous la taille.
- `garment-model.ts` (insertions ciblées) : les pièces « Panier (poche de hanche) » / « Coussin de tournure » restent
  listées dans `inside` mais sont relevées dans `GarmentLayout.understructure` et `ZoneGroup.understructure` (jupe) ;
  `zoneDrape.support` = enveloppe convexe corps + structures ; la jupe tombe droit depuis elles (portée 2 m) ; une jupe
  froncée/plissée s'ouvre autant que son tissu le permet pour en faire le tour (`hangs`) ; taille des paniers 0,6–1 ×
  la poche selon ourlet ÷ tour du corps à la couture de la jupe (`withHoopScale`), placés depuis la couture si la
  taille est basse (robe de style 1924).
- **Patron** : `francaise-1750` du catalogue (`packages/pattern-engine/src/catalog/dress-catalog.ts`) reçoit
  `drape: GATHERED_SKIRT × 3` — sa jupe évasée faisait 1 m de tour au creux des paniers (~1,8 m requis) et retombait
  plaquée sur les jambes de profil. Nouveau projet client créé du catalogue et généré (API de test 3023, arrêtée et
  supprimée depuis) : `65703bab-68c6-4bad-b9d9-20a4975c29a8` (v1, 18 pièces). L'ancien `abf724b6…` garde l'ancienne
  jupe ; `~/angaly-catalog-run/results.json` n'a pas été modifié.
- Captures avant / après (face + côté) : `scratchpad/sheets/{paniers,coussin}.png` de la session (hors dépôt).
  1750 : large aux hanches de face, plate de profil, chute droite ✔ ; 1885 : cambrure au dos ✔ ; 1780 : bosse du
  coussin sous le pouf ✔ (jupe ajustée devant : limite antérieure) ; 1924 : large aux côtés, profil aplati (le dôme
  rond d'avant disparaît — conforme à des paniers, à revoir si on veut des paniers 1920 plus petits).
- Docs : `docs/reviews/dress-pattern-catalog.md` §7 limite 1 levée ; vocabulaire du skill (`BUSTLE` en 3D).

**Tests** : web (preview, assistant, catalogue) 603 ✓ dont `understructure.test.ts` (5, couverture 100 %) et 2 nouveaux
dans `garment3dConstructionPieces.test.ts` (paniers : +15 cm aux hanches, profondeur ±2 cm ; coussin : dos −8 cm) ;
moteur 537 ✓ ; API `pattern-catalog` 7 ✓ ; `pnpm typecheck` 10/10 ; lint web propre. Rien n'est commité.
Web dev lancé sur 3100 par cette session ; API 3003 (partagée) non relancée.

**Reste à faire** : Lot 1 (Stitch, bloqué ci-dessous), Lot 3 (broderie / smocks en motifs), Lot 4, Lot 5.

---

## 0 septquinquagies. Session 2026-10-23 — Lot 1 du plan `docs/plans/pattern-construction-suite.md` (maquette Stitch du catalogue) (Claude Code) — BLOQUÉ

**Demande** : lot 1 — générer l'écran Stitch « ANGALY Pattern Studio — Catalogue des patrons » puis réaligner la page.

**Fait** :
- Vérifié : l'écran n'existe pas dans le projet `3703874896720765754` (95 écrans listés).
- `mcp__stitch__generate_screen_from_text` (design system `assets/13682057441638558326`, DESKTOP) : délai dépassé ×2
  (modèle par défaut puis `GEMINI_3_5_FLASH_LITE`) ; aucun écran apparu après ~10 min de relevés `list_screens`.
- `agy -p --dangerously-skip-permissions` refusé par le mode auto de Claude Code (lancement d'un agent sans contrôle).
- Prompt mémo créé : `stitch-prompts/34-pattern-studio-catalogue.md` (prompt complet, à coller dans Stitch).
- Aucun JSX modifié (règle : jamais deviner un détail visuel sans l'écran réel). Écart déjà noté avec la coque
  « Mes projets de patron » : cartes et puces très arrondies (`rounded-xl`, `rounded-full`) alors que la maquette
  de référence utilise `rounded-DEFAULT` — à trancher sur l'écran dédié.
- API 3003 toujours l'ancienne (`GET /api/pattern-catalog` → 404) ; non relancée (instance partagée).

**Reste à faire** : créer l'écran à la main (session `agy` interactive, ou interface web Stitch avec le prompt du
mémo), puis reprendre le lot 1 à l'étape 2 (`list_screens` → `get_screen`, comparaison, réalignement, tests, captures).

---

## 0 sexquadragies. Session 2026-10-21 (nuit, en parallèle) — Pièces de construction en 3D, lecture photo, assistant, catalogue des patrons (Claude Code) — TERMINÉ

**Demande** : corriger les limites de la session précédente (pièces visibles absentes de la 3D, pas de lecture photo
ni d'écran assistant, broderies / smocks / poignets contrastés), ajouter une page « catalogue des patrons réalisables »
avec la photo d'inspiration d'origine, et publier les planches à feuilleter avec photo + 3D.

**Fait** (détail : `docs/reviews/dress-pattern-catalog.md` §6) :
- Moteur : `EMBROIDERY`, `SMOCKING`, `CONTRAST_CUFFS` ; zones de détail (`InternalLine.detail`) posées pour bandes,
  pli Watteau, écharpe, broderie, smocks ; catalogue déplacé dans `src/catalog/dress-catalog.ts` (36 robes, `look`).
- 3D : nouveau `utils/garment3d/construction-model.ts` (volants, godets, basque, pèlerine, chous, pouf, engageantes,
  tablier, jabot) ; crochets dans `garment-model.ts` (layout `construction`, classement, appel dans `drapeGarment`).
- ai-service : `app/construction_knowledge.py` (guide + `normalize_construction`), `GarmentProfile.construction`
  (clé présente seulement si vue) ; test `tests/test_construction_knowledge.py` (synchro des bornes avec @angaly/types).
- API : fusion photo → `construction` ; nouveau module `pattern-catalog` (`GET /api/pattern-catalog`,
  `POST /api/pattern-catalog/:id/projects`), crédits `infrastructure/data/catalog-inspirations.json`. La photo d'un
  projet créé du catalogue est la ligne Media du catalogue (bucket + clé uniques : pas de copie).
- Web : `ConstructionEditor` dans l'étape Ajustements de l'assistant ; feature `pattern-studio-catalog` + route
  `/pattern-studio/catalogue` ; lien depuis « Mes projets de patron ».
- Données : `apps/ai-service/ml/scripts/fetch_catalog_inspirations.py` (Met v1.1 — l'ancien `/v1/search` est retiré
  depuis le 2026-10-01 — et Wikimedia Commons), `seed_pattern_catalog.py` (envoi MinIO via l'API + projets). Photos
  hors dépôt : `~/angaly-catalog-inspirations` (`chosen.json`). 36 photos envoyées (Media `catalog:<id>`).
- 36 projets réels (compte client) générés et capturés en 3D : `~/angaly-catalog-run/results.json`, `3d/`.
- Artefact : https://claude.ai/artifact/PYe887bFgkSq2v93mchkcV (photo d'origine, 3D face + côté, planche).

**Tests** : moteur 537 ✓ ; API patterns + catalogue + ai-inference + mesures + médias 323 ✓ ; ai-service 159 ✓ ;
web (preview, assistant, catalogue, mes projets) 603 ✓ ; `pnpm typecheck` 10/10 ; lint propre sur les fichiers ajoutés.
Rien n'est commité.

**Reste à faire** :
1. **Relancer l'API 3003** (l'API en cours n'a ni `construction` ni `pattern-catalog` : la page catalogue renvoie 404
   tant qu'elle n'est pas relancée). Moteur et types recompilés (dist).
2. Générer l'écran Stitch « ANGALY Pattern Studio — Catalogue des patrons » (échecs MCP ×3 + `agy`) et réaligner la page.
3. Paniers / coussin de tournure : élargir la jupe aux hanches en 3D ; broderie et smocks rendus comme motifs.
4. Modèle local de vision : apprendre `construction`.

Plan détaillé des points 2 à 4 et du remplacement des photos approximatives : `docs/plans/pattern-construction-suite.md`.

---

## 0 unquinquagies. Session 2026-10-21 (nuit) — Robe de bal conforme à la planche + patron superposé au modèle d'inspiration (Claude Code) — TERMINÉ

**Demande** : robe de mariée 207c1614 non conforme à la planche 1850 (relever chaque détail) ; superposer patron / 3D et
photo d'inspiration (patron posé sur le modèle, puis affiné sur la 3D) ; pièce cliquée = zone allumée sur la photo ;
« grande optimisation ».

**Fait** :
- **Moteur** (`rules/robe-mariee.rule.ts`) : `ROBE_MARIEE` + groupe `jupe` ; `jupe: EN_LES` → `goredBallSkirt` = 8 lés
  froncés + 2 panneaux de traîne, haut des lés devant qui suit la pointe du bustier (`waistPointDepthAt`, `shared/shapes.ts`),
  « Ceinture intérieure (gros-grain) » pour une jupe froncée lourde (remplace la fourniture « Ruban de taille » dans
  `shared/trims.ts`). Doc : `docs/features/pattern-engine.md` § « Robe de bal 1850 ».
- **3D** (`garment-model.ts`, ciblé) : panneau de jupe « fronc… » = `gathered` ; `joinPieces` recolle milieu + tous les
  côtés ; profondeur des plis sur jupon = √(surplus × λ)/π.
- **Photo** : `utils/garment3d/photo-frame.ts` (projection de face par pièce, cadre du vêtement lu sur la photo, couverture,
  pièce sous le clic), `hooks/useInspirationOverlay.ts`, `ui/InspirationOverlayCanvas.tsx`, `ui/InspirationPanel.tsx`
  (Pièces / opacité / Caler / recaler, clic = sélection, rouge = non couvert), `ui/ComparisonLayout.tsx` (`alignPhoto`),
  `FrameReporter` dans `Garment3DViewer.tsx` (+ `onGarmentScreenRect` dans `Garment3DPanel`, vue de face auto).
- **Optimisation** : `utils/garment3d/model-cache.ts` (drapé partagé 3D / photo, 4 entrées ; plus de redrapé au retour
  sur l'onglet 3D).
- **Projet 207c1614** : `detailsJson.jupe = EN_LES`, `drape.blocks = []`, volants de manche 3 étages ; **v16** puis **v17**
  (17 pièces). Sauvegarde avant modification : `scratchpad/bal16/before_v16.json`. API 3003 relancée deux fois.
- Artefact mis à jour (v5) : https://claude.ai/artifact/K4fBDPPnx5rwUkFkFZWMNz (tableau détail par détail).

**Tests** : moteur 537 ✓ (`robe-bal-pieces.test.ts`, `trims.test.ts`) ; web feature + wizard 587 ✓ (`photoFrame`,
`InspirationPanel`, `useInspirationOverlay`) ; API 169 ✓ ; ai-service 159 ✓ ; tsc web OK. Lint : 1 erreur dans
`construction-model.ts` (**session parallèle en cours**, fichier non touché). Rien de commité.

**⚠️ Session parallèle active** (édite `construction-model.ts`, `pose.ts`, `collar-model.ts`, `trims-model.ts`… vers 20 h) :
à 20 h 05 le serveur web servait un chunk `Garment3DViewer` cassé (« missing ) after argument list ») le temps de leurs
modifications.

**Reste** : dentelle à fleurs en relief, froissé du taffetas ; ourlet 3D 3,7 × taille (photo 4,3) ; berthe en 2 pièces
(planche : 1) ; projection photo faite sur le mannequin de calcul (bras écartés → rouge près des bras) — la faire sur le
corps posé du viewer ; cadre calé gardé dans le navigateur seulement (à stocker côté projet) ; rapport d'aisance
« Poitrine trop serré −15 cm » sur ce bustier hors épaules, vu mais non analysé.

---

## 0 quinquadragies. Session 2026-10-21 (soir, en parallèle) — Patrons complets : pièces de construction + banc de 35 robes (Claude Code) — TERMINÉ

**Demande** : grande recherche sur les données disponibles, plusieurs cas de test avec des robes différentes, génération
de patron la plus complète possible (tous les détails, y compris les pièces rares), sans écraser le travail de la session
parallèle (robe de bal 1850 / robe à gilet 1880).

**Fait** (détail : `docs/reviews/dress-pattern-catalog.md`) :
- Nouvelle couche moteur `shared/construction.ts` (`parametersExtJson.construction.items`) : doublure, entoilage, volants
  d'ourlet / étagés (froncés ou en forme), godets, basque rapportée (sautée si une pièce « basque » existe), jabot,
  pèlerine, chou, bandes appliquées, engageantes, balayeuse, tournure / pouf / paniers, pli Watteau, poches dans les
  coutures, biais, goussets, écharpe, soutien de bouffant, tablier. Branchée dans `PatternEngine.generate` après les
  `trims` ; doublure / entoilage hors métrage. Types + validation : `packages/types/src/pattern-construction.ts`
  (+ crochets dans `pattern-fit.ts`) ; API : `construction` transmis par `generate-pattern-version.use-case.ts`.
- 3D : `INSIDE_NAMES` += doublure, entoilage, balayeuse, soutien de bouffant, coussin de tournure, panier, lien, biais,
  gousset (jamais drapés comme un panneau). Les pièces visibles (volants, godets, basque, jabot…) sont listées
  « ignorées » : **pas encore drapées en 3D**.
- Banc de 35 robes (`src/__tests__/fixtures/dress-catalog.ts`, 1400 → aujourd'hui, mariée comprise) + planches SVG
  (`PLATES_DIR=… npx vitest run src/__tests__/catalog-plates.tool.test.ts`).
- Paquets `@angaly/types` et `@angaly/pattern-engine` recompilés (dist). **API 3003 non relancée** (session parallèle
  active) : elle n'a pas encore la couche `construction` en mémoire.

**Tests** : moteur `construction.test.ts` 23 ✓, `dress-catalog.test.ts` 141 ✓ ; API `construction-parameters.spec.ts`
4 ✓ ; web `garment3dConstructionPieces.test.ts` 2 ✓. Échecs restants **dus au travail en cours de la session
parallèle** (non touchés) : moteur `robe.rule.test.ts` / `finishing-pieces.test.ts` (« Ceinture intérieure »), API
`inspiration-parameters.service.spec.ts` / `generate-pattern-version.use-case.spec.ts` (groupe `basque`), web
`garment3dTrims.test.ts` / `detailPatch.test.ts` / `garment-details.test.ts` (parementures d'ourlet, basque), typecheck
`trims.test.ts` (`trims: undefined`). Rien n'est commité.

**Reste à faire** :
1. Draper en 3D les pièces visibles de la couche (volants étagés, godets, basque rapportée, pèlerine, jabot, chou, bandes).
2. Lecture photo : ajouter `construction` au `GarmentProfile` / prompt `garment_knowledge.py` / fusion API.
3. Assistant web : écran de choix des pièces de construction.
4. Relancer l'API 3003 quand la session parallèle a fini, puis créer de vrais projets à partir du banc.

---

## 0 quinquadragies. Session 2026-10-21 (nuit) — Planches d'atelier : empiècements de la robe cuirasse et de la robe de bal (Claude Code) — TERMINÉ

**Demande** : « grande différence » entre les planches d'atelier (images de l'utilisateur, illustrations générées, non
cotées) et nos patrons / 3D pour 92c20b00 (robe cuirasse bleue) et la robe de bal (projet 207c1614, ROBE_MARIEE).

**Fait (moteur)** : `corsage PRINCESSE` (`princessSplit`), `manches TAILLEUR` (deux pièces + poignet + parementure),
gilet boutonné en deux moitiés, gilet plus large au buste, nouveau groupe `basque` (POINTES / PANS_CROISES, zones de
détail en tissu contrastant sur « Jupe Devant »), ceinture intérieure, parementures d'ourlet, parementure de fente de
jupe, jupe plissée coupée en lés de laize. Détail : `docs/features/pattern-engine.md` § « Planche d'atelier ».
Types : options + `basque` dans `DETAIL_GROUPS_BY_GARMENT.ROBE`, `fit.contrastTrims`, `DetailArea.contrast/layer`.
ai-service : options, règles de décision, `contrastTrims`. Wizard : libellés, descriptions, croquis.
**3D** : détails et boutons sur les panneaux recollés (`keepsFrame`), détails en tissu contrastant et empilés, col et
poignets en tissu du gilet (`contrastTrims`), poignet parementé, jupe-bloc qui descend sous la taille en pointe
(`dipBlockSkirtUnderPoint`), plus de tissu d'accent sur un côté de corsage princesse.
**API** : `fillMissingDetailsWithAi` ne plante plus sans `features` dans l'analyse (test ajouté).

**Projets** : 92c20b00 → **v15** (25 pièces au lieu de 13 ; lecture de la planche par Claude, non validée).
207c1614 → **v15** avec exactement les paramètres de v13 (seule la jupe plissée passe à 4 lés).
⚠️ Incident : un script a écrasé par erreur les réglages de 207c1614 avec ceux de la robe bleue → **v14 fausse**
(reste dans l'historique). Réglages rétablis depuis `parametersJson` de v13 ; le texte `readBy` d'origine est perdu
(remplacé par une mention « rétablie »), `features` remis à `{}`.

**Tests** : moteur 522 ✓ (nouveau `robe-cuirasse-pieces.test.ts`, `trims.test.ts` typé), web 562 ✓
(`garment3dCuirass.test.ts`, `detailPatch`), API 167 ✓, ai-service 154 ✓. tsc web / moteur / types OK ; tsc API :
1 erreur préexistante dans `construction-parameters.spec.ts` (fichier non suivi d'une autre session). Rien de commité.
API 3003 relancée (variables lues ligne à ligne depuis `scratchpad/api3003.env` — le `source` du fichier échoue).

**Reste à faire** :
1. Tournure (bustle) et drapé du dos de la robe bleue : non modélisés.
2. Tablier bleu plus large que sur la planche ; pointes du gilet plus courtes que sur la photo.
3. Robe de bal : les plis du haut de jupe font des chevrons à la pointe ; traîne en une pièce (planche : 2).
4. Jupe froncée (bloc `GATHERED_SKIRT`) toujours en deux panneaux, même plus larges que la laize.
5. Le modèle local de vision ne connaît ni `PRINCESSE` (corsage), ni `TAILLEUR`, ni `basque`.

---

## 0 quaterquadragies. Session 2026-10-21 (soir) — Robe cuirasse 92c20b00 : gilet, boutons, lés contrastés (Claude Code) — TERMINÉ

**Demande** : relancer l'API 3003 / arrêter la 3013 ; « il manque beaucoup sur le patron et la vue 3D » pour
http://localhost:3100/pattern-studio/projects/92c20b00-2b24-4d65-8fa8-0ed70c70324b (robe 1880, Met).

**Fait** :
- API 3003 relancée (moteur + types recompilés), 3013 arrêtée. Après l'interruption de session, web 3100, API 3003 et
  ai-service 8001 relancés (logs `scratchpad/{web,api,ai8001}.log`).
- Relecture de la photo par Claude (non validée par une couturière) : `devant GILET`, `jupe EN_LES`, `fermeture BOUTONS`,
  `taille BASSE`, ampleur 2,0 (mesurée à la main : 2,44 × 0,85 ; `silhouette_ratio.py` échoue sur le fond en dégradé),
  satin bleu #2a4566, gilet #163640 à pois #07161b (1,5 cm), `contrastGores`, volant de dentelle au poignet #e9d6ae.
  Écrit dans `detailsJson`, `parametersExtJson`, `inspirationAnalysisJson.profile` (cohérents) → **v13**.
- Nouveau : option `devant GILET`, boutons placés par le moteur, `fit.contrastGores` (détail : `docs/features/pattern-engine.md`
  § « Corsage ouvert sur gilet ») ; vocabulaire du skill mis à jour.
- Corrigé : tête de manche en pose Présentation (peau à l'épaule) ; pois étirés sur les lés.

**Tests** : web 550 ✓ (nouveaux `garment3dGilet.test.ts`, test `contrastMaterial`), moteur 350 ✓ (`robe-gilet.test.ts`),
API 162 ✓, ai-service 152 ✓, `tsc` / eslint OK. Rien n'est commité.

**Reste à faire (écarts avec la photo)** :
1. Basque à pointes dans le tissu du gilet (non modélisée) ; col et poignets dans le tissu du gilet.
2. Le panneau du milieu de la jupe (`goreSplit`) est plus large que le tablier de la photo : les lés à pois se voient
   surtout de côté.
3. Petite marche en haut de la manche en pose Présentation.
4. L'ai-service a le nouveau prompt (GILET, contrastGores) depuis sa relance, mais le modèle local de vision ne les connaît pas.

---

## 0 trequadragies. Session 2026-10-21 (après-midi) — Vue éclatée : chaque pièce et chaque détail se détache (Claude Code) — TERMINÉ

**Demande** : « les fermetures et braguettes sont sur la 3D mais quand on éclate, elles ne se détachent pas ; investiguer
tous les détails de chaque empiècement ».

**Cause** : en 3D chaque jambe était un seul tube (devant + dos fusionnés) et braguette, poches, passepoils, revers
n'étaient que des traits dessus ; leurs pièces (parementure, sous-patte, poche plaquée, fonds de poche, bande de revers)
étaient classées « intérieures » et jamais dessinées.

**Fait** (détail : `docs/features/pattern-engine.md` § « Pièces de détail en 3D ») :
- Moteur : `InternalLine.detail` (`DetailArea`, exporté) sur les marques de `detailPlacementLines`.
- 3D : `detail-patch.ts` (lecture, drapé, miroir, recherche par nom, doublure) ; jambes découpées par pièce
  (`legPieceMesh`) ; panneaux de détail jambes + jupes ; zone `detail` et tissu doublure dans `Garment3DViewer`.
- Défauts trouvés et corrigés : fente au milieu dos (`BACK_EDGE_F`), bande d'entrejambe sur la pièce dos éclatée,
  « Poche plaquée » qui surlignait aussi « Poche plaquée arrière ».
- Pantalon b626c6fc régénéré en **v5** par une 2ᵉ API sur le port **3013** (le relancement de l'API 3003 a été refusé
  par le mode auto ; 3003 tourne toujours avec l'ancien moteur en mémoire : **ses nouvelles générations n'auront pas
  les zones de détail** tant qu'elle n'est pas relancée). L'API 3013 tourne encore (log `scratchpad/api3013.log`).
- Captures `scratchpad/expl2/tr3-{a,x}-{front,side,back}.png`.

**Tests** : web 545 ✓ (nouveaux `garment3dDetailPieces.test.ts`, `detailPatch.test.ts`), moteur 346 ✓ (nouveau
`detail-areas.test.ts`), API patrons 78 ✓, `tsc` OK. Rien n'est commité.

**Reste à faire** :
1. Relancer l'API 3003 (moteur recompilé) puis arrêter la 3013.
2. Fermetures de jupe (zip invisible milieu dos, zip côté) et fente dos : aucune marque ni pièce en 3D.
3. Corsages / robes : parementures d'encolure, de boutonnage, passants — pas encore de zones de détail.
4. Les deux pièces de braguette sont un seul panneau (même zone) ; la sous-patte pourrait aller sur l'autre devant.

---

## 0 duoquadragies. Session 2026-10-20 (nuit) — 2D = 3D : braguette, poches, revers sur le tissu ; mannequin aux mesures (Claude Code) — TERMINÉ

**Demande** : tout ce qui est sur le patron 2D doit être sur la 3D (braguette, poches), et le mannequin 3D doit avoir les
mesures saisies.

**Fait** (détail : `docs/features/pattern-engine.md` § « 2D = 3D ») :
- Moteur : `detailPlacementLines` (braguette sur un devant, poches, passepoils, revers) pour pantalon / costume / jupe ;
  bug de profondeur de braguette corrigé ; zip 18 cm.
- 3D : marques projetées sur le tissu (jambes et jupes, échantillonnées) ; anneau de jambe remis dans l'ordre
  devant / côté / dos / entrejambe (`legColumn`) — c'était la cause de la braguette et des poches mal placées.
- Mannequin : stature, hauteur taille–sol, longueur de jambe, entrejambe, genou, haut / sous poitrine, hauteur de
  poitrine lus ; genou commun moteur / drapé / visionneuse (`landmarks.kneeY`).
- Assistant (sessions précédentes du jour) : notes « Autre / préciser » et « Précisions pour l'atelier », tissu,
  mesures personnalisées, croquis d'options qui suivent les choix.
- API 3003 relancée (PID tué, mêmes variables) ; projet b626c6fc régénéré → **v4** (braguette, ceinture, poche plaquée
  dos, revers visibles en 3D ; captures `tr8-*.png` dans le scratchpad de la session).

**Tests** : web 3D + assistant 522 ✓ (nouveaux : `bodyMeasurements.test.ts`, `garment3dSkirtMarks.test.ts`, marques du
pantalon dans `garment3dTrousers.test.ts`), moteur 343 ✓, API 209 ✓, `tsc` web OK. Rien n'est commité.

**Suite (2026-10-21)** :
- **Mesures saisies perdues** (cause de « il n'a pas pris en compte les valeurs ») : l'assistant ne sauvegardait pas les
  mesures tapées ; un rafraîchissement sur `?step=measurements` les perdait et la génération ne prenait que le profil.
  Elles sont maintenant dans `parametersExtJson.measurements` (validées par le catalogue, client seulement à la fusion),
  rechargées par `usePatternWizard` (`withMeasurements` n'enregistre que les valeurs valides) et fusionnées à la
  génération : profil < mesures du projet < mesures envoyées.
- **Lissage 3D** : `utils/garment3d/smooth-mesh.ts` (Taubin λ 0,5 / μ −0,53, 2 passes, bords figés) appliqué à chaque
  panneau dans `toPanel` (sauf perles) — facettes et zigzags des manches bouffantes adoucis, coutures et ourlets fixes.
- Tests : web 526 ✓ (`smoothMesh.test.ts`, test de `usePatternWizard`), API 211 ✓, moteur 343 ✓. API 3003 relancée.
- Piège : `scratchpad/cap.mjs` (deviceScaleFactor 3) renvoie une capture identique octet pour octet à celle de la veille
  sur la robe faf98872 — utiliser `captz.mjs` (×1,5, avec zoom), qui reflète bien le code courant.

**Suite 2 (2026-10-21, matin)** :
- **Pointes de tête de manche** : cause = `pushOutOfTorso` poussait 1–2 colonnes seules hors du buste près de l'aisselle
  (pointe de 10–12 mm, pas le lissage). `featherGridOffsets` (`smooth-mesh.ts`) répartit la poussée sur ±3 rangs/colonnes
  (1 / 0,8 / 0,5 / 0,2), puis `pushOutOfTorso` est refait ; pointe 10,7 → 3 mm. Tests : `smoothMesh.test.ts`,
  `garment3dSleevePuff.test.ts` (« has no point… »).
- **Mannequin — carrure** : `readBodyMeasurements` lit `CARRURE_DOS` (× 0,95) puis `CARRURE_DEVANT` (× 1) puis
  `LARGEUR_EPAULE` (même priorité que `fitTorsoOutline`) ; `shoulderMeasured` ouvre la borne de rétrécissement du scan à
  0,78 (scan aux épaules larges : la femme moyenne prend déjà 0,9 ; sans mesure la borne 0,9 reste, sinon 2 points de
  peau sous le col de la robe victorienne). Épaule au mm près (≤ 3 mm) de 34 à 40 cm de carrure.
- **Mannequin — pente** : `shoulderDrop` (PENTE_EPAULE, 1,5–9 cm) → `landmarks.shoulderY = napeY − pente` (défaut
  `DEFAULT_SHOULDER_DROP` 5 cm) ; `fitHumanBody` étape 3b lève/abaisse l'épaule autour de la base du cou et porte le bras
  (±3,5 cm max). Tests : `bodyMeasurements.test.ts`, `humanBody.test.ts`.
- Vérification visuelle (captures `scratchpad/final/`) : robe e6765df4 (manches ballon lisses, dos fermé OK ; avant-bras
  ajusté du gigot absent, jour au dos à la taille) ; jupe c4f551dd (fente dos illisible sur tissu noir, ourlet un peu
  évasé au dos). Artefact : https://claude.ai/artifact/K4fBDPPnx5rwUkFkFZWMNz
- Tests web 3D + assistant 534 ✓, tsc / eslint OK. Rien n'est commité.

**Reste à faire** :
1. Robe e6765df4 : gigot qui doit se refermer sur un avant-bras ajusté jusqu'au poignet (la 3D s'arrête au coude) ;
   jour entre corsage et jupe au dos.
2. Jupe : fente dos lisible en 3D (ouverture ou marque) ; poches de jupe à vérifier sur un projet qui en a (aucun avec photo).
3. Robe victorienne avec épaules mesurées étroites : vérifier qu'aucune peau ne se voit sous le col.

---

## 0 unquadragies. Session 2026-10-20 (soir) — Modèle local de lecture de photo, entraîné sur nos propres lectures (Claude Code) — TERMINÉ (v1)

Demande : « analyse les photos toi-même, sans passer par l'API, entraîne le modèle toi-même, et relance le projet ».

- **Lectures** : ~430 photos libres de droits lues par Claude Opus 5.5 (`apps/ai-service/ml/data/vision/labels_part1-4.py`,
  + lectures des bancs) — type, coupe, présentation, occasion, style, longueur, manches, col, encolure, aisance, ampleur.
  Non validées par une couturière. Photos hors dépôt : `~/angaly-garment-bench-photos`, `~/angaly-dress-images`,
  `~/angaly-dress-met`, `~/angaly-sleeves`, `~/angaly-vision-extra{,2,3}`, `~/angaly-vision-met` (licences :
  `candidates.jsonl` de chaque dossier). `fetch_eval_photos.py` (nouvelles catégories) et `fetch_met_photos.py`
  (`--tags`, `--offset`, `--exclude` pour éviter les objets du golden) étendus.
- **Modèle** (`app/local_vision.py`, `ml/scripts/train_vision_model.py`, doc `docs/features/ai-model-settings.md`) :
  CLIP ViT-B/32 ONNX (CPU) + régressions logistiques par champ + ridge pour `fullness.skirt` ; seuil par champ pour ≥ 80 %
  de bonnes réponses en validation croisée ; golden exclu (nom, SHA-256, similarité ≥ 0,95).
  Artefacts gitignorés : `ml/models/clip/vision_model_quantized.onnx`, `ml/models/vision_profile.joblib`.
  Résultats sur le golden (116 photos jamais vues) : type 59/82 quand il répond (51 % global), présentation 90 %,
  longueur 37/38, coupe 9/9, occasion 10/12 ; manches / col / encolure : il s'abstient (pas assez sûr).
- **Branchement** : `analyze_inspiration` retombe sur le modèle local quand le fournisseur échoue (crédits épuisés —
  c'est le cas —, délai, clé) → `modelVersion = local-vision-2026-10-20`, confiance ≤ 0,6. Testé de bout en bout par l'API
  3003 : 2–3 s. Tests `tests/test_local_vision.py` ; ai-service 150 tests verts. Dépendances : `onnxruntime`, `pillow`.
- **Relance** : ai-service 8001 relancé (l'ancien était figé) ; **API 3003 non relancée** à la demande de l'utilisateur
  (autre session active) — elle garde l'ancien vocabulaire en mémoire jusqu'à sa relance ; web 3100 inchangé (HMR).
- **Limites / suite** : la longueur est fausse sur la photo du projet `1f4cbd07…` (« MINI » pour un pantalon au sol) ;
  manches et col pas encore appris (trop peu d'exemples par famille) ; couleur prise au centre de la photo (le haut, pas le
  bas, sur un pantalon). Plus de lectures (surtout pantalons/jupes portés, manches) amélioreraient ces champs.

## 0 quadragies. Session 2026-10-20 (suite) — Bas du corps complet, banc d'essai tous vêtements (Claude Code) — TERMINÉ (1er tour)

- **Moteur** : `shared/bottoms.ts` (hauteur de taille, ceinture, fermeture/braguette, plis/pinces, poches devant/dos, revers,
  fente de jupe, fournitures) branché dans `PantalonRule` (`draftTrousers`), `JupeRule` (ceinture sur toute jupe, ourlet =
  `fullness.skirt` × taille si lu sur photo, sinon évasement de la coupe à l'échelle de la longueur) et le pantalon du costume
  (la `longueur` du costume ne règle plus que le pantalon). `LONGUEUR_ENFOURCHURE` (catalogue), `HAUTEUR_BASSIN` pour le
  pantalon, `fullness.leg` / `lengths.legPct`. `rule.notions` enfin appelé. Doc : `pattern-engine.md` « Bas du corps ».
- **Types** : nouveaux groupes (`ceinture`, `plis`, `poches`, `poches_dos`, `bas`, `fente`, fermetures pantalon/jupe),
  `DETAIL_GROUPS_BY_GARMENT` (`pattern-detail-groups.ts`) partagé par l'assistant et l'API (`missingGroups`,
  `acceptSuggestedDetails` filtrent par vêtement), ligne interne `WAIST`, arrondi des pas sans bruit flottant.
- **ai-service** : vocabulaire + filtres par vêtement, règle de lecture d'une coupe de pantalon (genou / ourlet), bornes des
  réglages de jambe, **timeout des appels fournisseur** (`AI_PROVIDER_TIMEOUT_S`, 75 s, 1 relance). **API** :
  `AI_SERVICE_VISION_TIMEOUT_MS` (90 s, l'ancien 20 s coupait toutes les analyses Opus).
- **Constat** : le compte Anthropic n'a plus de crédits (« credit balance is too low ») ; l'ai-service 8001 (terminal de
  l'utilisateur) était figé (même `/health`), à relancer. Les lectures du banc sont faites à la main :
  `ml/data/garment_benchmark_opus_analysis.json` (16 photos, non validées, hors entraînement) ; `dress_benchmark.py` accepte
  `--garments all --analysis <json>` et `ANGALY_API`.
- **Assistant** : groupes et croquis des options du bas du corps (`garment-sketch.ts`), curseurs « Longueur de jambe » et
  « Largeur du bas de jambe ». **3D** : ancrage sur la ligne `WAIST`, pièces intérieures non drapées (`INSIDE_NAMES`),
  ceinture posée sur le haut d'un pantalon / d'une jupe seuls.
- **Projet de l'utilisateur** `1f4cbd07…` : v4 générée avec la lecture de sa photo (taille haute, ceinture galbée, braguette,
  poches de couture, sol ; coupe SIRENE gardée, choix du client). Sa photo montre plutôt une jambe large (genou ≈ ourlet).
- **Banc** : 16 projets dans `scratchpad/bench/run1/results.json` (copie : relancer avec la commande ci-dessus), captures
  `cap1/`. Vu : jupes crayon conformes ; trapèze trop évasée (corrigé moteur, à régénérer) ; costume veste trop longue
  (corrigé) ; jupe cercle trop ample (passer `fraction` 0,5 dans la lecture) ; **pantalons amples (DROITE AMPLE, OVERSIZE,
  PRINCESSE) : bosse « culotte de cheval » aux hanches en 3D — à corriger en priorité** (ligne de bassin / plis trop larges
  en haut, voir `drapeLeg`) ; ceinture d'un pantalon taille basse posée trop haut (corrigé).
- **Services** : API partagée 3003 **non redémarrée** (autre session) — elle a encore les anciens `@angaly/types` en mémoire et
  rejettera les nouveaux groupes jusqu'à son redémarrage. `pattern-engine` et `types` `dist` reconstruits ;
  l'API de test (port 3013, `apps/api/.bench-dist`) est arrêtée et supprimée.
- Vérifs (fin du second passage) : pattern-engine 334, web (aperçu + assistant + mesures) 516 (2 skip), api 206, ai-service
  146 — tout vert ; `tsc` engine / web / api OK, eslint OK.
- **Second passage (fait)** : banc régénéré (v2) et recapturé (`cap2`, puis `cap5` pour les pantalons amples) ; corrigés :
  bosse aux hanches et au fessier des pantalons amples (3D, voir `pattern-engine.md`), taille froncée des pantalons à
  enfiler, ourlet de jupe (trapèze conforme), longueur de veste du costume, jupe cercle → demi-cercle. Ajoutés : dos de robe
  (`dos` enfin dessiné : V, dos nu, goutte, transparent + tulle) et mesure `PENTE_EPAULE`. Tests : `robe-back.test.ts`,
  `garment3dDressBack.test.ts`, `garment3dSkirtBottoms.test.ts`, test « no bulge » de `garment3dTrousers.test.ts`.
- **Conformes à la photo** : jupes crayon (2), trapèze, demi-cercle, longue en satin ; pantalons pattes d'éléphant (2), slim,
  droit, palazzo, taille haute à plis ; costume (veste aux hanches).
- **Reste** : plis de la jupe plissée invisibles en 3D (tube droit) ; revers et ouverture de la veste peu visibles en 3D ;
  le jean skinny paraît droit (aisance minimale d'un tissu tissé ; `STRETCH` à exploiter) ; robe : poches, doublure,
  retouches de morphologie ; chemise (patte, empiècement, poignets) et veste (revers crantés, poches) — voir
  `pattern-parameters-gap.md`.

## 0 novemtricies. Session 2026-10-20 — Pantalon pattes d'éléphant en 3D, revue des paramètres manquants (Claude Code) — TERMINÉ

Demande : le projet `1f4cbd07-1dbe-42f4-a9e7-4db41cc9fe5d` (PANTALON, coupe SIRENE = « Pattes d'éléphant », longueur SOL,
compte `client@angaly.mg`) ne ressemblait pas à des pattes d'éléphant en 3D ; puis lister ce qui manque (mesures, fermeture…)
pour le pantalon, les robes (à plat ou moulage), les hauts, les jupes.

- **Moteur** (`shared/cut-profile.ts`) : `LEG_PROFILES` recalibrés (tours genou/ourlet : droite 47/43, slim 41/35, bootcut 43/52,
  pattes d'éléphant 41/69, palazzo ≈ 72/72, baggy 68/55) ; mots-clés libres BOOTCUT, PATTE/ELEPHANT/BELL, BAGGY ajoutés ;
  nouvelle `trouserKneeMm` (pantalon + costume) : la ligne du genou ne descend plus avec la longueur choisie. Tests :
  `cut-profile-garments.test.ts` (« trouser leg shapes »). L'ancienne sirène (51 cm d'ourlet) était presque une jambe droite.
- **3D** (`garment-model.ts`, `drapeLeg`) :
  - une jambe plus large qu'au genou s'arrondit en cône (`LEG_ROUND*`) et fait 6 godets (`LEG_GODETS`, `LEG_GODET_MAX`) ;
  - sous le genou les jambes ne se croisent plus (`LEG_APART_*`) ; là où les cuisses se touchent, le tissu des deux jambes se rejoint
    (`LEG_CLOSE_*`), sinon on voyait la peau entre les cuisses ;
  - l'ourlet s'arrête au sol (`FLOOR_Y`).
  Test : `__tests__/garment3dTrousers.test.ts` (corps humain posé). Le test « places a trousers pattern… » de `garment3d.test.ts`
  ne vérifie plus l'écart des jambes que 20 cm sous la fourche.
- **Assistant** : croquis de jambe (`garment-sketch.ts`, `LEG`) alignés sur les nouvelles formes.
- **Projet régénéré** : version 3 (via une 2e API sur le port 3013, 3003 non redémarrée, l'autre session tournait). Captures
  avant/après dans le scratchpad (`tr0-*`, `tr7-*`). Le dist de `packages/pattern-engine` a été reconstruit.
- **Revue** : `docs/features/pattern-parameters-gap.md`, ce qui manque par vêtement (sources FreeSewing, Smart Pattern, Minerva).
  En tête : pantalon (longueur d'enfourchure, hauteur taille-bassin, fermeture braguette/zip, ceinture, poches, pinces, hauteur
  de taille), groupe « Dos » de la robe lu nulle part, pente d'épaule, retouches de morphologie.
- Vérifs : pattern-engine 315/315, web `pattern-studio-preview-validation-export` 373 (2 skip) + wizard 129, `tsc` web OK, eslint OK.
  Les erreurs `tsc` de `packages/pattern-engine/src/__tests__/trims.test.ts` (fichier non suivi, autre session) préexistaient.
- **Suite** : implémenter la priorité 1 de `pattern-parameters-gap.md` (pantalon), une option à la fois selon
  `adding-an-option.md`.

## 0 novotricies. Session 2026-10-20 — Rendu réaliste Blender : bfc4, RIGIDE/STRETCH, écran vu (Claude Code) — TERMINÉ

- **Ourlet bfc4 (−134 mm)** : la petite manche était cousue au bas de l'emmanchure par son bord libre et son dessous de
  bras (écart large 7 cm). Elle était tirée à travers le bras, la couture d'épaule roulait de 11 cm vers l'avant et la
  robe descendait de 10 cm. Correctif `cloth_sim/seams.py` : seul le rang de tête (`cap_row`) cherche l'emmanchure à
  7 cm ; le bout libre (`free_end`) n'est jamais cousu au corsage. Jupon (`petticoat.py`) : bas rentré progressivement,
  arrêt à 6 cm de l'ourlet (`ABOVE_HEM` 0,12 → 0,06). bfc4 : ourlet −47 mm, bras nu 62 % → 16 %. Les 5 autres robes
  sont égales ou plus proches de la photo.
- **RIGIDE assoupli** (`fabric.py` : masse 0,6, 30/30/25, flexion 8), calibré sur 5 robes de la base. Silhouette
  meilleure sur 3 robes, manches longues 2× moins remontées, 25 % plus rapide. **STRETCH** vérifié sur 2 cas
  fabriqués (aucun vêtement en maille dans la base) ; paramètres inchangés.
- **Écran vu dans l'app** (8951) : bouton → file → worker Blender réel (516 s) → « Rendu réaliste prêt » → visualiseur
  `.glb` correct. Méthode : API privée sur 3023 (`CLOTH_SIM_WORKER_TOKEN`, dossier de build séparé), le web 3100
  redirigé vers elle par Playwright. 3003 n'a jamais été redémarrée. Captures et script : `~/angaly-cloth-calib/inapp/`.
  Premier essai **FAILED** au délai de 600 s (583 s de Blender, machine chargée) : l'échec s'affiche bien.
- Tests cloth-sim : 148 passent, 99 %, ruff propre. Doc : §19 de `docs/features/realistic-render-blender.md`,
  README, checklist. Rien n'est commité.
- **Reste** :
  1. Commit, si l'utilisateur le demande.
  2. `CLOTH_SIM_TIMEOUT_S` (600 s) est juste pour les robes à traîne.
  3. Le cadrage du visualiseur coupe le bas de l'ourlet.
  4. Manches longues RIGIDE (f71e, c386) : 25 à 37 % de bras nu.
  5. 3003 n'a toujours pas de `CLOTH_SIM_WORKER_TOKEN` : sans lui, les demandes restent en file.
  6. Phase 5 cloud (si besoin).

## 0 octotricies. Session 2026-10-17 → 20 — Rendu réaliste Blender, phase 4 : calibration des tissus (Claude Code) — TERMINÉ

Suite de la section « 0 quinquetricies … phases 2 et 3 ». Détail : `docs/features/realistic-render-blender.md` §18.

- **Bug corrigé** (`apps/cloth-sim/cloth_sim/seams.py`, `_sew_halves`) : les deux moitiés miroir de chaque devant/dos
  n'étaient pas cousues au milieu → corsages tenus par les manches, jupes ouvertes. Désormais cousues (≤ 3 mm), sauf
  devant ouvert sur plastron. La simulation suit maintenant le drapé à ±0,2 (ourlet ÷ taille) sur les 6 robes du banc.
- **Mesure** `checks.silhouette` (taille naturelle du corps, tranches 3 cm) ; `simulate.py --body-friction` ;
  `scripts/calibrate_fabrics.py` (variantes, reprise, `--remeasure`). README à jour.
- **Paramètres `FABRICS` inchangés** : la rigidité FLUIDE ne bouge la silhouette que de ±0,07 et ralentit ×1,5 à ×2,5.
  L'écart à la photo vient de la coupe/du drapé en amont.
- Banc et résultats hors dépôt : `~/angaly-cloth-calib/` (`cases.json`, `out2/summary.md`).
- Tests : cloth-sim 145 verts (99 %), ruff propre. Rien de commité.
- **Reste** : (1) voir l'écran complet dans l'app — l'API 3003 est partagée avec d'autres sessions actives, ne pas la
  redémarrer sans accord (ou lancer une 2e instance sur 3013 avec `CLOTH_SIM_WORKER_TOKEN`) ; (2) bfc4 : ourlet qui
  remonte de 13 cm pendant la descente des bras (manches courtes) ; (3) phase 5 cloud, seulement si le volume le
  demande (choix d'hébergeur par l'utilisateur).

---

## 0 septtricies. Session 2026-10-20 — Assistant : détails et coupes selon le vêtement, images (Claude Code) — TERMINÉ

- Demande : projet pantalon `1f4cbd07…` (client@angaly.mg) dont l'étape Détails ne montrait que des détails de robe.
  Fiche `docs/pages/pattern-studio-wizard.md` (section 2026-10-20). Fichiers neufs : `consts/garment-details.const.ts`,
  `utils/{sketch-geometry,garment-sketch,garment-type-sketch}.ts` ; modifiés : `option-sketch.ts` (primitives
  déplacées, paramètres `garment`, `cut`), `OptionSketch.tsx` (+ `SketchImage`), étapes Details / Cut / GarmentType /
  Occasion / Style / Inspiration, `PatternStudioWizard.tsx` (largeur, props), `usePatternWizard.ts` (`detailsFor` à
  l'enregistrement). Identifiants d'options inchangés (synchro types / ai-service intacte).
- Tests : `garment-details.test.ts` (neuf), `DetailsStep`, `CutStep`, `usePatternWizard` complétés ; wizard 129 +
  preview 370 verts, `tsc` web OK, eslint 0. Captures Chrome des étapes vérifiées (pantalon et robe v2).
- **Reste** : le moteur `costume.rule.ts` applique la même `longueur` à la veste et au pantalon (un « short » raccourcit
  aussi la veste) — l'UI la présente comme longueur du pantalon ; options propres au pantalon (pinces, poches, ceinture,
  revers de bas) à ajouter au moteur si voulu (`references/adding-an-option.md`).

## 0 sextricies. Session 2026-10-17 → 19 — Triangles de peau au point d'épaule, de part et d'autre du col (Claude Code) — TERMINÉ

Retour utilisateur sur la v2 (`faf98872-…`) : deux triangles de peau visibles de dos, de chaque côté du col officier.
Aperçu 3D procédural seulement (rien dans le moteur, ni dans `cloth-sim`, ni dans les écrans).

- **Causes** (mesurées par tirs de rayons depuis la peau) :
  1. le devant et le dos sont drapés chacun de leur côté : le point d'épaule du dos tombait 1,5 à 3 cm plus loin du cou
     que celui du devant ;
  2. le pied du col se calait sur le tissu le plus haut de chaque secteur angulaire (la couture d'épaule) au lieu du
     bord d'encolure ;
  3. sur une robe-manteau ouverte, la fine bande haute du devant qui contourne le cou jusqu'au point d'épaule faisait
     renoncer au pied du col derrière le cou.
- **Correctifs** :
  - `garment-model.ts` :
    - `joinNeckPoints` amène les deux points d'épaule à leur milieu ; le tissu suit sur 8 cm (`NECK_JOIN_REACH`), en
      glissant le long de l'arête d'épaule (`ridgeAt`, extrait de `restOnShoulders`), et reste au-dessus de la peau ;
    - `pushOutOfTorso` remonte le tissu près du cou sur la peau qui est dessous (`NECK_SEAT_MAX` = 1,2 cm) ;
    - `necklineSeat` ignore le tissu du devant situé derrière l'axe.
  - `body-envelope.ts` : `skinTop` (hauteur de peau sur une grille de 5 mm, cellule seule).
  - `collar-model.ts` (`seatUnder`) : le pied se cale sur le tissu le plus proche du cou (`SEAT_EDGE`).
- **Piège** : le visualiseur n'utilise **pas** FEMME_STANDARD. Il prend les mesures de la version
  (`parametersJson.measurements`, avec `CARRURE_DOS`), le gabarit `suggestTemplate` (ici FEMME_SABLIER), les mains
  posées sur la jupe et la peau subdivisée (Loop). Avec FEMME_STANDARD, les tests passaient alors que la capture
  montrait encore les triangles. Le nouveau test `__tests__/garment3dNapeViewer.test.ts` reproduit cette chaîne
  (fixture `fixtures/robe-v2-1890.pieces.json`, version 9 du projet).
- **Tests** :
  - `garment3dNapeViewer` : 0 point de peau vu de dos, sous trois angles de caméra (avant : 10, 18 et 2) ;
  - `garment3dVictorianBody` : nouveau test du point d'épaule ;
  - `referenceDressFit` : l'écart de couture se mesure désormais du point au segment, non plus aux 5 points ; même
    seuil de 12 mm, écart réel maximal 9,5 mm, contre 8,7 mm avant ;
  - feature + wizard : 484 verts, `tsc` web OK, eslint 0 erreur.
  - Captures de la v2 (dos, face, côté) vérifiées dans Chrome : plus de triangle.
- **Suite 2026-10-20 — couture d'épaule cousue** (`sewShoulderSeams`, `garment-model.ts`, appelée en fin de
  `joinNeckPoints`) : les sommets de la couture d'épaule sont espacés de ~3 cm et pas aux mêmes |x| devant et dos ; sur
  une arête irrégulière, les deux cordes s'écartaient jusqu'à 9 mm en profondeur. Les deux coutures vont à la ligne à
  mi-chemin (6 tours de moyenne), tissu voisin entraîné sur 5 cm, toujours au-dessus de la peau (`skinTop`).
  `restOnShoulders` mémorise les sommets de couture (`Mesh.shoulderSeam`). Résultat : 0 point de peau partout (robe sans
  col vue d'au-dessus comprise) ; seuils de `garment3dVictorianBody` resserrés à 0. Feature + wizard 484 verts, `tsc` OK.
- **Reste** :
  - raideur générale du drapé (voir la piste Blender, `docs/features/realistic-render-blender.md`).
- **Environnement** : la machine a redémarré le 2026-10-17 à 15 h 15. API 3003 relancée depuis le `dist` existant
  (non rebâti, avec `API_CORS_ORIGINS` incluant 3100). Web 3100 relancé le 2026-10-19 : son `.next` avait été réécrit.
  Rien n'est commité.

## 0 quinquetricies. Session 2026-10-16 — Rendu réaliste Blender, phases 2 et 3 : worker, API, web (Claude Code) — TERMINÉ

Session menée **en parallèle** d'une autre session (piste encolure de `docs/features/pattern-studio-pistes.md`) :
aucun fichier du moteur, de `garment-model.ts`, du wizard ni des options n'a été touché.

- **Fiche** `docs/features/realistic-render-blender.md` §16 (tout le détail). Nouveau module API
  `apps/api/src/realistic-render/` (branché dans `app.module.ts`) : `POST|GET /api/pattern-versions/:id/realistic-render`,
  `GET …/:renderId` ; endpoints worker `/api/internal/cloth-sim/jobs/{claim,:id/upload-target,:id/done,:id/failed}`
  (Bearer `CLOTH_SIM_WORKER_TOKEN`, vide = 503 ; fermés par nginx/Caddy). File = table `realistic_renders`
  (migration `20261016120000_add_realistic_renders`, **appliquée à la base de dev**), `SKIP LOCKED`, cache par clé de
  contenu, quota `CLOTH_SIM_MAX_PER_DAY`. MinIO via `media` (`CreatePresignedUploadUseCase`/`ConfirmUploadUseCase`
  exportés de `media.module.ts`). Types : `packages/types/src/realistic-render.ts` (+ export dans `index.ts`, rebâti).
- **Worker** `apps/cloth-sim/cloth_sim/worker.py` (`make worker.cloth CLOTH_SIM_WORKER_TOKEN=… ONCE=1`), image
  `apps/cloth-sim/Dockerfile` (`make docker.cloth`), service `cloth-sim` de `docker-compose.prod.yml` (profil
  `cloth-sim` ; image construite et vérifiée, 1,7 Go). Variables : `docs/environment-variables.md` §9, `.env.example`, `apps/api/.env.example`.
- **Essai de bout en bout** (seconde API sur le port 3013, arrêtée depuis ; l'API 3003 n'a **pas** été redémarrée) :
  robe v2 `c39fb679…` → `DONE` en 6 min 40, `.glb` 0,2 Mo servi par MinIO, `simPose` renvoyé ; second appel = cache.
  Deux lignes restent dans `realistic_renders` (un `FAILED` du premier essai, un `DONE` réutilisable en phase 3).
- **Pour l'activer sur l'API 3003** : ajouter `CLOTH_SIM_WORKER_TOKEN=<secret>` à `apps/api/.env`, rebâtir et redémarrer
  l'API (le `dist` actuel ne contient pas encore le module).
- Tests : API `src/realistic-render` 61 (99 % des lignes) + `src/media` verts, `tsc` API OK, eslint 0 erreur ;
  cloth-sim 136 (couverture 99 %, ruff OK). Rien de commité.
- **Phase 3 (web) faite dans la même session** (fiche §17, fiche de page section du 2026-10-16) : écran Stitch vérifié
  (pas de maquette pour ce bouton), `RealisticRenderSection` sous les commandes du panneau 3D (seul changement de
  `Garment3DPanel.tsx` : import + bloc avant le rapport d'aisance), visualiseur à part `RealisticRenderViewer.tsx`
  (`Garment3DViewer.tsx` non modifié), décodeur Draco dans `apps/web/public/draco/`. Tests : 16 nouveaux, feature 356
  verts, `tsc` web OK, eslint 0 erreur. `.glb` réel vérifié dans Chrome sans interface ; écran complet non vu (API 3003
  non redémarrée).
- **Suite (2026-10-16 → 20)** : e2e Playwright `apps/web/e2e/pattern-studio/rendu-realiste.spec.ts` (vert,
  `PLAYWRIGHT_CHANNEL=chrome` ajouté à la config) ; écran vu dans l'app (fiche §17) sans redémarrer 3003 ; mesure
  `checks.silhouette` + `scripts/calibrate_fabrics.py` (phase 4, reprise par un autre agent : fiche §18, dossier
  `~/angaly-cloth-calib/`).
- **Reste** : ajouter `CLOTH_SIM_WORKER_TOKEN` à `apps/api/.env` puis redémarrer 3003 (refusé dans cette session : ne pas
  interrompre un service en cours sans accord) ; phase 4 (§18, autre agent).

## 0 quinquetricies. Session 2026-10-16 (fin) — Pistes de `pattern-studio-pistes.md` : jupe/jupon et encolure hors-épaules (Claude Code) — TERMINÉ

- **Piste 2 — jupe plus étroite que son jupon** (`robe-mariee.rule.ts`) : `juponProfile` (pure, partagée par la pièce et
  l'avertissement), `skirtHemVsJupon` (tour d'ourlet par construction : panneaux 2 × (devant + côté + dos + 60 + 3 ×
  évasement), plissé, froncé, cercle). `warnings(parameters, measurements)` : « Jupe plus étroite que son jupon (155 cm
  d'ourlet pour 251 cm)… Prévoir au moins 32 plis de 60 mm… » sous jupon × 1,05. Défaut trouvé au passage : sans
  `fullness.skirt`, une coupe droite (162 cm) recouvrait mal le jupon par défaut 2,2 (184 cm) → le jupon par défaut est
  plafonné à ce que la jupe recouvre (jamais sous les hanches). Note : la fiche donnait 2 × devant + 4 × côté + 4 × dos ;
  côté et dos sont des paires (devant au pli), le tour réel est 2 × (devant + côté + dos). `drape-blocks.test.ts` : le bloc
  4 plis × 10 mm (82 cm, moins que les hanches) est désormais signalé, attendu. ai-service : `cover_petticoat` élargit un
  bloc froncé / plissé de mariée trop étroit pour son `fullness.skirt` (+ règle dans `DRAPE_GUIDE`).
- **Piste 1 — `decollete: HORS_EPAULES`** (types, ai-service + règle « pas BATEAU », wizard + croquis, moteur, 3D) :
  `Neckline.shape = 'OFF_SHOULDER'`, 130 mm au milieu devant, bord à l'emmanchure 50 mm sous le point d'épaule
  (`offShoulderNeckline`, `offShoulderSleeve`, `markOffShoulder` → pièces suffixées « (hors épaules) », pas de col).
  Première valeur 100 mm (mesure photo ÷ base du cou) trop haute en 3D ; recalée à 13 cm d'après la position relative
  épaule → poitrine (même échelle que MOYEN −1,7 cm / EN_U −8,5 cm sous la ligne d'épaule en 3D). 3D : pas de
  `restOnShoulders` pour ces pièces, manche abaissée de 5 cm.
- **Référence 207c1614** : `detailsJson` et `inspirationAnalysisJson.profile.details` passés à `decollete HORS_EPAULES`
  (`col BATEAU` retiré, `parametersExtJson` inchangé), **version 12**. Capture face + côté : épaules nues, bord sous les
  clavicules qui remonte vers les bras, petite manche bouffante dessous — comparable à la photo. Restent (garnitures) :
  berthe de dentelle le long du bord, perles, taille en pointe ; un peu de peau visible entre bord du corsage et haut de
  manche sur l'épaule (la dentelle le couvre sur la photo).
- Tests : moteur 301 (couverture 93,1 %), web 484 (preview, wizard, mes-mesures, components), API 154, ai-service 137,
  `pnpm typecheck` OK. Moteur + types rebâtis, API redémarrée. Rien de commité.
- Pistes restantes : rendu de la berthe ; cadrage de la vue « Côté » du script de capture (coupe le bas des robes longues).

## 0 quatertricies. Session 2026-10-16 (nuit) — Photo de référence de la mariée, jupon porteur, revue des 64 patrons (Claude Code) — TERMINÉ

- **Robe de mariée 207c1614** (compte client) : photo de référence attachée (Met 108161, CC0, `inspirationMediaId`).
  Fournisseur de vision en panne (« credit balance is too low ») → **lecture faite par l'agent** (`readBy` dans le profil,
  non validée, hors entraînement) : PRINCESSE, `manches COURTES` (sleeve 1,8, 20 %), `col BATEAU`, SOL, AJUSTE,
  `PLEATED_SKIRT` 40 × 80 mm, `fullness.skirt` 3,0 (photo 3,56 × 0,85), STRUCTURE, SATIN `#d8c597`. Version 10.
  3D : ourlet ÷ taille 3,03, dôme, plis, au sol, vue d'en dessous fermée. Reste : encolure hors-épaule (bardot) non
  modélisée (`BATEAU` est haut au milieu devant), berthe et dentelles non rendues.
- **Moteur** (`robe-mariee.rule.ts`) : jupon gardé sous un bloc de jupe, ×2 au pli, ourlet = ampleur × taille du corps ×
  1,13, dôme de crinoline (√, plein à 85 %) si ampleur ≥ 2,5, longueur le long du profil ; **jupe coupée plus longue
  d'autant** (`fit.test.ts` adapté : la coupe ≥ hauteur taille-sol, < +3 %). Tests `robe-mariee.rule.test.ts` (jupon).
- **3D** (`garment-model.ts`) : jupon = support de la jupe (`ZoneDrape.support`, `petticoatRadius`) + couche intérieure
  (`drapePetticoat`) ; plis profonds sur jupon (`PETTICOAT_EASE`, `PETTICOAT_FOLD_MAX`) ; bloc Traîne au sol
  (`drapeTrain`) ; plastron arrêté au sol ; « Fond de Poche » = pièce intérieure ; `FLOOR_FAN` 0,08. `collar-model.ts` :
  col châle plié (pied ≤ 3 cm). Tests `garment3dTrain`, `garment3dCoatDress`, `garment3dCollar`.
- **Revue des 64 projets** : tous régénérés (nouvelle version chacun), capturés, audités (script jetable supprimé).
  Les 31 robes du banc restent cohérentes avec leurs photos (écarts = garnitures connues). Seed : 4 projets démo en
  identifiants moteur (`seed.ts`) + lignes de la base dev mises à jour (UPDATE sur `projectRef` ANG-PAT-2026-0000x).
- Tests : moteur 289 (couverture 92,9 %), web 482 (3D, wizard, mes-mesures, components), API patterns+ai-inference 154,
  ai-service 132, typecheck OK. Moteur rebâti, API redémarrée. Rien de commité.
- Pistes : **fiche autonome `docs/features/pattern-studio-pistes.md`** (option encolure hors-épaule ; avertissement
  « jupe plus étroite que son jupon » — `warnings(parameters, measurements)` reçoit déjà les mesures) ; cadrage de la vue
  « Côté » du script de capture (coupe le bas des robes longues).

## 0 tertricies. Session 2026-10-16 (soir) — Traîne de la robe de mariée posée au sol (Claude Code) — TERMINÉ

- **Symptôme** (projet ROBE_MARIEE 207c1614-bdc3-4945-b8c0-6a4a6b7ae955, compte client) : jupe en cône jusqu'au sol, puis
  deux pans en tube qui descendaient **sous** le sol (devant+côté jusqu'à −0,45 m, dos jusqu'à −0,88 m).
- **Moteur** : « Jupe Côté » avait un ourlet plat à (devant + dos)/2 — son bord cousu au devant (103 cm) ne correspondait
  pas. Ourlet en pente : longueur devant à x = 0, longueur dos+traîne au bord dos. Test `robe-mariee.rule.test.ts`.
- **3D** (`garment-model.ts`, `drapeHalfPanel`) : les rangs de jupe sous `FLOOR_Y` reprennent l'anneau du dernier rang qui
  pend et s'étalent sur le sol vers l'arrière (`FLOOR_FAN` 0,2), godets → ondulations. Test `garment3dTrain.test.ts`.
- Vérifié en 3D (face, côté, trois-quarts dos) après régénération v4 : robe de bal posée au sol, traîne derrière.
  Limite : la traîne est à plat (pas de drapé simulé) ; on voit un petit débord des panneaux côté de face.
- Tests : moteur 286, web preview+wizard 441, API patterns 72, typecheck web/moteur OK. Moteur rebâti, API redémarrée.
  Rien de commité.

## 0 duotricies. Session 2026-10-16 (suite) — Décolleté cœur, col châle veste/costume, bord du plastron Blender, lint (Claude Code) — TERMINÉ

- **Décolleté cœur** : `NecklineShape` gagne `SWEETHEART` (`decollete = COEUR`). `shapes.sweetheartNeckline` : lobe
  vertical à la pointe du milieu devant, à plat au-dessus de la poitrine (55 % de la largeur, mi-profondeur), puis bord
  de bretelle jusqu'au point d'encolure. Corsage de robe (`curveNeckline`) et haut du bustier de la mariée (après la
  pince). Un premier lobe qui culminait au point d'encolure restait un V en 3D (`restOnShoulders` pose le haut sur
  l'épaule). Vérifié en 3D : projet ROBE_MARIEE 207c1614-bdc3-4945-b8c0-6a4a6b7ae955.
- **Col châle** : veste et costume prenaient toujours le « Col Tailleur » (rendu en col montant). Avec `col = CHALE` ils
  prennent le `Col châle` de `collarPiece` (`cut-profile.isShawl`) ; visible en 3D (revers sur la poitrine). Projets
  VESTE 7b7ac9c1-7dc6-49be-8591-9b9175737f59, COSTUME b810ba63-7222-4be5-866d-f7a3d0adf1dc (compte client).
- **Plastron Blender** (fiche realistic-render §15) : `layers.restack` après la simulation (séparation complète sur
  les bords libres, sommets croisés seulement sur les couches cousues) ; robe v2 235 → 12 croisements, bord net
  (`/tmp/angaly-cloth/h-run6/after.png`, ≈ 10 min).
- **Lint** : erreurs de `CutStep.tsx` et `drape-blocks.ts` corrigées. `eslint src` signale encore des erreurs
  préexistantes dans 28 fichiers d'autres features (admin-ai-settings, admin-gestion-contenu, checkout…), non touchés.
- Tests : moteur 285, cloth-sim 113, API 1299 (tout), web complet vert hors `.headdump/dump.test.ts` (dossier non suivi
  du 2026-10-14) et `useAvailability` instable sous charge (passe seul). Typecheck OK. API redémarrée (moteur rebâti).
  Rien de commité.

## 0 untricies. Session 2026-10-16 — Visage/sol Blender, options et mesures Sewist, croquis et guide des mesures, vérification des 8 types (Claude Code) — TERMINÉ

- **Blender** (fiche realistic-render §15) : tête de l'aperçu web dans le job (`head`), sol + tissu remonté, jupon arrêté
  au-dessus de l'ourlet, fond de studio arrondi, rien de découpé sous nœud/cordelière (`zones.LOOSE_OVER`). Robe v2 :
  visage, chignon, ourlet au sol, plastron visible sous le nœud. cloth-sim 111 tests.
- **Données Sewist** (`~/Téléchargements/patron`, pages enregistrées ; le site renvoie 403 aux robots) : seuls les faits
  repris. Mesures `TOUR_HAUT_POITRINE` (pince de poitrine, `bustDartIntakeMm`), `TOUR_HANCHE_COMPLET` (`hipGirthCm`),
  `STATURE` (longueurs × stature/168). Options `longueur: GENOU`, `decollete: EN_U`, `fermeture: ZIP_DEVANT|BOUTONS_TAILLE`
  (types, ai-service, wizard, moteur). Non repris : liste dans `docs/features/pattern-engine.md` (dernière section).
- **Illustrations** : croquis technique par option (`pattern-studio-wizard/utils/option-sketch.ts`, `OptionSketch.tsx`,
  étape Détails) ; image 3D de chaque mesure derrière le « ? » (wizard + Mes mesures,
  `components/shared/MeasurementGuideImage.tsx`, 31 images `public/images/measurement-guide/`).
- **Vérification des 8 types** (projets « Vérif types 2026-10-16 — <TYPE> » du compte client) : trois bugs 3D trouvés et
  corrigés — pince de poitrine drapée ouverte (corsage creusé, taille aux hanches : `closeDarts`, existait déjà avec
  `TOUR_SOUS_POITRINE`), bustier de la robe de mariée ignoré (`bustier` + panneaux « Côté » rattachés au devant),
  pantalon du costume classé en torse (→ `legs`). Restent : décolleté cœur de la mariée rendu en V, col châle de la
  veste/costume non visible.
- Tests : moteur 281, web 471 (wizard, 3D, mes-mesures, components), API 196, ai-service 132, cloth-sim 111, typecheck OK.
  API redémarrée. Lint : 2 erreurs préexistantes (`CutStep.tsx`, `drape-blocks.ts`). Rien de commité.

## 0 tricies. Session 2026-10-15 — V de 004, motifs, mains de la robe v2, rendu Blender naturel (Claude Code) — TERMINÉ

- **V** : profondeur d'un V selon le niveau de décolleté (`V_DEPTH_MM` : SAGE 10, MOYEN 13 cm ; `cut-profile.ts`) — mesuré
  11–13 cm sur la photo de robe-portee-004 (v12 générée). Tests `robe.rule.test.ts`, `cut-profile.test.ts`.
- **Motifs** : lectures de robe-portee-026 (`POIS`, pois 2,5 cm jaune pâle) et met-009 (`FLEURI`, lys 14 cm crème)
  complétées dans `ml/data/dress_benchmark_opus_analysis.json` et appliquées (`apply_profile_analysis.py`). Nouveau
  champ `GarmentFit.motifSizeCm` (types, ai-service `schemas.py` + `normalize_fit` + guide de lecture, web `printTileM`).
- **Robe v2 (faf98872)** : `restHandOnSkirt` (la main se pose, la jupe n'est plus attirée), empilement de manche plafonné
  et direction du poignet sur 12 rangs (le pouce ne traverse plus). Tests `garment3dVictorianBody` (« hands and the dress »).
- **Blender** : `look` + `accent` dans le job, `look.py`, `render_look.py` (velours/satin/motifs, studio AgX), soutien de
  jupe et jupon par défaut évidé autour des mains. Fiche §14. cloth-sim 95 tests.
- Tests : moteur 278, web 425, API 151, ai-service 132, cloth-sim 95, typecheck OK. API redémarrée (moteur + types
  reconstruits). Rien de commité.
- **Reste** : mannequin sans chignon ni visage dans le rendu Blender ; bord bas du plastron un peu irrégulier sous le
  nœud ; lys de met-009 rendus en semis de grandes fleurs (pas de motif placé).

## 0 novemvicies. Session 2026-10-15 — Corsages « matelassés » et encolures en V / carrées (Claude Code) — TERMINÉ

- **Matelassé** : `ao` de `drapeHalfPanel` (`garment-model.ts`) basé sur la profondeur du creux (`foldAmplitude`,
  `FOLD_AO_DEPTH`) et plus de godets dans la zone `bodice`. Test `garment3dShading.test.ts`.
- **Encolures** (moteur) : `Neckline.shape` (`cut-profile.ts`), `curveNeckline(outline, shape)` (`shapes.ts`),
  `resolveNecklineChoice` garde la forme du col sous un décolleté. Tests `robe.rule.test.ts` (V, V sous MOYEN, carré, rond).
- Moteur reconstruit, API redémarrée, 31 robes du banc régénérées (versions à jour en base ; la fiche liste les
  versions du rejeu précédent + la section « Rejeu »). 8 robes à encolure recapturées : conformes.
- Tests : moteur 278, web 422, API 151, `pnpm typecheck` OK. Rien de commité.
- **Reste** : robe-portee-004 a un V de 8 cm (lecture `decollete = MOYEN`) alors que la photo montre un V plus profond —
  étage lecture (fiche du projet) ; motifs de tissu disparus sur quelques robes (026, 009) à vérifier.

## 0 octovicies. Session 2026-10-15 — Rejeu du banc des 31 robes (Claude Code) — TERMINÉ

- Les 31 projets de `docs/reviews/dress-benchmark.md` régénérés via l'API (compte client, mêmes mesures) ; versions et
  pièces mises à jour dans la fiche, section « Rejeu du 2026-10-15 ». Captures 3D face + côté et planches
  photo | avant | après dans `/tmp/angaly-bench/` (hors dépôt, éphémère). Scripts du rejeu : `/tmp/angaly-bench/regen.py`,
  `diff.py`, `details.py`, `sheets.py` (non versionnés).
- Plancher d'aisance : 24 robes ajustées élargies ; jupes amples qui collaient au bassin désormais évasées dès la taille.
- **Garde-fou ajouté** (API) : le remplissage IA des détails ne peut plus créer de pièce de col ni de décolleté sous un
  col / une encolure bateau (`acceptSuggestedDetails`, test `inspiration-parameters.service.spec.ts`). API 151 tests.
- **Reste** : aspect « matelassé » des corsages dans le visualiseur actuel (rendu, pas la géométrie : même sur une robe
  inchangée) — à investiguer ; verdicts de la fiche non réécrits robe par robe (seuls versions, pièces et la section de
  rejeu ont changé). Rien de commité.

## 0 septvicies. Session 2026-10-15 — Robe-manteau v2 : sirène, manche au poignet, nuque, retour, finitions Blender (Claude Code) — TERMINÉ

Demandes utilisateur (même session) : feston, évasement, ceinture en barre, comparaison à la planche (rendu Blender) ;
flèche de retour → `mes-projets-patron` ; peau à l'épaule près de la nuque ; manche qui ne suit pas la main en pose
« Debout, bras le long du corps » ; robe « sirène à partir des fesses » au lieu du A de la planche (investigation patron).

- **Sirène — cause au moteur** (skill `pattern-generation`) : deltas de coupe et d'aisance par quart (PRINCESSE + AJUSTE)
  → robe 10 cm sous la taille, 8 cm sous la poitrine ; la droite taille → ourlet passait pile sur le bassin. Corrigé :
  `MIN_WEARING_EASE_MM` + `floorQuarters` (`shared/fit.ts`, robe ; DROITE + CONFORT inchangé ; `STRETCH` sans plancher),
  `PatternParameters.fabric` passé par l'API (`generate-pattern-version.use-case.ts`), cloche des jupes `EN_LES`
  (`skirtOutline(…, bell)`, `GORED_BELL` 0,65). La 3D ne transforme pas l'excès en décollement si le tour reste ≈ celui
  du corps : c'était bien l'étage moteur.
- **Projet `faf98872…`** : v7 (`1e9c9d6d…`, plancher seul) puis **v8 `c68034f8…`** (plancher + cloche) générées via l'API
  (compte client). 3D v8 : 49,8 cm de large 20 cm sous la taille (planche ≈ 48), ourlet 84 (≈ 80) ; face/côté/dos en A.
- **3D web** : `LimbFrame.centre` / `atLength` (`body-envelope.ts`) — l'avant-bras quitte l'axe du haut du bras de 9 cm au
  poignet ; manche drapée autour de la ligne centrale, longueur mesurée le long d'elle, empilement avant le poignet de
  robe (`endBefore`). Col officier : pied cousu sur l'encolure tout autour, plastron compris (55 → 2 points de peau
  visibles sur 381 sous la nuque). Ceinture : poignets exclus du rayon.
- **Web** : flèche de l'en-tête → `ROUTES.mesProjetsPatron` (nouvelle constante), Stitch vérifié (pas de flèche sur
  l'écran : destination seulement).
- **cloth-sim** : feston (pas de couture contour ↔ contour entre bord libre et plastron), jupon `--petticoat` (opt-in :
  il remontait les poignets), `bareArm` 0 % sur v8.
- **Tests** : moteur 274, web module 3D + assistant 420 (+ `ProjectStatusHeader.test.tsx`), API patterns/ai-inference
  150, ai-service 130, cloth-sim 84, `pnpm typecheck` OK.
- **API redémarrée** (moteur `dist` reconstruit) : `node --enable-source-maps dist/main` sur 3003, `API_CORS_ORIGINS`.
  Piège : ne pas mettre `pkill -f "…dist/mai[n]"` et la relance dans la même commande (le motif tue le shell).
- **Reste** : le banc des 38 robes n'a pas été rejoué avec le plancher d'aisance et la cloche (`EN_LES` seulement pour la
  cloche ; le plancher touche les robes PRINCESSE/AJUSTEE/SIRENE en AJUSTE) — à rejouer (`dress_benchmark.py`,
  `dress_3d_capture.mjs`) ; simulation : devants qui retombent sur le plastron ; garnitures non modélisées. Rien de commité.

## 0 sexvicies. Session 2026-10-15 — Rendu réaliste Blender : manches gigot (Claude Code) — TERMINÉ

Fiche : `docs/features/realistic-render-blender.md` §12. Prototype local terminé ; **prochaine étape : phase 2**.

- **Cause trouvée** : la manche ne se dégonflait pas seulement, elle **quittait le bras**. En pose `PRESENTATION`
  (`raise: -20`), le haut du bras est à 4 mm du flanc : manche et corsage écrasés entre deux colliders, expulsés à
  travers le bras. Écarté au passage : couches, sortie de peau, raffinement, normales du corps (sain).
- **Corrections** : drapé sur le corps bras écartés (`DRESS_POSE`, +15°), corps animé vers la pose demandée en clé de
  forme sur 40 images ; bras ouverts jusqu'à 2,5 cm de dégagement (v2 : −7,5° au lieu de −20°, écrit dans le job
  `simPose` — **le web devra poser le mannequin avec**) ; soutien du ballon (`support.py`, flexion ×10 là où la manche
  s'écarte du bras) ; 80 images au lieu de 120 ; `body.armWeights` exportés ; mesure `bareArm` (`checks.py`).
- **Résultat v2** : manches gigot sur les bras jusqu'aux poignets, ballon gonflé, bras nu 7,9 % (tour du poignet
  gauche), **2 min 48** en tout, `.glb` 0,2 Mo, 268 croisements de couches.
- **Reste** : feston bas du bord de jupe sur le plastron, jupe un peu moins évasée, ceinture tendue en barre dans le
  drapé de la pose d'habillage (rattrapée par la simulation).
- **Tests** : `make test.cloth` → 80 pytest, 99 %, ruff propre. Rien d'autre touché. Rien de commité.
- **Phase 2 à faire** : `apps/cloth-sim` worker (Dockerfile Blender 4.5.14 épinglé, boucle `SKIP LOCKED`, délai de
  10 min), modèle Prisma `RealisticRender`, use-cases Request/Get, contrôleur, dépôt MinIO. L'exporteur TS vit pour
  l'instant dans `apps/cloth-sim/tools/` et importe le code du web : à déplacer dans `packages/garment3d` (§3).

## 0 quinvicies. Session 2026-10-15 — Rendu réaliste Blender, phase 1 bis (Claude Code) — TERMINÉ

Fiche : `docs/features/realistic-render-blender.md` §11. Code : `apps/cloth-sim/` (README à jour).

- **Blender pérenne** : `make install.blender` → `apps/cloth-sim/.blender/blender-4.5.14-linux-x64/` (gitignoré,
  SHA-256 vérifié). Nouvelles cibles : `make job.cloth VERSION=<uuid>` (via `scripts/dump-version.sh` + exporteur)
  et `make sim.cloth [ARGS=…]` (sortie dans `/tmp/angaly-cloth/`).
- **Corrections** : effondrement des seules arêtes courtes (la soudure par distance créait des arêtes non-manifold
  aux poignets et aux manches) ; raffinement à 2,5 cm (`remesh.py`) ; couches cachées **découpées** au lieu de
  l'auto-collision (essayée : ×2,5 à ×3 en temps, croisements toujours là) ; bord des devants libre sur le plastron
  (`zones.FREE_EDGES`) ; paires bras ↔ jupe exclues des couches ; morceaux isolés ancrés (les boucles du nœud
  tombaient à 14 m) ; masse par sommet rapportée à la surface ; tissu ressorti de la peau ; voisins sur grille.
- **Résultat v2** : 26 k sommets, **5 min** en tout, plus d'explosion, 359 croisements (plus de 1 000 avant), plastron
  et ceinture propres. **Reste** : manches gigot qui se dégonflent et bas de manche haché (pas de triplure simulée),
  léger feston en bas du bord de jupe, jupe moins évasée.
- **Tests** : `make test.cloth` → 71 pytest, couverture de 99 %, ruff propre. Rien d'autre touché (web, api, moteur).
- **Prochaine étape proposée** : tenue des manches gigot (flexion propre à la tête de manche via un groupe de
  sommets, ou pression locale), puis phase 2 (worker + `RealisticRender` + API).
- Rien de commité.

## 0 quatervicies. Session 2026-10-15 — Rendu réaliste Blender, phase 1 (prototype local) (Claude Code) — TERMINÉ

Fiche : `docs/features/realistic-render-blender.md` (résultats au §10). Nouveau dossier `apps/cloth-sim/` (README).

- **Chaîne complète qui fonctionne** : `tools/export-job.ts` (code du visualiseur : corps ajusté et posé + drapé)
  → job JSON → `scripts/simulate.py` dans **Blender 4.5.14 LTS** (coutures en sewing springs, corps en
  collision) → `garment.glb` Draco (un matériau par panneau, nommé par son id) + `metrics.json` + rendus Cycles.
- **Robe v2** (`c39fb679…`) : 17,6 k sommets, 120 images en **≈ 3 min** sur 8 cœurs, 1 Go de RAM, `.glb` de
  0,14 Mo. Jupe : vrais plis de gravité. **Défauts** : plastron et devants qui se traversent (pas de collision entre
  couches), bords effilochés (maillage du drapé irrégulier), environ 100 sommets sous la peau.
- **Corrections trouvées** : soudure et nettoyage des panneaux (338 arêtes de longueur nulle faisaient exploser le
  solveur), `NEVER_SEWN` (main sur la jupe), tolérance de tête de manche à sens unique, flexion de `STRUCTURE`
  passée de 2 à 5.
- **Blender** : le paquet Ubuntu `/usr/bin/blender` (3.0.1) donne des rendus noirs (pas d'OCIO). Archive 4.5.14
  extraite **hors dépôt**, dans le scratchpad de session (`/tmp/claude-1000/…/scratchpad/blender/`) : elle
  peut avoir disparu, la retélécharger (download.blender.org/release/Blender4.5/, vérifier le SHA-256).
- **Tests** : `make install.cloth && make test.cloth` → 38 pytest, couverture de 100 % sur `cloth_sim/`. Ruff propre.
  Rien d'autre n'a été touché (web, api, moteur).
- **Point de décision (utilisateur)** : recommandation = **phase 1 bis** d'environ 2 jours (écarter les couches de
  2 à 3 mm et limiter l'auto-collision à leur groupe de sommets, remailler chaque pièce à plat en triangles
  d'environ 1 cm), puis la phase 2 (worker + modèle Prisma `RealisticRender` + API) si le plastron est propre.
- Rien de commité.

## 0 tervicies. Session 2026-10-15 — Col raccordé au dos, bras dans la manche (Claude Code) — TERMINÉ

Retours utilisateur sur la v2 (`faf98872-…`) : peau visible entre le col officier et le dos du corsage ; avant-bras sortant de la manche gigot.

> Suite : proposition de **rendu réaliste par simulation Blender headless** (architecture, hébergement en ligne, coûts,
> plan en phases) dans `docs/features/realistic-render-blender.md`. Rien n'est implémenté ; on attend la décision de
> l'utilisateur avant la phase 1 (prototype local sur la robe v2, Blender non installé sur la machine).

- **Col (`collar-model.ts`, BAND)** : colonnes réparties à longueur d'arc égale (`pointAt`), plus à angle égal : la nuque, plate, les regroupait. Nouveau **pied** du col (`SEAT_*`) : en arrière des points d'encolure côté, il descend en ligne droite jusqu'au bord d'encolure du corsage. `necklineSeat` dans `garment-model.ts` fournit les points du corsage proches du cou ; la portée dépend de la direction (`back`). Le bas du col s'évase sur le trapèze au dos (`BAND_BACK_FLARE` 0,45 sur `BAND_FLARE_SHARE` 0,4 de sa hauteur) ; au-dessus, il reste cylindrique contre le cou. L'aisance de nuque suit l'angle réel.
- **Manche (`drapeSleeveOn`)** : chaque point de la manche est repoussé hors du bras (`pushOutside` sur la section la plus large à ±`ARM_SPAN` 1,5 cm). Le décalage du gigot vers l'extérieur et les plis de fronces faisaient passer le tissu sous la peau, au creux du coude et sur l'avant-bras : 2 à 9 cm de peau dehors, désormais < 1 cm.
- **Tests** : nouveau `garment3dVictorianBody.test.ts` (pied du col ≤ encolure du dos ; bras dans la manche en pose PRÉSENTATION). `humanNeckHair` ne contrôle plus que la partie droite du col au dos. Module + assistant 415 verts, tsc et eslint propres.
- **Essais abandonnés** : pousser le pied hors de l'enveloppe convexe (ailettes) ; relever le pied sur `env.top` ; réduire la marge de cou de `pushOutOfTorso` au dos (casse `referenceDressFit`).
- **Reste** : deux petits triangles de peau au point d'épaule (jonction devant/dos du corsage près du cou, pas le col). Raideur générale du rendu : c'est un drapé géométrique, pas une simulation de tissu (voir la réponse à l'utilisateur : simulation hors ligne Blender/CLO à étudier).

## 0 duovicies. Session 2026-10-14 (nuit, fin) — Pièces de la planche + rendu 3D réaliste (Claude Code) — TERMINÉ

- **Moteur** : `devant = MANTEAU_REVERS` (pièce « Revers » ×2, largeur variable via `facingPiece`), nouveau groupe
  `jupe` (`DEUX_PANS` / `EN_LES` : `goreSplit` → « Jupe Côté Devant/Dos » ×2), manche gigot longue en deux pièces
  (`twoPieceSleeve` : « Manche extérieure / intérieure »), jupe évasée en A dès la taille (`skirtOutline`).
  `shared/panels.ts`, tests `panels.test.ts`. Options synchronisées : types, wizard, ai-service (prompt + tests),
  specs API (`missingGroups`).
- **Tissu (3D seulement)** : `fit.fabricFinish` (MAT/VELOURS/SATIN), `contrastPrint`/`contrastMotifColor`, `accentPrint`,
  imprimés `BROCART` / `ARABESQUE` (types + ai-service). `ui/fabricTextures.ts` : brocart, arabesques, plastron à bordures.
- **3D** : `joinRows`/`joinPieces` (pièces cousues côte à côte drapées en un panneau, édition exacte des deux pièces,
  coutures verticales), revers posé sur le devant, plastron dès le haut de l'ouverture (`opensAtFlatY`), ballon de gigot
  arrondi qui s'arrête au coude et se porte vers l'extérieur (`BALLON_*`, `GIGOT_*`), zone « accent » (ballon), occlusion
  ambiante des godets et des plis (`ao`), jupe évasée qui tombe de la hanche (`FLARE_HANG_FROM`), godets plus marqués.
  Viewer : velours `meshPhysicalMaterial` (sheen), fond studio gris + lumière rasante quand `fabricFinish` est connu,
  coutures masquées sur un vrai tissu (sauf modelage/édition/sélection), pose « Présentation » par défaut dans ce cas.
- **Retours utilisateur** : cheveux « incrustés » près des oreilles (coque du crâne sous la peau entre deux cases +
  limite du chignon trop haute) et col qui n'épousait pas le cou (anneau elliptique centré sur le torse) → corrigés
  (`skullShell` au maximum local, `SCALP_MIN_LIFT`, table `lowest` du chignon ; col officier construit sur la section du
  cou de l'enveloppe, cylindrique, décollé à la nuque). Tests `humanNeckHair.test.ts` sur le vrai maillage.
- **Projet v2** `faf98872-…` (client) : v6, jupe 3,2 (sans correction « taille corsetée » : l'image IA n'est pas
  corsetée), velours `#0E1534`, plastron brocart `#EADCB8`/`#C39A4B`, arabesques `#D2AE5C`.
- **Tests** : moteur 268, web module + wizard 413, api 150, ai-service 130, `pnpm typecheck` OK, eslint module propre.
- **Non vérifié / limites** : rendu jugé en swiftshader (pas de vrai GPU) ; fond studio et pose par défaut non confrontés
  à Stitch (changement dans le canvas 3D uniquement) ; avant-bras pas plus sombre que le velours ; boutons et broderies
  rapportées non modélisés (fournitures). Rien de commité.

## 0 unvicies. Session 2026-10-14 (nuit, suite) — Robe-manteau bleu nuit affinée d'après une planche IA, copie v2 (Claude Code) — TERMINÉ

- Source : planche générée par IA (`~/Téléchargements/Planche de création d'une robe Renaissance.png`) + script Blender
  (`generer_robe_historique.py`, primitives schématiques : lu, pas exécuté, Blender absent ; il confirme la liste de pièces).
  Lecture faite par Claude Code (pas par la vision de l'app) : col montant, gigot ballon → coude puis ajusté + poignet,
  ceinture nouée, robe-manteau sur panneau ivoire, jupe ourlet ÷ taille ≈ 3,0 sur la photo (× 0,85 → 2,55).
- **Moteur** : pièces manquantes ajoutées — `Ceinture` + `Nœud (boucles/milieu)` + `Pans du nœud` (`fermeture = CEINTURE_NOUEE`),
  `Poignet` (BALLON/EVEQUE jusqu'au poignet), parementures de la robe-manteau (`facingPiece`). Gigot très ample : coude
  ajusté (`GIGOT_ELBOW_FIT` 1,15) — avant, coude = 60 % d'un haut de ~1 m ⇒ ballon jusqu'au poignet. Tests
  `finishing-pieces.test.ts`, `sleeve-gigot.test.ts` (261 verts).
- **3D** : ceinture + nœud (`drapeBelt`, rayon du tissu à la taille `beltRadius`), poignets au bout des manches (`drapeCuff`),
  parementures dans `model.inside` (« Pièces intérieures »). Test `garment3dTrims.test.ts` ; web module + wizard 401 verts.
- **Projets** (compte `client@angaly.mg`) : v1 inchangé `e6765df4-…` (v21) ; **copie v2 `faf98872-bbc7-465b-a319-7749cb73c650`**
  (v3 : col OFFICIER, CEINTURE_NOUEE, jupe 2,7, manches 2,5, velours `#141B38`, contraste `#E8D9B5`, inspiration = vue
  principale de la planche). Scripts hors dépôt : scratchpad `make_v2.py`, `regen_v2.py`.
- Non modélisé (écarts restants) : revers de velours le long du plastron, jupe en lés (devant/dos/côtés), manche en deux
  pièces (extérieure/intérieure), panneaux bleu-or brodés de part et d'autre du plastron, broderies, boutons.
- API relancée (moteur reconstruit) avec `API_CORS_ORIGINS`. Rien de commité.

## 0 vicies. Session 2026-10-14 (nuit) — Mode Édition 3D façon Blender (Claude Code) — TERMINÉ

- Fait : modes Objet / Sculpture / Édition (Tab). Édition = points du contour du patron sur le vêtement 3D : clic,
  Maj, rectangle, A, Alt+A, Ctrl+L, Rayons X ; G / S / R modaux avec X / Y / Z et saisie numérique, Échap / clic droit ;
  édition proportionnelle (O, molette) ; supprimer, subdiviser, Ctrl+clic = insérer ; médiane X/Y éditable. 2D
  synchronisée (brouillon partagé). Détail : fiche `docs/pages/pattern-studio-preview-validation-export.md`.
- Tests : module 3D + wizard 395 verts, `tsc` et eslint du module propres ; vérifié dans Chrome (swiftshader).
- Pistes : cache des instances par (panneau, pièce) ; snapping des points ; fusion de points ; points des cols / jupe en
  cercle (non drapés comme pièces modelables).

## 0 undevicies. Session 2026-10-14 (soir) — Modelage du patron directement en 3D (Claude Code) — TERMINÉ

- Fait : onglet 3D → « Modeler en 3D » : outils Modeler / Ampleur / Longueur / Lisser, rayon, atténuation, pièces
  voisines, annuler/rétablir, enregistrer une version. Les gestes écrivent dans le brouillon partagé → la 2D (pièce,
  ensemble, Studio) suit en direct. Détail, principe et limites : fiche
  `docs/pages/pattern-studio-preview-validation-export.md` (section 2026-10-14 « Modeler le patron… »).
- Perf : drapé par retouche ~775 ms → ~75–135 ms (anneaux de manche par rangée, cache des manches par pièce, drapé
  procédural à la demande, corps/enveloppe conservés tant que les mesures ne changent pas).
- Refactor : `useSaveDraft` (enregistrement du brouillon) partagé par le Studio 2D et la 3D.
- Tests : module 3D + wizard verts (vitest), `tsc` web propre, eslint du module propre. Vérifié dans Chrome
  (swiftshader) sur le projet `6726c934-…` (admin) : allongement de la jupe, anneau visible.
- Pistes : modeler aussi cols / jupe en cercle ; simplification automatique du contour en fin de geste ; mesurer la
  fluidité sur un vrai GPU (swiftshader n'est pas représentatif).

## 0 septdecies. Session 2026-10-14 — Tête de la femme 3D alignée sur un buste de référence (Claude Code)

- Fait : visage stylisé (`stylizeFace`) + coiffure chignon (`HairStyle = 'bun'`) pour les modèles `FEMME_*`, branchés
  dans `Garment3DViewer` (cheveux construits sur la tête sculptée). Calé par superposition face/profil sur l'image
  fournie (yeux, nez, bouche, menton, front, chignon coïncident). Détails : fiche
  `docs/pages/pattern-studio-preview-validation-export.md` (section 2026-10-14).
- Tests : module 3D web 245/245 (+ tests stylisation et chignon dans `humanBody.test.ts`), `tsc` web propre.
- Non fait : vérification dans le navigateur réel (rendu WebGL) — seulement des rendus argile hors ligne
  (export de géométrie via vitest + rastériseur numpy, scripts restés hors dépôt) ; à regarder sur une robe dans la page.

## 0 duodecies. Session 2026-10-13 (soir) — Projet `6726c934-…` aligné sur la photo (Claude Code)

- Fait : le projet `6726c934-0342-46e5-a3e9-fcb5b78c2971` (robe générique MIDI + traîne, v5) a reçu le profil de référence
  `robe-pois-maxi` (PATCH + `POST /generate`, admin seed `admin@angaly.mg`) → **v6** : Corsage Devant croisé, Empiècement
  Devant, Corsage Dos, Jupe plissée plis creux, Manche. Vérifié dans Chrome (3D : pois, col rond, manches bouffantes, jupe
  plissée). Ancienne v5 conservée dans l'historique. Test `Garment3DPanel` corrigé (préréglage MIROIR = coude 120°).
- **Port 3000 = autre projet** (`dashboard-web`) : web Angaly lancé sur **3100** (`next dev --port 3100`), API relancée avec
  `API_CORS_ORIGINS=http://localhost:3000,http://localhost:3100` (pas modifié dans `apps/api/.env`).
- Non fait / à vérifier : l'analyse IA de cette photo n'a pas été relancée (ai-service 8001 arrêté, pytest absent de
  l'environnement) — l'analyse stockée d'origine donnait `SANS_COL`/MIDI sans corsage ni taille basse ; vérifier que le
  pipeline vision actuel produit désormais le profil de référence sur cette image.

## 0 terdecies. Investigation 2026-10-13 — l'analyse IA lit-elle la photo de référence ? (Claude Code)

- Résultat : **non, pas seule.** Haiku 4.5 (seul fournisseur configuré, clé Anthropic) lit bien robe / évasée / manches
  courtes / col rond / maxi / pois, mais **manque** `corsage` (CROISE_FRONCE), `taille` (BASSE), `drapeBlocks`
  (PLEATED_SKIRT), `fullness.sleeve`, couleur du motif (bordeaux lu noir) — même après ajout de règles de décision +
  exemple few-shot (`garment_knowledge.py`). Deux passes donnent des détails différents (variabilité).
- Bugs trouvés/corrigés : (1) cache `inspiration_analyses` : une ligne du 2026-10-08 (avant `fit`/`drapeBlocks`) était
  resservie pour toujours → `isCurrentProfile` la traite comme périmée ; (2) option `refresh` (DTO + use case + tests)
  pour relire une photo en ignorant le cache. Tests : api ai-inference verts, ai-service 122/122.
- Réglage atelier : `patternSuggestionProvider = GEMINI` sans clé → l'analyse échoue (`default/default`) sauf si le
  wizard choisit ANTHROPIC. Node : `fetch('http://localhost:…')` bloquait (8 s) sur cette machine → utiliser 127.0.0.1.
- Pistes : tester un modèle plus fort (Sonnet/Opus) via Réglages IA ; ou 2ᵉ passe ciblée (questions oui/non sur
  corsage / taille / plis) ; garder la fiche de référence comme vérité terrain d'évaluation.

- Suite (réglages) : défaut atelier GEMINI sans clé → `AiProviderResolverService.resolveAnyConfigured` + repli dans
  `AnalyzeInspirationImageUseCase` (tout fournisseur activé/configuré, ceux testés OK d'abord) ; vérifié sans
  `aiProvider` ni surcharge d'env. Le blocage de `localhost` dans Node n'était pas une config mais la surcharge machine
  (load 55) — résolu après redémarrage ; `.env` inchangé. Tests api ai-inference 79/79.

- Opus (2026-10-13) : fournisseur ANTHROPIC passé de `claude-haiku-4-5` à `claude-opus-5-5` (PUT admin, clé conservée).
  Bug corrigé : `anthropic_provider.py` lisait `content[0].text` → échec sur le bloc `thinking` d'Opus
  (`_answer_text`, max_tokens 4096, test ajouté ; pytest 123/123). Résultat Opus sur la photo : `taille=BASSE`,
  `corsage=FRONCES_SOUS_POITRINE` (réf. CROISE_FRONCE), `PLEATED_SKIRT` BOX (12 plis, réf. 20), motif `#5a1a24` ✔ ;
  manquent encore bouffant des manches et croisé. Haiku ne trouvait aucun de ces éléments.
- UI : `InspirationPanel` (comparaison 3D ↔ photo) s'étirait à la hauteur de la colonne et la jupe sortait de l'écran →
  hauteur plafonnée à l'écran + `sticky`. La photo se charge bien partout (200, 335×597). Web module 218/218.

## 0 octodecies. 2026-10-14 — Skill `pattern-generation` (Claude Code)

- Nouveau skill **`.claude/skills/pattern-generation/`** (lien `.agents/skills/pattern-generation` pour Antigravity, règle Cursor
  `.cursor/rules/011-pattern-generation.mdc`, référencé dans `CLAUDE.md` étape 4 et `AGENTS.md`) : diagnostic par étage
  (lecture / moteur / 3D), lecture de photo, génération, boucle de vérification 3D obligatoire, liste de contrôle d'une nouvelle
  option. Références : `photo-reading-guide.md`, `vocabulary.md`, `adding-an-option.md`, `verification-loop.md`.
- **À maintenir** : toute nouvelle option ou constante de géométrie se reporte dans `references/vocabulary.md` (le code fait foi).

## 0 septdecies. Session 2026-10-14 (après-midi) — Relecture Opus des 31 robes, robe-manteau, calibration (Claude Code, Opus 5.5)

- **Vision indisponible** : la clé Anthropic de l'application n'a plus de crédits (seul fournisseur configuré, `ai_provider_configs`). Les 31 photos du banc ont été relues par Opus dans Claude Code → `apps/ai-service/ml/data/dress_benchmark_opus_analysis.json`, appliquées par `ml/scripts/apply_profile_analysis.py`. **Recharger les crédits** puis relancer `dress_benchmark.py` / `sleeve_benchmark.py` pour comparer l'IA de l'app à cette lecture.
- **Bugs corrigés** : `lengths.sleevePct` = % du bras (était % du préréglage → manches courtes de 5 cm) ; manches courtes bouffantes lues `BALLON` (prompt) ; jour à la taille d'un devant ouvert (rangs biseautés du haut de jupe, `SKIRT_TOP_SLOPE_MM`).
- **Nouveau** : détail `devant` (`FERME` / `MANTEAU_OUVERT`) + `fermeture = CORDELIERE` + `fit.contrastColor` (types, wizard, prompt, normalisation) ; moteur `openCentreFront`, `plastronPiece`, `cordPiece` ; 3D : plastron dans l'ouverture, cordelière nouée, col chemise rabattu à pointes, couleur de contraste du col (sauf sur plastron), ballon des manches courtes réparti sous l'épaule (`PUFF_BLOOM_*`).
- **Calibration** : `silhouette_ratio.py` (photo) + `measure3d.tool.test.ts` (3D, `MEASURE_DIR=...`) → `fullness.skirt` des robes Met recalé. Planches photo|3D : `dress_compare_sheet.py`.
- **Résultat** : `docs/reviews/dress-benchmark.md` — 21 ✅ / 10 ⚠️. Restent : drapés libres (008), volants étagés (001, 043), sirène trop marquée (002, 044), hors-épaule (003, 001-portée), énormes nœuds de manche (041), garnitures (jabots, ceintures, bandes).
- **Tests** : moteur 254, web 1174 (+1 outil ignoré), api 1298 (2 specs adaptées au groupe `devant`), ai-service 127, `pnpm typecheck` OK. `pnpm lint` : erreurs pré-existantes dans `apps/api/src/admin-ai-settings/__tests__` (fichiers non modifiés).

## 0 sedecies. Session 2026-10-14 — Manches : données, tête courbe, gigot rond (Claude Code)

- **Cause trouvée** : la manche était un triangle à pointe (pas de courbe de tête) et le gigot se rétrécissait en cône jusqu'au coude ; en 3D la forme ressemblait à une lame plate.
- **Moteur** (`shared/shapes.ts`) : tête de manche courbe en S (`SLEEVE_CAP_SEGMENTS`, sommet 46 % côté dos) ; gigot avec ventre à 18 % de la longueur et coude ≥ 50 % de la largeur du haut. Tests : `sleeve-gigot.test.ts` (+ `fit.test.ts` adapté) — 229 verts.
- **3D** (`garment-model.ts`) : un rang de manche très ample (> 1,2× le bras) garde un anneau rond autour du bras (`PUFF_RING_FROM/FULL`) au lieu de s'étirer le long de la pente épaule-coude. Test `garment3dSleevePuff.test.ts`.
- **Données** (hors dépôt, licences dans `candidates.jsonl`) : `~/angaly-sleeves` (≈400 photos Commons par famille : puff, gigot, bishop, bell, elbow, cap, raglan, kimono, + planches « Sewing patterns / Dressmaking ») ; `~/angaly-sleeves-drafts` (3 traités de coupe du domaine public en PDF : *Scyes and sleeves*, Cornwell 1888, Devereaux). Scripts : `ml/scripts/fetch_sleeve_data.py`, `ml/scripts/sleeve_benchmark.py`.
- **Bloqué** : crédits API Anthropic épuisés (« credit balance is too low ») — l'analyse de vision des photos de manches n'a lu que 15 photos (puff/gigot → `BALLON` ×13, cohérent). Relancer `sleeve_benchmark.py` une fois les crédits rechargés (bishop/bell/elbow/cap/raglan/kimono non lus).
- **Familles ajoutées (suite, même jour)** : `EVEQUE`, `CLOCHE`, `LANTERNE`, `RAGLAN`, `KIMONO`, `CAP` (moteur `SleeveKind`, `@angaly/types`, wizard, prompt ai-service). 3D : plis du ballon (`PUFF_FOLDS`) et tête de manche plus liée à l'épaule (`smooth(1 - cap)`). Tests moteur 242, web 227, api 150, ai-service 124. `PUFF_CROWN_SHARE` ne doit pas descendre sous 0,6 (le test `referenceDressFit` détecte l'épaule nue).
- **À faire** : valider les nouvelles familles par la vision (crédits Anthropic à recharger, `sleeve_benchmark.py`) ; épaule « aile » encore légèrement anguleuse ; reprendre le projet `e6765df4` (v9 générée, plastron crème non modélisé).
- **Dev** : API à relancer après `pnpm --filter @angaly/pattern-engine build` (elle lit `dist/`), avec `API_CORS_ORIGINS=http://localhost:3000,http://localhost:3100`.

- **Grande optimisation (suite)** : (1) **cols de robe** — `collarPiece` (`shared/shapes.ts`) ajoute Col officier / chemise / lavallière / **châle** (nouvelle option `col = CHALE`, types + wizard + prompt IA) ; avant, une robe n'avait jamais de pièce col. (2) **cols en 3D** — nouveau `utils/garment3d/collar-model.ts` : bande autour du cou, revers en V qui retombent sur la poitrine (miroir), queues de lavallière ; les cols ne sont plus « ignorés ». (3) **manche gonflante tombante et plissée** — ventre du gigot à 28 %, coude ≥ 60 %, plis `PUFF_FOLD_DEPTH` 0,3 et affaissement `PUFF_SAG_M`. Projet `e6765df4` passé en `col = CHALE` (v12). Tests : moteur 250, web 237 (+ `garment3dCollar.test.ts`, `collar.test.ts`).

## 0 quindecies. Session 2026-10-13 (nuit, suite) — Manches gigot, réajustement sur superposition, 14 robes Met de plus (Claude Code)

- Fait : (1) capture 3D manquante (Met 003) ajoutée ; (2) manches bouffantes : coupe **gigot** dans le moteur (`sleeveOutline`,
  coude à 45 %, test `sleeve-gigot.test.ts`) + 3D : tête de manche à la taille de l'emmanchure ×1,25, volume le long du bras,
  couronne abaissée (`SLEEVE_HEAD_EASE`, `PUFF_CROWN_SHARE`, test « keeps the head of a puffed sleeve… ») ; (3) banc d'essai
  étendu à 14 robes Met (31 projets en série A) ; (4) projet `e6765df4-…` (Met 023) **réajusté avec Opus** : analyse relue
  deux fois (manches ballon 2,0–2,25, jupe 2,5), superposition alignée photo ↔ 3D (`dress_overlay_aligned.py`, collier +
  ourlet + axe) → jupe 2,2, manches 2,6, v3 : taille, ourlet, col et étendue des manches coïncident.
- Constat : la superposition de la page (`Superposer`) rogne la photo et ne cadre pas comme la 3D — pour juger l'ajustement
  utiliser `dress_overlay_aligned.py`. Les épaules des manches bouffantes restent anguleuses (« ailes ») : défaut connu, à lisser
  (profil de largeur de la tête de manche) ; plastron/colorés, volants, traînes non rendus.
- Tests : pattern-engine 227, ai-service 124, web (wizard + module 3D + landing) 329, api ai-inference + patterns 150 ;
  tsc propre. Fiche de revue : `docs/reviews/dress-benchmark.md` (38 projets).

## 0 quaterdecies. Session 2026-10-13 (nuit) — Banc d'essai « photo de robe → patron → 3D » (Claude Code)

- Demande : récupérer des photos de robes, les comparer à la 3D générée, fiabiliser la génération de patron de robe,
  lister tous les projets pour revue. Fiche de revue : `docs/reviews/dress-benchmark.md` (ids, liens, licences, verdicts).
- Banc d'essai (nouveaux scripts `apps/ai-service/ml/scripts/`) : `dress_benchmark.py` (photo → MinIO → analyse IA →
  projet → patron), `dress_3d_capture.mjs` (captures 3D face/côté, compte `client@angaly.mg`),
  `dress_benchmark_report.py` (fiche markdown), `fetch_met_dresses.py` (Met Open Access, CC0, 1880+ ; l'API `v1/search`
  est retirée → `v1.1`), tag `robe-portee` ajouté à `fetch_eval_photos.py`. Images hors dépôt : `~/angaly-dress-images`
  (Commons, bruité), `~/angaly-dress-met` (CC0, propre).
- Défauts trouvés par la comparaison puis corrigés : (1) jupe froncée/plissée sur coupe évasée = fourreau droit →
  planchers de largeur d'ourlet par coupe + jupe froncée trapézoïdale (`fitSkirtBlockToCut`, `CUT_MIN_HEM_RATIO`,
  `CUT_HEM_SPREAD`) ; (2) `fullness.skirt` s'ajoutait à l'évasement de la coupe (robe « boule ») → désormais ourlet ÷ taille
  et il REMPLACE l'évasement ; (3) pas de taille haute → `taille: HAUTE` (empire) dans types/web/ai-service/moteur/3D
  (corsage suspendu au cou, jupe qui part de son bord) ; (4) col en forme + décolleté → le décolleté écrasait le V
  (`normalize_profile` + `InspirationParametersService`) ; (5) 3D : jupes froncées prises pour des rectangles (`hem = waist`
  dans `skirtBlockPanels`) → tonneau ; ouverture des fronces selon le tissu (`fabricBehavior`) et la longueur ; manches
  évasées (papillon/cloche) dessinées en planche → recherche de la tête de manche limitée aux 20 premiers cm ;
  (6) prompt : `longueur` toujours donnée pour une robe, `taille` (HAUTE/NATURELLE/BASSE), `fullness.skirt` = ourlet ÷ taille.
- Accès : un projet n'est visible que par son propriétaire ; l'admin ouvrant un projet du client voit un patron
  d'EXEMPLE sans erreur (403 avalé par `PatternPreviewValidationPage`) — à corriger (message d'erreur).
- Limites connues : manches ballon (gigot) = « épaulettes » raides ; col/volants/ceintures/garnitures non modélisés ;
  traînes en 3D ; l'IA (Haiku/Opus) varie d'un appel à l'autre (longueur de la robe 019 lue MIDI au lieu de MINI).

## 0 undecies. Session 2026-10-13 — Modèle d'inspiration, comparaison 3D, atelier de retouche (Claude Code)

- Fait (non commité) : onglet **Atelier de retouche** (dessin SVG : points, ajout/suppression, dessin de pièce, mètre,
  crans, droit-fil, aimantation, annuler/rétablir, dimensions et longueurs exactes, mesures du corps → régénération),
  **comparaison** modèle d'inspiration ↔ vue courante / 3D (côte à côte ou superposée), enregistrement en nouvelle version
  (`POST /api/pattern-versions/:id/edits`, `SavePatternEditsUseCase`, types `PatternPieceInput` / `SavePatternEditsRequest`).
  Détail : fiche page § « 2026-10-13 » et `docs/features/patterns.md`.
- Tests : module web 213 dont 1 échec **préexistant** (`Garment3DPanel.test.tsx` « poses the mannequin… » : le préréglage
  `MIROIR` de `pose.ts` donne un coude à 120° et le test attend 150 — travail non commité du 2026-10-12) ; api `save-pattern-edits`
  7/7 ; tsc propre.
- Vérifié dans Chrome (page d'essai temporaire, supprimée) : glisser un point, annuler, dessiner une pièce.
- Reste : valider le visuel avec `agy` (pas de maquette Stitch pour ces commandes) ; essayer sur un vrai projet connecté
  (`/pattern-studio/projects/<id>`, API 3003 à relancer pour charger la nouvelle route) ; e2e authentifié ; courbes de Bézier.

## 0 decies. Session 2026-10-12 (référence, fin) — Taille basse, jupe plissée, mannequin articulé (Claude Code)

- Fait (non commité) : détail `taille` (`BASSE` = basque sur les hanches) dans moteur/types/wizard/ai-service ; 3D de la
  basque et des jupes plissées cousues sur le corsage ; mannequin articulé (`pose.ts`, préréglage `MIROIR` = photo) avec
  menu « Pose » et curseurs « Articulations » dans le panneau 3D. Référence `robe-pois-maxi` corrigée, projet
  `dab617b9-…` en version 3. Détail : fiche page § « 2026-10-12 (référence, fin) ».
- Tests : web 1067+ (module 136), api 1287, pattern-engine 215 (91 %), ai-service 122 ; tsc/eslint propres sur le module.
- API relancée en fond (`pnpm --filter @angaly/api dev`, port 3003, log `/tmp/claude-1000/api-dev.log`).
- Reste : croisé du devant froncé ; contact main/jupe ; vérifier la page dans le navigateur connecté.

## 0 nonies. Session 2026-10-12 (référence, suite) — Fronces, motif, encolure, projet réel (Claude Code)

- Fait (non commité) : groupe de détails `corsage` (FRONCES_SOUS_POITRINE → pièce `Empiècement Devant`, fronces en 3D) ;
  motif du tissu dans l'analyse (`fit.fabricPrint/fabricColor/motifColor`) et texture dans le visualiseur ; point
  d'encolure aplati ; `SAGE` = encolure ras du cou 75 × 75. Détail : fiche page § « 2026-10-12 (référence, suite) ».
- Projet `dab617b9-628d-452e-a5aa-3c5fefd65ce5` : passé en robe à pois (version 2) via les cas d'usage de l'API ; sauvegarde
  SQL des tables avant modification dans le scratchpad de la session (`backup_pattern_tables.sql`).
- API : ne tournait pas (erreurs CORS « status null » dans le navigateur) ; relancée (`pnpm --filter @angaly/api dev`, port
  3003). Le `.env` racine (3004) est périmé : l'API lit `apps/api/.env`, le web `apps/web/.env.local` (3003).
- Tests : web 1059/1059, api 1287/1287, pattern-engine 214/214 (91 %), ai-service 122/122 (95,7 %). Lint : 2 erreurs
  préexistantes dans le wizard (`CutStep.tsx`, `utils/drape-blocks.ts`, non modifiés).
- Reste : valider l'étiquette ; jonction emmanchure dos vue de haut ; vérifier la page dans le navigateur connecté.

## 0 octies. Session 2026-10-12 (référence) — Robe à pois : photo → patron → ajustement 3D (Claude Code)

- Demande : analyser une photo (robe longue blanche à pois, encolure ronde, manches courtes, jupe évasée), générer le
  patron, l'ajuster sur la personne 3D jusqu'à ce qu'il tombe juste, et en garder une trace pour l'entraînement.
- Fait (non commité) :
  - fiche de référence `apps/ai-service/ml/data/references/robe-pois-maxi.json` (+ README, test pytest) : étiquette
    `GarmentProfile`, paramètres moteur, cibles/mesures d'ajustement ; image hors dépôt (sha256 seulement, droits inconnus) ;
  - moteur : encolures courbes (`curveNeckline`), dos d'encolure 2 cm, `ROND` 75 × 75 mm ;
  - 3D : tête de manche / emmanchure, couture d'épaule posée sur la crête, poussée hors du corps avant/arrière, carte de
    hauteur des épaules (`BodyEnvelope.top`), deltoïde (`LimbFrame.cap`), blocs de jupe froncée/plissée/cercle drapés.
  - Détail : fiche page § « 2026-10-12 (référence) ».
- Tests : web 1053/1053 (nouveaux `referenceDressFit.test.ts`, bloc de jupe dans `garment3d.test.ts`), pattern-engine
  213/213 (couverture 90,7 %), ai-service 121/121 (95,7 %) ; tsc et eslint propres.
- Outil : script d'ajustement hors dépôt (scratchpad `fit/fitcheck.mts` : patron → drapé → peau traversante, couverture par
  rayons, ourlet, manche, encolure) + banc de captures WebGL.
- Reste : faire valider l'étiquette par une couturière et téléverser l'image sur MinIO (droits à confirmer) avant tout
  entraînement S7 ; empiècement / fronces sous poitrine dans le moteur ; motif de tissu (pois) dans le visualiseur ;
  vérifier dans `pnpm dev`.

## 0 sexies. Session 2026-10-12 (suite) — Références, articulations, visage, cheveux, enfants (Claude Code)

- Fait (non commité) : calage du corps sur des vues de référence (pose `POSE`, `JOINT_INSET`, rotation jambes/bras), recalage
  vertical réduit (sol/entrejambe/sommet), `crotchRatio`/`napeRatio` par modèle, `HAUTEUR_FOURCHE`/`HAUTEUR_BASSIN` lus,
  subdivision de Loop + lissage Taubin, visage (yeux, couleurs, sourcils, lèvres), cheveux générés (carré / courts), modèle
  `ENFANT_GARCON`, préréglage caméra `face`. Fichiers nouveaux : `utils/garment3d/{subdivide,head-features}.ts`,
  `ui/headTextures.ts`, tests `subdivide.test.ts`. Détail : fiche, § « 2026-10-12 (suite) ».
- Tests : module 110/110, suite web complète verte (8 échecs observés uniquement sous charge CPU pendant les captures WebGL,
  repassés seuls 147/147), tsc et eslint propres.
- Outil : banc de captures WebGL (esbuild + Chrome headless + Playwright) dans le scratchpad, non versionné — à recréer si
  besoin (entrée qui monte `Garment3DViewer` avec un modèle du moteur, serveur statique, `page.screenshot`).
- Reste : vérifier dans `pnpm dev` sur un vrai projet ; cheveux par mèches (cartes) si on veut plus de finesse ; éventuel
  modèle « enfant 5 ans ».

## 0 quinquies. Session 2026-10-12 — Refonte morphologie 3D + drapé sur le corps réel (Claude Code)

- Demande : corps 3D peu réaliste de face (articulations), vêtement non ajusté au corps comme sur la photo de référence.
- Fait (non commité, avec le travail du 2026-10-09 encore non commité) : `human-body.ts` (ajustement réécrit, préserve le scan),
  `body-envelope.ts` (nouveau : enveloppes convexes torse/jambes/bras, anneaux de tissu par fonction de support), `garment-model.ts`
  (drapé réécrit : `drapeGarment`, `layout`, `proceduralEnvelope`), `Garment3DViewer.tsx` (drapé sur le corps ajusté, cheveux courts
  hommes), `body-model.ts` (bug `LARGEUR_EPAULE` = une épaule). Détail : fiche `docs/pages/pattern-studio-preview-validation-export.md`
  § « Refonte 2026-10-12 ».
- Tests : vitest web 1032/1032 (nouveaux : `bodyEnvelope.test.ts`, drapé sans peau traversante + épaules + tours ±5 % dans
  `humanBody.test.ts`), tsc et eslint propres. Stitch non consulté : aucun changement de JSX visible (logique 3D seulement).
- Outil de vérification utilisé : rendu logiciel hors-ligne (script tsx qui ajuste/drape + rasteriseur numpy), non versionné.
- Reste : petites zones de peau à la jonction emmanchure/tête de manche ; encolure devant du moteur sans profondeur par défaut
  (le corsage monte jusqu'au cou) ; « ressemblance avec la photo » dépend aussi du profil IA → patron (coupe, ampleur, longueur) ;
  vérifier dans le navigateur (`pnpm dev`) sur un vrai projet.

## 0 quater. Session 2026-10-09 — Corps 3D : cohérence des proportions, plein écran

- Fait (non commité) : plein écran du panneau 3D (`Garment3DPanel.tsx`, test ajouté) ; lissage Taubin jambes/fesses et cisaillement des jambes (`human-body.ts`) ; `'use client'` dans `GenerationLoadingScreen.tsx` ; proportions : `NAPE_Y` 1,42 → 1,45 et `crotchY = waistY - 0.28*s` (était 0.30) dans `body-model.ts`, tests `garment3d.test.ts` alignés sur `NAPE_Y`.
- Refusé : rendu low-poly façon planche anatomique (retiré). La planche ne sert que de référence de proportions.
- Vérifié visuellement : femme standard (face, côté) et homme athlétique. Non vérifié : enfant, autres morphologies femme.
- Tests : vitest module preview 91/91, tsc et eslint propres.
- Reste : bras en A-pose un peu longs, poitrine peu marquée, yeux/texture de peau, pose réglable. Attention : le `.next` d'`apps/web` a été supprimé pendant les captures, redémarrer `pnpm dev`.

## 0 ter. Session 2026-10-08 — Rendu 3D : Corps humain réaliste (Real Person 3D) & drapé haute couture

**Demande utilisateur** : Remplacer l'apparence « patate » et l'esthétique mannequin par un véritable corps humain 3D réaliste et ultra-lisse (« make it like person but not like manequin, like real person 3d ») avec un drapé fluide des vêtements sous gravité.

**Réalisations & architecture** :
1. **Anatomie humaine réaliste & suppression des artefacts de mannequin** (`body-model.ts`, `mannequin-mesh.ts`, `Garment3DViewer.tsx`) :
   - **Tête & Visage sculptés** (`createCoutureHeadGeometry`) : 40 tranches, 48 segments radiaux. Sculpture faciale anthropométrique avec nez réaliste (arête nasale, pointe, ailes narinaires), lèvres supérieure et inférieure avec arc de Cupidon et fente buccale, orbites oculaires et arcades sourcilières, pommettes zygomatiques, mâchoire définie, menton et oreilles latérales avec hélice anatomique.
   - **Coiffure & Chevelure élégante** (`createHairGeometry`) : Chevelure sculptée contemporaine en volume sur la boîte crânienne (teinte châtain foncé/espresso `#2B1E18`), encadrant le visage avec une ligne frontale naturelle.
   - **Mains & Doigts réalistes** (`createCoutureHandGeometry`) : Éminence thénar (pouce opposable), éminence hypothénar, voûte métacarpienne, et 4 doigts distincts sculptés avec sillons interdigitaux et cambrure naturelle détendue.
   - **Pieds humains réalistes** (`createCoutureFootGeometry`) : Talon calcanéen, voûte plantaire médiale relevée, tête des métatarses au contact du sol, orteils avec hallux et cambrure naturelle.
   - **Suppression intégrale du piédestal & accessoires de mannequin** : Retrait de la tige métallique dans l'entrejambe et du socle d'atelier ; la personne repose directement sur le sol avec une ombre de contact portée naturelle sous les pieds. Retrait du collet métallique en laiton du cou (le cou rejoint directement la tête). Retrait des rubans et coutures Stockman cousus sur la peau (torso lisse et vivant).
   - **Peau & Articulations organiques** : Teinte de peau humaine naturelle (`#E5CBB7` pour les femmes, `#D9BBA2` pour les hommes) avec rugosité adoucie (`roughness: 0.55`, `metalness: 0.0`) pour un éclat naturel et des reflets spéculaires doux. Articulations (épaules, coudes, genoux) intégrées en continuité sans sphères disjointes façon poupée en bois.
2. **Torso C1-lisse & lobes volumétriques** (`body-model.ts`) :
   - Échantillonnage de 32 anneaux verticaux avec interpolation cubique d'Hermite (PCHIP) strictement décroissante et $C^1$-continue.
   - Modulation de section transversale : seins bilatéraux à profils gaussiens centrés à $\pm 27,5^\circ$ avec sillon intermammaire naturel au sternum, cambrure fessière postérieure avec sillon inter-fessier, et sillon vertébral le long du rachis.
3. **Drapé caténaire sous gravité & résolution du vêtement** (`garment-model.ts`) :
   - Grille haute définition : 48 rangées, 28 colonnes (x2 faces), 36 segments de jambes, 32 segments de manches.
   - Drapé gravitationnel : amplitude des godets et flûtes croissante avec la distance verticale depuis la ligne d'ancrage (`hangFactor = Math.pow(hangProgress, 1.35)`), amortie à 0 aux coutures d'assemblage (`sin(u * PI)`), garantissant une continuité hermétique à 100 % entre panneaux devant et dos.
   - Pantalons : pli de repassage structuré devant et dos avec cassure naturelle de l'ourlet sur le coup-de-pied.
4. **Validation & Qualité** :
   - Vitest : 26/26 tests passants (`garment3d.test.ts`).
   - TypeScript : 0 erreur (`pnpm --filter web typecheck`).

---

## 0 quater. Session 2026-10-08 — Corps 3D « vraie personne » (maillage CC0) + outil Main

Remplace le mannequin procédural (section 0 ter, conservé comme repli) par le maillage MakeHuman CC0
(`apps/web/public/models/human-base.glb`, script `apps/web/scripts/build-human-base.py`) ajusté aux mesures par
`utils/garment3d/human-body.ts` (voir la fiche `docs/pages/pattern-studio-preview-validation-export.md`, section
« Corps humain réaliste »). Ajouts : outil **Main** (déplacer le rendu), pantalon enveloppant le bassin,
`SLEEVE_TILT` 36° + `SLEEVE_DROP`. Corrigé suite au retour utilisateur : liaison tête/cou, épaules, bras, cuisses/pieds, cheveux.
Tests : 90 verts (`pnpm --filter @angaly/web exec vitest run src/features/pattern-studio-preview-validation-export`), tsc + eslint propres.
Blender/Blender-MCP non utilisé (absent de la machine) ; pour régénérer le GLB : cloner MakeHuman et lancer le script.
À faire : yeux/dents, textures de peau, pose réglable, vérifier visuellement manches/robes avec de vrais patrons.

---

## 0 bis. Session 2026-10-08 (suite) — Phase 5b S2 livrée

Moteur `0.2.0-fit` : `ease`, `lengths`, `fullness` et 5 mesures (`LONGUEUR_JUPE`, `HAUTEUR_TAILLE_SOL`,
`LONGUEUR_DEVANT`, `HAUTEUR_BASSIN`, `HAUTEUR_FOURCHE`) modifient réellement les contours ; `CONFORT`/défauts
= géométrie historique (95 tests existants inchangés). `warnings[]` géométriques ajoutés. Tests : moteur 131,
API 1239, web verts, typecheck 10/10. Détail : `docs/features/pattern-engine.md`.

⚠️ Après `git pull` : appliquer la migration `20261008130000` (`pnpm --filter @angaly/database db:migrate`),
sinon toute lecture de projet échoue (colonne `parametersExtJson`).

**S2b (même session)** : les mesures restantes du catalogue sont désormais lues par le moteur — épaules/carrures,
profondeur d'emmanchure, **pince de poitrine**, manches (bras/poignet/emmanchure), col (tour de cou), jambes
(cuisse/genou/cheville/entrejambe/hauteur genou). Le catalogue passe à 28 mesures (`TOUR_HAUT_BASSIN`,
`HAUTEUR_TOTALE`, `HAUTEUR_COUDE` retirées : aucune règle ne les lit) et un test échoue si une mesure du
catalogue n'est lue par aucune règle. L'avertissement « Autre » vient du moteur (`IPatternRule.warnings?`).
`@vitest/coverage-v8` installé dans pattern-engine : couverture 89,6 % (moteur : 159 tests).

**S3 livrée** (voir `docs/features/ai-inference.md`) : `GarmentProfile.fit` extrait par l'IA (ai-service
`normalize_fit`, bornes miroir testées), fusion API client > photo, fiche + curseurs « suggéré par l'IA ».
Tests : pytest 79 (94 %), API patterns verts, web wizard 72. ⚠️ Stitch non consulté pour ces blocs UI ; l'appel IA
« texte seul » ne demande pas encore les paramètres étendus ; e2e Playwright non écrit.

**Correctif UX (même commit)** : « Générer mon patron » — l'écran de chargement reste affiché pendant la requête
**et** jusqu'à la redirection (avant : le wizard réapparaissait entre la fin de la requête et l'ouverture de
l'aperçu), étapes animées + compteur + message « toujours en cours », bouton « Génération… » désactivé,
`loading.tsx` sur `/pattern-studio/projects/[projectId]`, et bannière d'erreur si la génération échoue.
Tests : `GenerationLoading.test.tsx`, `PatternStudioWizard.generate.test.tsx`.

**S4 livrée** — blocs de drapé (froncée, plissée, cercle, portefeuille, col bénitier), `parameters.drape`,
métrage indicatif, avertissements de laize ; moteur `0.3.0-drape`, 184 tests (90,6 % de couverture). Aucune UI
pour choisir un bloc pour l'instant (PATCH `parametersExtJson.drape` seulement) → S5.

**S5 livrée** — blocs lot 2 (traîne, surjupe, bustier drapé, ourlet asymétrique), sélection IA validée, arbre de décision,
fiche de moulage, UI « Drapé et volumes », panneau « À savoir sur ce patron » sur l'aperçu. Moteur `0.4.0-drape-advanced`
(201 tests), ai-service 101 tests, API verte. ⚠️ Stitch non consulté (UI drapé + panneau) ; la fiche n'est pas dans le PDF
(export API = gabarit).

**S6 (outillage) livrée.** Évaluation : `apps/ai-service/app/evaluation/` + `make eval.photo` (rapport MD/JSON, seuils,
régressions), `packages/pattern-engine/src/eval/fidelity.ts` + `make eval.patterns` (IoU/Hausdorff par pièce). Manifeste vide
(`ml/data/eval/manifest.jsonl`) : il faut les 100–200 photos étiquetées de l'atelier (§11 source/licence), une baseline par
fournisseur, un job CI (aucune CI dans le dépôt), le tableau de bord admin. Tests : ai-service 118 (95,7 %), engine 209.
**Prochaine action : S7** (entraînement local) seulement quand le jeu de référence existe ; sinon S8 (visualisation/RGPD).
(Ancien texte S6 :) jeu de référence, métriques, `make eval.photo`, job CI, tableau de bord admin.
(Ancien texte S5 :) — drapé avancé (traîne, surjupe, manches ballon/papillon via `fullness.sleeve`,
bustier drapé, ourlet asymétrique), sélection de bloc par l'IA validée (`drapeBlocks` dans le profil),
arbre de décision « meilleure approche », fiche de moulage mannequin ; UI de choix (consulter Stitch avant JSX).
(Ancien texte S4 :) — blocs de drapé déterministes (jupe froncée/plissée/cercle, portefeuille, col bénitier :
`packages/pattern-engine/src/blocks/*.ts`, `DrapeSpec`, métrage indicatif, `warnings[]`) — voir la phase 5b §S4.
(Ancien texte S3 :) l'analyse photo remplit `ease/fullness/lengths` (prompt + `normalize_profile`
bornage + fusion API client > photo > IA) et écran « Ajustements déduits de la photo » (consulter Stitch via
`agy` avant JSX). Dette : brancher les mesures restantes du catalogue (sous-poitrine, hauteur de poitrine,
carrures, cuisse…), migrer l'avertissement AUTRE dans la règle.

---

## 0. Session précédente (2026-10-08) — Phase 5b S1 + catalogue de mesures

**Livré (S1)** : contrat de paramètres étendus (`ease`, `fullness`, `lengths`) + **catalogue de 31
mesures** pour l'ajustement (`packages/types/src/pattern-fit.ts`).
- Types : bornes, `validatePatternExtParameters` (rejet, jamais de clamp), `validateMeasurementValues`,
  `checkMeasurementCoherence`, `measurementFieldsFor(garment)`.
- DB : `pattern_projects.parametersExtJson` (migration `20261008130000_…`, client Prisma régénéré).
- API : PATCH projet valide/stocke les paramètres (400 hors bornes) ; génération les revalide et les
  passe au moteur ; profils de mesures + mesures de génération validés (400 « Mesures invalides »).
- Moteur : champs optionnels dans `PatternParameters` — **aucun contour modifié**
  (`ease-contract.test.ts`).
- Web : étape Mesures adaptée au vêtement (indispensables / recommandées / « plus de mesures »
  groupées), erreurs de plausibilité et avertissements de cohérence, curseurs aisance/ampleur/
  longueurs (`FitAdjustments`), formulaire « Mes mesures » groupé (schéma Zod tolère les champs vides).
- Tests : API 1239, web 946, pattern-engine 95, pytest 59 — tous verts ; `pnpm typecheck` 10/10.

**À savoir / dette**
- ⚠️ **Maquette Stitch non consultée** pour les nouveaux blocs JSX (`FitAdjustments`,
  `MeasurementFieldCard`, groupes du tiroir « Mes mesures ») : styles repris de l'existant. À
  vérifier via `agy` puis ajouter la ligne dans `docs/mockup-reference.md`.
- `pnpm lint` de `apps/api` était déjà rouge avant (≈250 erreurs hors périmètre).
- L'IA d'estimation ne produit que les 6 clés historiques ; les 25 autres se saisissent à la main.
- Le changement non commité des sessions précédentes (inspiration, ai-service…) est toujours dans l'arbre.

**Prochaine action : S2** — `shared/ease-profile.ts` + `shared/proportions.ts`, brancher `ease`,
`lengths`, `fullness` et les nouvelles mesures (tour sous-poitrine, hauteur de poitrine, carrures,
hauteur de fourche, tour de cuisse…) dans les règles une par une (skill `pattern-engine-rule`),
`warnings[]` dans le contrat moteur ; `CONFORT` doit rester identique aux snapshots.

---

## 1. Résumé exécutif de la session

### Fournisseurs d'IA multiples (`docs/features/ai-providers.md`) — ✅ Livré de bout en bout (Phases 1 à 7)

Toutes les étapes du plan d'implémentation de la fonctionnalité Fournisseurs d'IA multiples (`/admin/ai-settings`) ont été achevées, intégrées et testées :

1. **Phase 1 — Maquette & Alignement Haute Couture Stitch** :
   - Génération et validation via StitchMCP du tiroir slide-over de configuration : écran `acd304bc8fcf48fb900733db616f49c4` (« ANGALY Back-office — Connecter Claude (Anthropic) ») complétant l'écran principal `996ac3c27a3b4a099126604d383203ad`.
   - Arbitrage rigoureux des 5 points de copy : remplacement de « Quota illimité » par l'offre contractuelle réelle (`tierLabel`) ; latence réelle mesurée (`lastLatencyMs`) sans faux compteurs de requêtes mensuelles ; retrait du bouton mort « Rapports de précision biométrique » ; neutralisation géographique exacte (« sur les serveurs sécurisés d'ANGALY ») ; remplacement du badge sans définition par « Patronage Déterministe » (ADR-005).

2. **Phase 2 — Schéma PostgreSQL & Types Partagés** :
   - Modèle Prisma `AiProviderConfig` et enums `AiProviderId` (12 providers : Anthropic, Gemini, OpenAI, Meta Muse, Mistral, Groq, OpenRouter, DeepSeek, Together, Cerebras, Custom OpenAI/Ollama, Local Statistical), `AiProviderStatus`, `AiUsage`.
   - Migration Prisma appliquée : `20261002134653_add_ai_provider_configs`.
   - Package `@angaly/types` (`packages/types/src/ai-providers.ts` et `index.ts`) exportant les types partagés (`AiProviderCatalogEntry`, `AiProviderConfigView`, `UpsertAiProviderDto`, `AiRoutingSetting`, `UpdateAiRoutingDto`, `ProviderCredentials`, `TestAiProviderResponse`) compatibles `exactOptionalPropertyTypes: true`.
   - Clé secrète `AI_KEYS_ENCRYPTION_KEY` (AES-256-GCM 32 octets base64) documentée dans `docs/deployment.md` et `docs/environment-variables.md`.

3. **Phase 3 — Clean Architecture Backend API (`apps/api/src/admin-ai-settings`)** :
   - **Domain** : Entités `AiProviderConfigEntity`, `AiModelSetting`, ports `IAiProviderConfigRepository`, `ISecretCipher`, catalogue statique `AI_PROVIDER_CATALOG` (12 entrées). Zéro dépendance technique.
   - **Infrastructure** : Chiffrement symétrique `AesGcmSecretCipher` (AES-256-GCM avec vérification du tag d'authentification et IV aléatoire 96 bits), `PrismaAiProviderConfigRepository`, `PrismaAiModelSettingRepository`.
   - **Application** : Use cases `ListAiProvidersUseCase` (catalogue + configs masquées `••••••••3f9a`), `UpsertAiProviderUseCase` (chiffrement et validation SSRF pour baseUrl privées/metadata), `RemoveAiProviderUseCase` (garde empêchant de supprimer un provider actif), `TestAiProviderUseCase` (test avec latence réelle), `GetAiModelSettingUseCase`, `UpdateAiRoutingUseCase`.
   - **Presentation** : Contrôleur `AdminAiProvidersController` (`GET`, `PUT`, `DELETE`, `POST test` sur `/admin/ai-settings/providers`), `AiModelSettingsController` étendu, Swagger `@ApiOperation`, `@ApiResponse`, `@ApiBearerAuth`, gardes RBAC `@Roles(Role.ADMIN)`.
   - Tests Jest : 42/42 tests unitaires et intégration passés avec succès.

4. **Phase 4 — Inférence Multi-fournisseur `apps/ai-service` (FastAPI / Python)** :
   - Package de fournisseurs `apps/ai-service/app/services/providers/` :
     - `base.py` : classe abstraite `LlmProvider` et fonction utilitaire `clean_json_text`.
     - `ssrf.py` : validation SSRF bloquant les métadonnées cloud (`169.254.169.254`, `metadata.google.internal`), boucles locales et réseaux privés (hors dev/whitelist).
     - `gemini_provider.py` : intégration officielle Google GenAI SDK avec `test_connection`.
     - `anthropic_provider.py` : intégration officielle Anthropic SDK avec `test_connection` et extraction de JSON structuré.
     - `openai_compatible_provider.py` : intégration officielle OpenAI SDK paramétrable par `base_url` pour OpenAI, Mistral, Groq, OpenRouter, DeepSeek, Together, Cerebras, Meta Muse et Custom/Ollama.
     - `factory.py` : instanciation dynamique `get_llm_provider(credentials)`.
   - Schémas Pydantic synchronisés dans `app/schemas.py` (`ProviderCredentials` masquant la clé API dans `__repr__`, `TestProviderRequest`, `TestProviderResponse`).
   - Endpoint `POST /v1/providers/test` mesurant la latence réelle en millisecondes.
   - Tests pytest : 42/42 tests passés avec 95% de couverture de code (`apps/ai-service/.venv/bin/pytest`).

5. **Phase 5 — Intégration `apps/api` `ai-inference`** :
   - Service `AiProviderResolverService` : résout le fournisseur configuré en base selon l'usage (`MEASUREMENT_ESTIMATION` ou `PATTERN_SUGGESTION`), déchiffre la clé secrète avec `AesGcmSecretCipher` et transmet les `ProviderCredentials` à `apps/ai-service`.
   - Use cases mis à jour : `SuggestPatternParametersUseCase` et `EstimateMissingMeasurementsUseCase` transmettent les credentials au client HTTP `AiServiceHttpClient`.
   - Chaîne de repli automatique : si le fournisseur distant échoue ou n'est pas configuré, bascule gracieusement sur `LOCAL_STATISTICAL` (ANSUR II) pour les mesures ou le Gemini par défaut pour le style sans bloquer l'Atelier.
   - Tests Jest : 26/26 tests unitaires et intégration passés dans `src/ai-inference`.

6. **Phase 6 — Frontend Haute Couture `apps/web` (`/admin/ai-settings`)** :
   - Ajout de la méthode `put` dans [`apps/web/src/lib/api-client.ts`](file:///home/tokiarivelo/Documents/Projects/angaly/apps/web/src/lib/api-client.ts).
   - Couche API & hooks react-query sous [`apps/web/src/features/admin-ai-settings/`](file:///home/tokiarivelo/Documents/Projects/angaly/apps/web/src/features/admin-ai-settings/) : `ai-providers.api.ts`, `useAiProviders.ts`, `useAiRouting.ts`, `useUpdateAiRouting.ts`, `useUpsertAiProvider.ts`, `useRemoveAiProvider.ts`, `useTestAiProvider.ts`.
   - Composants Haute Couture conformes aux maquettes Stitch :
     - `ActiveModelSection.tsx` : sélecteurs d'usage (Mesures vs Suggestions) avec repli ANSUR II explicité.
     - `ConnectedProviderCard.tsx` : cartes de fournisseurs actifs avec monogrammes, statut, modèle ciblé, clé masquée, latence mesurée, actions Tester, Modifier, Supprimer.
     - `ProviderCatalogGrid.tsx` : catalogue filtrable (Tous, Gratuit, Payant, Auto-hébergé) avec boutons « Connecter », « Modifier », « Configurer l'hôte local ».
     - `ActiveModelSummary.tsx` : récapitulatif du modèle actif, latence, offre et avertissement déontologique.
     - `EngineGuaranteeBanner.tsx` : bandeau de garantie architecturale ANGALY (zéro géométrie générée par un tiers, ADR-005).
     - `ConnectProviderDrawer.tsx` : tiroir slide-over avec affichage/masquage de clé secrète, validation, sélection de modèle suggéré et bouton de test direct.
     - `AiSettingsPage.tsx` : assemblage de la page avec états de chargement.
   - Tests Vitest : 9 suites / 17 tests passés avec succès. Typecheck strict : 0 erreur.

7. **Phase 7 — Documentation & Traçabilité** :
   - Mise à jour de [`docs/pages/admin-ai-settings.md`](file:///home/tokiarivelo/Documents/Projects/angaly/docs/pages/admin-ai-settings.md), [`docs/features/ai-providers.md`](file:///home/tokiarivelo/Documents/Projects/angaly/docs/features/ai-providers.md), [`docs/mockup-reference.md`](file:///home/tokiarivelo/Documents/Projects/angaly/docs/mockup-reference.md), [`docs/checklist-implementation.md`](file:///home/tokiarivelo/Documents/Projects/angaly/docs/checklist-implementation.md), [`docs/environment-variables.md`](file:///home/tokiarivelo/Documents/Projects/angaly/docs/environment-variables.md).

---

## 2. État du dépôt Git (Arbre de travail)

Modifications locales vérifiées et prêtes :
- `packages/database/prisma/schema.prisma` & migration `20261002134653_add_ai_provider_configs`
- `packages/types/src/ai-providers.ts` & `packages/types/src/index.ts`
- `apps/api/src/admin-ai-settings/` (modules, use cases, ports, infrastructure crypto AES-GCM et SSRF, DTOs, controllers, tests)
- `apps/api/src/ai-inference/` (service de résolution, use cases mis à jour, client HTTP avec credentials, tests)
- `apps/ai-service/app/services/providers/` (base, gemini, anthropic, openai_compatible, ssrf, factory)
- `apps/ai-service/app/schemas.py`, `app/inference.py`, `app/main.py`, `requirements.txt`
- `apps/ai-service/tests/` (test_providers.py, test_ssrf.py, test_provider_test_endpoint.py, test_multi_provider_inference.py)
- `apps/web/src/lib/api-client.ts` (méthode `put`)
- `apps/web/src/features/admin-ai-settings/` (API client, hooks, consts, composants UI, tests)
- `apps/web/src/app/(admin)/ai-settings/page.tsx`
- Documentation synchronisée : `docs/pages/admin-ai-settings.md`, `docs/features/ai-providers.md`, `docs/mockup-reference.md`, `docs/checklist-implementation.md`, `docs/environment-variables.md`, `docs/handoff.md`.

---

## 3. Vérifications & Tests validés

| Test / Commande | Portée | Résultat |
| :--- | :--- | :--- |
| `pnpm typecheck` | Monorepo complet (10 packages Turbo) | ✅ **0 erreur** (10/10 succès) |
| `apps/ai-service/.venv/bin/pytest --cov=app` | Service IA Python (Multi-provider, SSRF, Test endpoint) | ✅ **42 tests passés, 95% couverture** |
| `pnpm --filter @angaly/api test src/admin-ai-settings src/ai-inference` | API Backend (Fournisseurs, Chiffrement AES, SSRF, Inférence) | ✅ **68 tests passés** (20 suites) |
| `pnpm --filter @angaly/web exec vitest run src/features/admin-ai-settings/` | Web Paramètres IA (Composants, Hooks, Tiroir Stitch) | ✅ **17 tests passés** (9 suites) |
| `pnpm --filter @angaly/web test` | Ensemble des tests unitaires et intégration Web | ✅ **850 tests passés** (256 suites) |

---

## 4. Prochaines actions prioritaires pour l'agent suivant

1. **Test E2E Playwright de la page `/admin/ai-settings`** :
   - Rédiger un test E2E simulant un administrateur se connectant au back-office, accédant à `/admin/ai-settings`, ouvrant le tiroir pour configurer un fournisseur (ex: Anthropic), testant la connexion et modifiant le routage par défaut.
   - Fichier cible : `apps/web/e2e/admin-ai-settings.spec.ts`.

2. **Éventuel compteur d'usage mensuel (Télémétrie IA)** :
   - Si le produit souhaite réintroduire le compteur « 148 requêtes ce mois » relevé sur la maquette Stitch, créer une table `ai_usage_logs` (`provider`, `usage`, `tokensCount`, `latencyMs`, `createdAt`) pour enregistrer la consommation réelle sans chiffres simulés.

---

## 5. Rappels d'architecture et pièges connus

- **Pages Next.js sans logique** : Tout composant sous `apps/web/src/app/` doit être un simple wrapper exportant le composant de feature (`features/<name>/ui/<Component>`). Zéro hook, zéro état local dans les fichiers `page.tsx`.
- **`exactOptionalPropertyTypes: true`** : Dans `apps/web` et `@angaly/types`, tout champ optionnel `field?: T` qui peut recevoir `undefined` doit explicitement typer `field?: T | undefined;`.
- **Clean Architecture NestJS** : Le `Domain` et l'`Application` n'importent jamais `@prisma/client` ni NestJS. Les repositories injectent des interfaces définies dans le domaine.
- **Sécurité des secrets** : Les clés API des tiers sont chiffrées avec AES-256-GCM dans PostgreSQL (`apiKeyCipher`) et masquées à la sortie (`apiKeyMasked`, ex: `••••••••3f9a`). Seul `apps/api` possède la clé `AI_KEYS_ENCRYPTION_KEY`.
- **SSRF** : Ne jamais autoriser une `baseUrl` pointant vers des réseaux privés ou des métadonnées cloud (`169.254.169.254`) sans validation par `SsrfValidator` (NestJS) et `validate_url_ssrf` (FastAPI).

## 2026-10-07 — Pipeline photos d'inspiration (économie de tokens)

- Fait : `AnalyzeInspirationImageUseCase` (download → SHA-256 → cache `inspiration_analyses` → sharp 1024 px JPEG →
  `POST /v1/pattern/analyze-inspiration` → JSON compact), `suggest-pattern-parameters` en texte seul via
  `inspirationFeatures`, vision Anthropic/Gemini/OpenAI-compatible (`generate_json_from_image`).
- Tests : `pnpm --filter @angaly/api exec jest src/ai-inference src/admin-ai-settings` (92 ✓), `ai-service` pytest (46 ✓).
- À faire : appliquer la migration `20261007120000_add_inspiration_analyses` (`pnpm --filter @angaly/database exec prisma migrate deploy`) ;
  brancher l'upload de photo côté UI Pattern Studio / projet de création (passer l'URL MinIO en `inspirationImageUrl`) ;
  envisager un modèle de vision dédié (Haiku / Gemini Flash) distinct du modèle de suggestion ; nettoyer les erreurs ESLint
  historiques de `ai-inference`.

## 2026-10-07 (suite) — Choix du modèle + apprentissage

- Fait : sélecteur « Modèle IA » dans le wizard (étapes 4 et 7) ; `GET /ai-inference/selectable-providers` ;
  `aiProvider` sur suggestions et génération ; table `pattern_learning_records` (migration `20261007150000`,
  appliquée en local) ; `PatternLearningService` + repli sur l'historique ; photo d'inspiration dans la modale IA
  des projets de création ; lint des fichiers de production d'`ai-inference`.
- Tests : api `jest src/ai-inference src/patterns` ✓, web `vitest src/features/pattern-studio-wizard` ✓, ai-service pytest 48 ✓.
- À faire : vérifier visuellement le sélecteur sur la maquette Stitch (non consultée) ; apprendre des corrections de
  mesures ; `ai-assistant.controller` lit `req.user.id` alors que le payload JWT expose `sub` (bug probable existant).


## Addendum 2026-10-08 — Pattern Studio : Inspiration en premier + pré-remplissage IA

- Étapes : Inspiration → Vêtement → Occasion → Style → Coupe → Détails → Mesures ; `?step=<clé>` dans l'URL (reprise après refresh).
- ai-service : `app/garment_knowledge.py` (taxonomie fermée, procédure, few-shot, `normalize_profile`) ; `analyze-inspiration` renvoie `profile` (`isGarment`, type, occasion, style, coupe, détails). Photo non-vêtement ⇒ rien de pré-rempli.
- API : colonne `inspiration_analyses.profile` (migration `20261008100000…` **à appliquer** : `pnpm --filter @angaly/database prisma migrate deploy`) ; le contrôleur renvoie `profile`.
- À faire : vérifier l'écran Stitch réel (ordre des étapes changé sur demande utilisateur), mettre à jour `docs/pages/` + `mockup-reference.md`, e2e Playwright, suite vitest complète (lancée en arrière-plan, non vérifiée).

## Addendum 2026-10-08 (2) — Observations persistées, construction (drapé/mannequin), paramètres optimaux
- `pattern_projects.inspirationAnalysisJson` (migration `20261008120000…`, **à appliquer**) : observations + profil du vêtement ; envoyé à chaque autosave, restauré au rechargement.
- ai-service : le profil contient `constructionMethod` (FLAT_PATTERN | DRAPING | MIXED), `presentation` (WORN | MANNEQUIN | FLAT | SKETCH), `constructionNotes`.
- Génération (`GeneratePatternVersionUseCase`) : choix du client prioritaires → trous comblés par la photo (`InspirationParametersService`, valeurs validées) → puis par l'IA (texte seul, best-effort). Avertissement si drapé/mixte (« à finaliser sur mannequin »). Tout est tracé dans `parametersJson.inspiration`.
- Limite : le moteur reste plat et déterministe (ADR-005) ; les observations libres (tissu, silhouette) alimentent l'IA mais ne modifient pas encore directement la géométrie. `PATTERN_DETAIL_OPTIONS` (API) doit rester synchronisé avec `details.const.ts` (web) et `garment_knowledge.py`.

## Addendum 2026-10-08 (3) — Plan Phase 5b
Plan complet (S1→S8) : `docs/phases/phase-5b-fidelite-photo-et-drapes.md` — paramètres étendus (aisance/ampleur/longueurs), blocs de drapé déterministes, jeu de référence + métriques, modèle local entraîné sur `ai_training_samples`, RGPD. Prochaine action : session S1. Ajouter la ligne Phase 5b à `docs/checklist-implementation.md`.

## 0 septies — Visage, cheveux, modèle costaud (2026-10-12, Claude Code)

- Yeux : ouverture lue sur les paupières (`eyeOpening`, triangles rastérisés) ; globe derrière les paupières. `sculptFace` : lèvres plus pleines, yeux un peu plus ouverts.
- Relief : éclairage studio latéral + ombrage des creux (`surface-shading.ts`, `cavityOcclusion`).
- Cheveux réécrits (`buildHair`, styles `long` | `short`) : couche de cuir chevelu coupée par alpha (ligne d'implantation lisse) + mèches sculptées ondulées (raie au milieu, jusqu'aux épaules) ; coupe courte rainurée + barbe de 3 jours (`faceColors(..., beard)`) pour les hommes.
- Nouveau gabarit `HOMME_COSTAUD` (muscle 1) + `muscle-definition.ts` (pectoraux, abdos, V iliaque) appliqué dans le viewer.
- Tests : module 115/115 (nouveaux `surfaceShading.test.ts`, `muscleDefinition.test.ts`), tsc + eslint propres. Rien n'est commité.
- Reste : vérifier dans `pnpm dev` ; légère asymétrie de la ligne d'implantation chez le garçon ; lèvres encore un peu plates ; jambes du costaud fines. Fiche page mise à jour (section « 2026-10-12 (fin) »).
