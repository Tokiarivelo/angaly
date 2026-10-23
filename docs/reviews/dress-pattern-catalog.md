# Catalogue des patrons de robe — recherche, cas de test et planches (2026-10-21)

**But.** Faire produire au moteur un patron *complet* — toutes les pièces qu'une couturière découpe, y compris les pièces
de construction (doublure, entoilage, biais) et les pièces rares des robes historiques — et le vérifier sur un banc de
35 robes de familles différentes. Travail fait par Claude Code en parallèle de la session qui reprend les deux robes
victoriennes (robe de bal 1850 et robe à gilet 1880) : aucune pièce existante n'a été retirée, la nouvelle couche
s'ajoute aux règles.

## 1. Données utilisées

| Source | Contenu | Ce qu'on en tire |
|---|---|---|
| `apps/ai-service/ml/data/dress_benchmark_notes.json` | 31 robes (Met Open Access, photos portées), verdict et écarts notés | fréquence des pièces « non rendues » (§2) |
| `apps/ai-service/ml/data/dress_benchmark_opus_analysis.json` | profils lus (coupe, détails, ampleur) | combinaisons réelles reprises dans le catalogue |
| Planches « Victorian ball gown c. 1850 » et « Robe victorienne — patron d'atelier » (fournies par l'utilisatrice) | inventaire de pièces d'un patron complet | la liste de pièces à viser (corsage en panneaux, parementures, ceinture intérieure, lés ×8, panneau de traîne, dentelles, basque, pans) |
| `~/angaly-sleeves-drafts` (Cornwell 1888, *Scyes and sleeves*, Devereaux — domaine public) | traités de coupe | pièces de construction historiques : balayeuse, tournure, engageantes, soutien de manche |
| Connaissances de coupe (histoire du costume) | robe à la française, polonaise, Régence, romantique, crinoline, tournure, Gibson, édouardienne, années 20/30, qipao, dirndl, flamenca | 35 cas de test (§4) |

## 2. Ce qui manquait (banc de 31 robes)

Écarts notés « non rendu » / « non modélisé » dans `dress_benchmark_notes.json`, regroupés :

| Pièce manquante | Robes | Désormais |
|---|---|---|
| Volant d'ourlet, volants étagés | robe-portee-026, met-001, met-043, met-045 | `HEM_FLOUNCE` (froncé ou en forme, 1–5 étages) |
| Bandes appliquées d'ourlet | robe-portee-019, met-038, met-047 | `HEM_BANDS` (suivent l'ourlet de chaque pièce) |
| Jabot | met-021, met-047 | `JABOT` |
| Pèlerine / fichu | met-005 | `CAPELET` |
| Énormes nœuds (manches, dos) | met-041 | `BOW` (chou : boucles, milieu, pans ; épaule, arrière, taille, encolure) |
| Drapé en écharpe | met-008 | `SASH` (écharpe en biais) |
| Traîne, basque, poignets contrastés, broderies, guirlandes, boléro, smocks | divers | traîne : bloc `TRAIN` (existant) ; basque : `PEPLUM` ou l'option `basque` de l'autre session ; le reste n'est toujours pas modélisé (§6) |

Et ce qu'aucune robe du banc ne demandait mais qu'un patron complet contient toujours : **doublure**, **entoilage**,
**biais**, **poches**.

## 3. Nouvelle couche moteur : `parametersExtJson.construction`

`packages/pattern-engine/src/shared/construction.ts`, appliquée par `PatternEngine.generate` **après** la règle et ses
garnitures (`trims`) : chaque pièce est dérivée des pièces de la règle (balayage d'ourlet, tour de jupe à une hauteur,
encolure, ourlet de manche, hauteur du dos) ou, à défaut, des mesures. Validation : `@angaly/types`
`pattern-construction.ts` (bornes, un seul élément par type, nœuds une fois par emplacement, 12 au plus) ; l'API la
transmet au moteur (`generate-pattern-version.use-case.ts`).

| `kind` | Pièces produites | Calcul |
|---|---|---|
| `LINING {parts?}` | « Doublure — <pièce> » pour corsage / jupe / manches | même contour ; jupe −25 mm, manche −15 mm ; pas de doublure de jupe sous un jupon (mariée) |
| `INTERFACING` | « Entoilage — <pièce> » : cols, poignets, parementures, plastrons, revers, ceintures | sans valeur de couture ; un seul pour un col coupé ×2 ; jamais une ceinture gros-grain ni une parementure d'ourlet |
| `HEM_FLOUNCE {tiers, depthMm, style}` | « Volant d'ourlet » ou « Volant étagé k/n » (froncé : bandes ; en forme : secteurs d'anneau) | longueur = tour de jupe à la hauteur de couture × 1,8 (froncé) ou × 1 (bord intérieur en forme) ; laizes ≤ 140 cm ; étages espacés de 75 % de la hauteur ; lignes de placement sur chaque pièce de jupe ; crin pour le volant en forme |
| `GODETS {count, heightMm, widthMm}` | « Godet » ×count | secteur dont la corde d'ourlet = `widthMm` ; fente marquée dans la couture de chaque pièce de jupe |
| `PEPLUM {style}` | basque rapportée en forme (2 demi-cercles), à pointes (+ parementure) ou froncée | taille + 4 cm ; **sautée** si le patron a déjà une pièce « basque » |
| `JABOT {lengthMm, tiers}` | volants plissés (330 mm coupés pour 110 finis) + patte d'attache | chaque étage 4 cm plus court |
| `CAPELET {lengthMm}` | « Pèlerine (½, milieu arrière au pli) » + parementure d'encolure | ¾ de cercle, bord intérieur = tour de cou + 3 cm |
| `BOW {place, widthMm}` | « Chou … — boucles / milieu / pans » | ×2 aux épaules |
| `HEM_BANDS {rows, widthMm, gapMm}` | « Bande appliquée k/n — pièce i de l'ourlet » | la bande épouse l'ourlet de chaque pièce (droit, évasé ou à traîne) ; ligne de placement |
| `ENGAGEANTES {tiers, depthMm}` | volants de dentelle + bracelet coulissé | ourlet de manche × 1,8 |
| `BALAYEUSE {depthMm}` | volant de propreté plissé | balayage d'ourlet × 1,5 |
| `BUSTLE {style}` | `COUSSIN` (coussin + lien), `POUF` (+ drapé relevé), `PANIERS` (4 poches de hanche + lien) | mercerie : rembourrage, cordons, cerceaux |
| `WATTEAU_PLEAT {depthMm}` | « Pli Watteau (panneau, milieu au pli) » | hauteur du dos de corsage + jupe dos |
| `SEAM_POCKETS` | « Fond de poche dans la couture » ×4 | ouverture marquée sur la couture de côté de la jupe devant |
| `BIAS_BINDING {widthMm}` | « Biais d'encolure », « Biais d'emmanchure » ×2 (sans manches) | encolure lue sur le corsage ; emmanchure ≈ 0,45 × tour de poitrine |
| `UNDERARM_GUSSET {sizeMm}` | « Gousset de dessous de bras » ×2 (biais) | — |
| `SASH {widthMm, lengthMm}` | « Écharpe drapée (biais) » | en deux parties au-delà de 2,80 m |
| `PUFF_SUPPORT` | « Soutien de bouffant (tulle raide) » ×2 | 70 % de la largeur de la manche ; avertissement sans manche |
| `APRON {lengthMm, fullness}` | « Tablier » + « Lien de tablier » | demi-taille × ampleur |

Doublure et entoilage sont **exclus du métrage** du tissu principal (`isSeparateFabric`).

**Contrat de nommage avec la 3D** (testé dans `construction.test.ts`) : aucun nom de pièce ajoutée ne contient « jupe »,
« corsage », « manche », « devant », « dos », « côté », « traîne », « jupon », « plastron », « ceinture », « nœud »,
« poignet », « revers » ni ne commence par « col » — ces mots font draper une pièce comme un panneau ou une garniture.
Doublures et entoilages gardent le nom de la pièce qu'ils doublent derrière « Doublure — » / « Entoilage — », que la 3D
range dans les pièces intérieures (`INSIDE_NAMES`, avec balayeuse, tournure, biais, gousset, soutien de bouffant).

## 4. Banc de 35 robes (`packages/pattern-engine/src/__tests__/fixtures/dress-catalog.ts`)

Moderne : fourreau doublé, robe chemise, portefeuille, trapèze 60, bohème à volants étagés, godets 30, sirène de
soirée, péplum, swing 50, babydoll, flamenca, Charleston, grecque drapée, kimono à goussets, caftan, chasuble à tablier,
dirndl, qipao, robe-manteau doublée.
Historique : robe à la française (1750, pli Watteau, paniers, engageantes), polonaise (1780, pouf), Régence (1810),
romantique gigot (1835), crinoline (1855), pagode (1860), tournure en lés (1885), Gibson (1895), édouardienne (1905),
1912 à surjupe, robe de style (1924, paniers), biais Vionnet (1933), Tudor (1540), cotte médiévale à godets (1400).
Mariée : robe de bal (jupon, traîne, volant en forme, balayeuse), sirène en dentelle à pèlerine.

Chaque cas liste les pièces attendues et interdites ; `dress-catalog.test.ts` vérifie l'inventaire, contours fermés,
finis, sans croisement, quantités ≥ 1 et aucun avertissement de géométrie (141 assertions).

**Planches** (une par robe, toutes les pièces à l'échelle, droit-fil, lignes internes, mercerie, métrage) :

```bash
cd packages/pattern-engine && PLATES_DIR=/tmp/plates npx vitest run src/__tests__/catalog-plates.tool.test.ts
```

Couleurs : tissu principal, doublure, entoilage (pointillé), garnitures (`trims`), pièces de construction, pièces
intérieures. `summary.json` résume pièces, mercerie, avertissements et métrage.

## 5. Constats sur les planches

- Les 35 robes génèrent un patron sans pièce dégénérée. Avec la nouvelle couche, le nombre de pièces passe par exemple de 15
  à 24 pour la robe à la française, de 14 à 23 pour la tournure 1885, de 15 à 29 pour la Gibson 1895, de 4 à 10 pour le
  fourreau doublé (mesuré sur `summary.json`, garnitures comprises dans le « avant »).
- Les volants en forme d'une jupe étroite (sirène) sont des demi-anneaux ; sur une jupe ample ils se coupent en 3–4
  secteurs pour tenir dans 140 cm.
- Les bandes appliquées suivent la pente d'une traîne (mariée), pas une horizontale.
- Pièces de l'autre session vues sur les planches : « Ceinture intérieure (gros-grain) », « Parementure d'ourlet (…) »
  (jupes en lés / blocs) — non entoilées par `INTERFACING`.

## 6. Suite du 2026-10-21 (soir) — 3D, lecture photo, assistant, catalogue

- **Nouveaux types** : `EMBROIDERY {place, widthMm, color}` (gabarit de broderie + zones sur les pièces + fil),
  `SMOCKING {place, rows, ratio}` (panneau coupé `ratio` × la largeur finie + fil élastique), `CONTRAST_CUFFS
  {heightMm, color}` (« Poignet (contraste) », ou le poignet existant coupé dans le tissu contrastant).
- **3D** (`utils/garment3d/construction-model.ts`) : volants (étages à leur hauteur, froncés ou en forme), godets
  (éventails dans les coutures), basque rapportée (en forme, à pointes, froncée), pèlerine posée sur les épaules,
  chous (épaules, dos, taille, encolure), pouf de tournure, engageantes sous la manche, tablier et jabot sont drapés
  sur la robe déjà drapée (surface radiale). Bandes appliquées, pli Watteau, écharpe, broderie et smocks passent par
  les zones de détail que le moteur pose sur les pièces (`InternalLine.detail`). Vérifié sur les 36 projets réels
  (captures face + côté comparées aux photos) ; corrigé en route : pèlerine en disque, engageantes en pointes,
  tablier invisible sur une jupe froncée, jabot crème sur crème, nœuds d'épaule de profil.
- **Lecture photo** : `apps/ai-service/app/construction_knowledge.py` (guide + validation, 15 types visibles) ;
  `GarmentProfile.construction` ; fusion API (`InspirationParametersService`) ; l'assistant le reprend comme suggestion.
- **Assistant** : `ConstructionEditor` (3 groupes : finitions intérieures, volants et volume, garnitures rapportées).
- **Catalogue** : page `/pattern-studio/catalogue` (`docs/pages/pattern-studio-catalogue.md`), API `pattern-catalog`,
  36 photos d'inspiration sous licence libre (Met CC0, Wikimedia Commons, deux tableaux du domaine public pour 1400
  et 1540), une photo par robe, crédit affiché ; couleurs de chaque robe (`look`) lues sur sa photo.

## 7. Limites (à reprendre)

1. ~~Les paniers et le coussin de tournure restent des pièces intérieures : la jupe n'est pas élargie aux hanches en
   3D.~~ **Levée le 2026-10-23** (`utils/garment3d/understructure.ts`) : les paniers élargissent la jupe sur les côtés
   (plate devant / derrière), le coussin la cambre au dos ; la jupe s'y drape comme sur un jupon. La robe à la
   française du catalogue a désormais une jupe froncée × 3 (`GATHERED_SKIRT`) : la jupe évasée d'origine (1 m au
   niveau des paniers, qui en demandent ~1,8 m) ne pouvait pas passer dessus et retombait plaquée sur les jambes.
2. ~~La broderie et les smocks sont rendus comme une zone de tissu contrastant / de même tissu, pas comme un motif.~~
   **Levée le 2026-10-23** (`ui/motifTextures.ts`, `DetailArea.motif`) : broderie = rinceaux et fleurs dans la couleur
   du fil, smocks = nid d'abeille en relief. La broderie d'ourlet de la robe paysanne était cachée sous son volant :
   elle commence désormais au-dessus. Le rendu réaliste Blender les dessine aussi depuis le 2026-10-23
   (`cloth_sim/motifs.py`, `docs/features/realistic-render-blender.md` §20). Le fil du dirndl, qui se confondait avec
   son corsage rouge, est rose sur corsage rayé sombre depuis le lot 4.
3. ~~Photos « au plus proche » pour quelques robes modernes.~~ **Levée le 2026-10-23** (lot 4 de
   `docs/plans/pattern-construction-suite.md`) : nouvelles sources (catégories Commons, Smithsonian Open Access,
   Europeana) dans `fetch_catalog_inspirations.py --source`. Photo ↔ fiche :

   | Robe | Nouvelle photo | Fiche ajustée |
   |---|---|---|
   | `fourreau-double` | fourreau blanc sans manches, années 60 (Smithsonian NMAAHC, CC0) | couleur blanc cassé, mat |
   | `peplum` | robe péplum en brocart sans manches (Commons, CC BY 2.0, recadrée) | sans manches, brocart rouge et or |
   | `biais-1933` | robe du soir Vionnet, crêpe de soie ombré, v. 1932 (RISD, CC0) | couleur champagne, sans satin |
   | `portefeuille` | robe portefeuille rouge (Commons, CC BY-SA 2.0, recadrée) | manches courtes |
   | `dirndl` | dirndl en vitrine (Commons, CC BY 3.0) | corsage rayé sombre, tablier vert anis, broderie rose |
   | `paysanne-smocks` | inchangée (robe smock Liberty & Co., 1890, Met) | **fiche réécrite** : robe smock Liberty, col plat brodé ton sur ton, poignets smockés, au genou ; plus de volant ni de broderie d'ourlet (aucune robe paysanne smockée sous licence libre trouvée) |

   Restent : `sirene-soiree` et `mariee-sirene-dentelle` (photos portées, gardées) ; la photo de `portefeuille`
   s'arrête au-dessus de l'ourlet ; le col bénitier et le dos nu de `biais-1933` ne se voient pas sur la photo (vue
   de face, drapé croisé). En 3D, le tablier est dessiné dans `look.contrastColor`, pas dans sa propre couleur
   (`APRON.color` ne va que dans la note de coupe) : le dirndl met donc le vert du tablier en `contrastColor`.
4. Aucune maquette Stitch dédiée n'a pu être générée (3 tentatives MCP et une `agy` en délai dépassé) : la page
   reprend les composants de l'écran « Mes projets de patron ».
5. Le modèle local de lecture de photo (`local_vision.py`) ne connaît pas encore `construction`.
