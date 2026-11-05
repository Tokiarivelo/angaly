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

## Prévisualisation enrichie (2026-10-07)

Un sélecteur d'onglets (`PreviewModeTabs`) pilote la zone centrale :

- **Pièce (2D)** — dessin technique à l'échelle 1:1 (`PatternPieceDrawing`) : ligne de coupe (couture décalée
  de la marge réelle, coins mitrés) et ligne de couture en pointillé, **AU PLI** quand la pièce est coupée au pli,
  « Couper N fois », longueurs de chaque côté, cotes largeur/hauteur, droit-fil centré, crans placés sur leur arête,
  barre d'échelle, grille 1 cm / 10 cm. Calculs purs et testés dans `utils/pattern-geometry.ts`.
- **Ensemble** — toutes les pièces sur une même feuille, à la même échelle, avec quantités, tailles et surface
  totale à découper (`PatternLayoutOverview`) ; un clic ouvre la pièce.
- **3D sur mannequin** (`Garment3DPanel`, three.js chargé à l'ouverture de l'onglet) — mannequin paramétrique aux
  mesures du client ; les panneaux sont **lofts des largeurs réelles des pièces** (devant + dos = circonférence à
  chaque hauteur), donc aisance, évasement et longueur vus en 3D sont ceux du patron. Curseur « Assemblage »
  (pièces éclatées → assemblées), mannequin et transparence optionnels, pièce sélectionnée mise en évidence, rapport
  d'aisance poitrine/taille/bassin (corps vs vêtement). La chute du tissu n'est **pas** simulée.

Optimisations 3D : rendu à la demande (`frameloop="demand"`, une image par interaction), DPR plafonné à 1,5,
maillages de quelques centaines de sommets, libération GPU des géométries, chargement différé, repli si WebGL
indisponible. Vêtements pris en charge : robe, jupe, chemise, veste, costume (pantalon/autre : message explicatif).

### Navigation 3D « façon Blender » et robustesse WebGL (2026-10-07)

- **Navigation** (`OrbitControls` de drei, inertie activée) : clic milieu ou glisser = tourner, Maj + glisser ou clic
  droit = déplacer, molette = zoom vers le curseur ; tactile : 1 doigt tourne, 2 doigts déplacent/zooment.
  Gizmo d'axes cliquable (comme Blender), boutons Face / 3/4 / Dos / Côté / Dessus / Ourlet / Recentrer et raccourcis
  pavé numérique quand la scène a le focus : `1` face, `5` 3/4, `Ctrl+1` ou `9` dos, `3` côté, `7` dessus, `2` ourlet,
  `Home` recentrer (3/4 et ourlet : lot 4 du 2026-11-05, voir plus bas).
- **WebGL** : plus de contexte « sonde » jetable (il fuyait et épuisait la limite de ~16 contextes du navigateur,
  d'où un faux « WebGL indisponible »). Le démarrage réel est protégé par `WebGlBoundary` : en cas d'échec, message
  actionnable (accélération matérielle, extensions anti-canvas), erreur technique et bouton « Réessayer » ; perte de
  contexte GPU gérée de même. Résolution adaptative pendant les interactions (`AdaptiveDpr`).

## Aperçu 3D — tout vêtement + mannequin ajustable (2026-10-08)
- **Tout vêtement est portable** : robes, jupes, hauts, vestes, costumes et « autre » (devant/dos) ; **pantalons** (deux jambes
  à partir des pièces devant + dos) ; sans pièce devant/dos (sari, cape, drapé libre…), la plus grande pièce est
  **enroulée autour du corps** (sa largeur = la circonférence, note « représentation indicative »). Refus seulement si aucune
  pièce n'a de contour exploitable.
- **Mannequin à la mesure de la personne** (`utils/garment3d/body-templates.ts`, `body-model.ts`) : 10 morphologies
  procédurales (femme standard / sablier / poire / rectangle / forte / petite / grande, homme standard / athlétique,
  enfant 10 ans) ; chaque mesure fournie (poitrine, taille, bassin, cou, épaule, bras, poignet, cuisse, genou, cheville,
  longueur dos/bras, hauteur taille-sol → stature) **remplace** la valeur du gabarit, le reste vient de la morphologie. Tous les
  repères se mettent à l'échelle de la stature. La morphologie la plus proche est présélectionnée ; sélecteur « Morphologie ».
- **Corps humain réaliste & morphologie vivante** (`utils/garment3d/mannequin-mesh.ts`, `body-model.ts`, `Garment3DViewer.tsx`) :
  remplacement de l'ancienne silhouette ovoïde rigide et des accessoires de mannequin (tige métallique d'atelier retirée,
  collet en laiton supprimé, rubans d'atelier masqués sur le corps) par une silhouette humaine réelle posée sur le sol avec ombre de contact douce :
  - Tête avec traits du visage anthropométriques sculptés : arête et ailes nasales, lèvres supérieure et inférieure avec arc de Cupidon, orbites oculaires et arcades sourcilières, pommettes, mâchoire définie, menton et oreilles avec hélice.
  - Coiffure et chevelure sculptée contemporaine en volume (teinte espresso `#2B1E18`) encadrant le visage.
  - Mains humaines avec éminence thénar (pouce), éminence hypothénar et 4 doigts distincts galbés en pose naturelle détendue.
  - Pieds humains avec talon calcanéen, voûte plantaire, métatarses et orteils avec cambrure naturelle au contact du sol.
  - Courbure sagittale en S $C^1$-continue (32 anneaux échantillonnés par interpolation cubique d'Hermite) avec lobes volumétriques mammaires bilatéraux (sillon intermammaire au sternum), cambrure fessière postérieure (sillon inter-fessier) et sillon vertébral dorsal.
  - Matériau de peau humaine naturelle (`#E5CBB7` / `#D9BBA2`, `roughness: 0.55`, `metalness: 0.0`) avec reflets spéculaires doux et articulations anatomiques continues sans sphères disjointes.
- **Rendu du porté et drapé gravitationnel des vêtements** (`garment-model.ts`, `Garment3DViewer.tsx`) :
  grille haute résolution (48 rangées, 28 colonnes, 36 segments de jambes, 32 segments de manches), drapé caténaire sous gravité dont l'amplitude croît naturellement vers l'ourlet (`hangFactor = Math.pow(hangProgress, 1.35)`), amortie à 0 aux coutures latérales pour une continuité hermétique à 100 %, pli tailleur structuré sur les pantalons avec cassure sur le coup-de-pied, matières nobles de la palette signature Angaly (Bleu Royal `#18375D`, Bleu Nuit `#0C2650`, Navy `#061938`), surpiqûres couture Champagne `#C5B190`, éclairage studio 3 points (lumière clé chaude `#FFF8EE`, débouchage doux `#94A8C7`, contre-jour champagne `#F0E6D2`).

## Corps humain réaliste (3D) — 2026-10-08

- **Maillage** : `apps/web/public/models/human-base.glb` (≈2 Mo), construit par `apps/web/scripts/build-human-base.py` à partir
  des *system assets* MakeHuman (maillage de base `hm08` + cibles macro), **explicitement publiés en CC0 en septembre 2020**
  (https://github.com/makehumancommunity/makehuman). Aucun code AGPL n'est copié. Morphs : genre, poids ±, muscle, enfant.
- **Ajustement aux mesures** : `utils/garment3d/human-body.ts` (pur, testé sur le vrai GLB) — morphs → recalage vertical sur les
  repères du modèle → sections du buste/taille/bassin mises à la circonférence mesurée (périmètre de l'enveloppe convexe) et
  tenues à l'intérieur de l'ellipse sur laquelle le vêtement est construit → épaules/bras (pose en A conservée, axe de manche
  `SLEEVE_TILT` = 36° et `SLEEVE_DROP`) → jambes (facteur de tour ±10 % en 3 hauteurs, jambes ramenées sous le bassin) → cou.
  Cheveux : coque `buildHairShell`. Repli automatique sur l'ancien mannequin procédural si le GLB ne se charge pas.
- **Outil Main** (bouton « Main ») : le glisser gauche déplace le rendu au lieu de le faire tourner (clic droit / Maj inchangés).
- Pantalon : les jambes enveloppent désormais le bassin depuis la taille (plus de bassin nu entre les jambes).
- Limites : pose figée (A), pas de visage/yeux texturés, enfant = morph MakeHuman « child » (≈10 ans).

- 2026-10-08 : jambes et cuisses lissées (contrôles de girth tous les 3 cm, lissés en hauteur, puis lissage Taubin des sommets de la cheville au-dessous de l'entrejambe) — fin de l'aspect « embossé ».
- 2026-10-09 : plein écran du panneau 3D (bouton « Plein écran », Échap pour sortir, tous les contrôles conservés) ; lissage Taubin élargi vers le bassin (raccord fesse–cuisse) et cisaillement linéaire de la jambe (plus de creux cuisse–genou) ; proportions corrigées d'après une planche de référence anatomique : nuque à 1,45 m (`NAPE_Y`) et entrejambe à 28 cm sous la taille (était 42 % de la stature, désormais ≈ 45 %) pour des jambes plus longues et un buste moins long. Un rendu « low-poly » a été essayé puis refusé par l'utilisateur (le corps reste réaliste).

### Refonte 2026-10-12 — morphologie fidèle au scan et drapé sur le corps réel

- **Corps (`human-body.ts`, réécrit)** : l'ancien ajustement écrasait le scan (facteurs largeur/profondeur séparés par tranche
  jusqu'à ×2,2, peau ramenée dans l'ellipse du vêtement, élargissement des épaules qui déformait les deltoïdes, jambes tirées
  vers le centre) → épaules en cintre, poitrine aplatie, genoux rentrés. Désormais chaque étape est une application lisse qui
  conserve l'anatomie : recalage vertical monotone cubique (pas de pli aux repères) ; **un facteur isotrope par hauteur** (entrejambe
  → aisselle, lissé) qui amène le périmètre de l'enveloppe convexe au tour mesuré ; largeur d'épaules par translation rigide des
  bras ; longueur et tours (bras/poignet) autour de l'axe propre du bras ; tours cuisse/genou/cheville autour du centre de chaque
  jambe (écartement du scan conservé) ; cou. Tours obtenus : poitrine/taille/bassin à ±5 % (testé). Cheveux courts pour les hommes.
- **Bug corrigé (`body-model.ts`)** : `LARGEUR_EPAULE` est **une** épaule (base du cou → pointe, 8–20 cm au catalogue) ; le 3D la
  lisait comme la carrure totale (26–56 cm) → épaules minuscules dès que la mesure était saisie. Largeur = 2 × (rayon du cou + épaule).
- **Drapé (`body-envelope.ts`, nouveau ; `garment-model.ts`, réécrit)** : le vêtement n'est plus une ellipse à hauteur fixe mais
  posé sur le corps : enveloppe convexe de chaque section (torse, chaque jambe, chaque bras le long de son axe, menton et crâne
  exclus), échantillonnée finement sur les triangles. Chaque rangée du patron garde **son** tour (devant + dos) et repose sur
  l'enveloppe + 4 mm, en tombant depuis ce qui la soutient au-dessus (poitrine, hanches, cuisses : `HANG` 30 cm). Les longueurs
  sont mesurées le long du corps (le devant plus long passe sur la poitrine), les coutures côté sont à l'abscisse curviligne du
  partage devant/dos, les épaules du corsage reposent sur l'arête d'épaule, les manches suivent l'axe réel du bras, le pantalon
  a une vraie couture d'entrejambe, et les godets (plis) apparaissent seulement là où le patron a plus d'ampleur que le corps.
  Le viewer ajuste le corps une fois puis drape dessus (`drapeGarment` + `envelopeFromMesh`, ≈ 0,25 s) ; avant le chargement du
  GLB, le même drapé est fait sur le mannequin procédural (`proceduralEnvelope`).
- Vérifié par rendus hors-ligne (face/profil/dos) : femme standard, forte, homme, enfant ; robe évasée manches longues, robe
  sirène sans manches, chemise manches courtes, pantalon. Limites : petites zones de peau possibles à la jonction emmanchure /
  tête de manche ; pas de simulation physique (pas de plis de compression aux coudes) ; pose A figée.

### 2026-10-12 (suite) — Calage sur références, articulations lisses, visage, cheveux, enfants

- **Calage sur références** (vues de face homme/femme superposées au rendu, silhouettes mesurées en fractions de la stature) :
  pose de référence `POSE` (mains à 0,18/0,32 H, genoux à 0,041/0,058 H, femme/homme ; enfants = valeurs femme), bras et
  jambes tournés autour de l'épaule/la hanche (jamais de genoux ni de pieds qui se croisent), `JOINT_INSET` 2,5 cm (épaules
  4 cm trop larges avant). Silhouette femme et homme ≈ références à ±0,01 H.
- **Articulations** : la jonction fesse–cuisse et les cuisses « bosselées » venaient du recalage vertical sur 7 repères dont 4
  estimés (taille, bassin, buste, nuque du scan) : recalage désormais par sol/entrejambe/sommet seulement. Hauteur d'entrejambe
  par morphologie (`crotchRatio` 0,453 femme/enfant, 0,47 homme) ou `HAUTEUR_FOURCHE`/`HAUTEUR_BASSIN` si mesurées ; nuque
  par morphologie (`napeRatio` 0,853 adulte, 0,825 enfant). Sous l'entrejambe le facteur de bassin devient un décalage de jambe
  + un tour autour de l'axe de la jambe ; transition de cuisse plus longue ; lissage Taubin hanches→chevilles ; **subdivision
  de Loop** (×4 triangles, `subdivide.ts`) dans le viewer.
- **Visage** (`head-features.ts`, `ui/headTextures.ts`) : repères trouvés sur le maillage (yeux = membranes profondes,
  pointe du nez, bouche par anthropométrie), **globes oculaires** (iris/pupille/sclère générés, cornée vernie, ombre de
  paupière), couleurs par sommet (lèvres, joues, sourcils, ligne de cils), peau physique + environnement studio généré
  (`RoomEnvironment`, aucun téléchargement).
- **Cheveux** : carré à raie au milieu (femmes, filles) ou coupe courte (hommes, garçons) générés au-dessus du crâne
  (champ radial du crâne lissé), ligne d'implantation explicite, mèches qui tombent et rentrent aux pointes, texture de
  mèches et pointes irrégulières (alpha), reflet anisotrope.
- **Enfants** : modèle `ENFANT_GARCON` ajouté (`ENFANT_10_ANS` = fille), dimorphisme réduit, tête +8 % (cou raccourci,
  stature conservée), pose enfant. Préréglage caméra interne `face` (gros plan, suit la stature).
- Vérification : captures WebGL réelles du composant `Garment3DViewer` (Chrome headless + Playwright, bundle esbuild hors
  dépôt), rendus de superposition hors ligne. Tests : `bodyEnvelope`, `subdivide`, `humanBody` (pose, visage, cheveux,
  enfant) — 110 tests du module.
- Limites : pas de cheveux par mèches individuelles ni de simulation ; visage peu expressif (le scan a les lèvres fines) ;
  le garçon de référence est plus jeune (≈ 5 ans) que le modèle 10 ans.


### 2026-10-12 (fin) — Relief du visage, cheveux sculptés, modèle costaud

- **Yeux** : l'ouverture palpébrale est lue sur la surface (triangles rastérisés au mm, `eyeOpening`) ;
  le globe se place juste derrière les paupières du scan (il dépassait sous la paupière inférieure).
- **Visage** : `sculptFace` (lèvres plus pleines, fente palpébrale un peu plus ouverte) ; barbe de trois
  jours pour les hommes adultes (`faceColors(..., beard)`).
- **Relief** : éclairage studio (clé latérale haute, appoint froid faible) et ombrage des creux cuit dans
  les couleurs de sommets (`surface-shading.ts` : `cavityOcclusion`, deux échelles).
- **Cheveux** (`buildHair`, styles `long` | `short`) : couche de cuir chevelu dont le bord est coupé par
  l'alpha des sommets (alpha test ½ → ligne d'implantation lisse, arrondie pour femmes/enfants, plus
  carrée et légèrement dégarnie aux tempes pour les hommes) ; cheveux longs = mèches sculptées depuis une
  raie au milieu, en rideau sur les coins du front, ondulées, qui reposent sur les épaules (coque radiale
  du corps) ; coupe courte = masse rainurée avec volume sur le dessus. Échelle = taille de la tête (une
  tête d'enfant est presque adulte).
- **Gabarit `HOMME_COSTAUD`** (muscle 1) et `muscle-definition.ts` : pectoraux, ligne blanche, trois
  intersections tendineuses, bords latéraux des abdominaux, V iliaque — appliqués après subdivision aux
  carrures athlétique/costaud.
- Tests : `surfaceShading.test.ts`, `muscleDefinition.test.ts`, `humanBody.test.ts` (ouverture des yeux,
  sculpture, barbe, cheveux `long`/`short` avec alpha, morph costaud).


### 2026-10-12 (référence) — Robe longue à pois : photo → patron → ajustement 3D

- **Analyse de la photo** (fiche `apps/ai-service/ml/data/references/robe-pois-maxi.json`) : robe `ROBE` / `EVASEE`, encolure
  `ROND`, manches `COURTES`, `MAXI` ; `fit` : `CONFORT`, ampleur jupe 1,25 et manche 1,25, longueur jupe 94 %, manche 40 %.
  Cibles mesurées sur la photo : ourlet ≈ 15 cm au-dessus du sol, ourlet ≈ 2,6 × la taille vue de face, manche 3–5 cm
  sous l'aisselle. Obtenu (FEMME_STANDARD) : ourlet 16,3 cm, rapport 2,62, aisance poitrine 3,4 / taille 2,4 cm, aucune
  peau à travers le tissu, couverture des épaules et des manches ≥ 98,9 % (lancer de rayons depuis la peau).
- **Moteur** : encolures tracées en courbe (quart d'ellipse, `curveNeckline`, 8 segments) au lieu d'un segment droit ;
  milieu dos d'encolure à 2 cm ; `ROND` = 75 × 75 mm (ras du cou à la base du cou ; était 85 × 40, trop large et plat).
- **3D** (`garment-model.ts`, `body-envelope.ts`) :
  - manche : la couture de dessous de bras part de l'aisselle ; la tête de manche suit l'emmanchure (haute sur le
    deltoïde, basse sous le bras) et entoure tout le deltoïde (`LimbFrame.cap`) — fini la manche au coude pour « courtes »
    et le trou devant l'épaule ;
  - couture d'épaule : chaque point de la couture (devant et dos, point d'encolure compris) se pose sur la crête de
    l'épaule, le tissu voisin suit (interpolé le long de la couture) ; le corsage est repoussé hors du corps vers l'avant
    / l'arrière seulement (plus de glissement de l'encolure vers les épaules) et reste au-dessus de la peau sur la pente
    du trapèze (`BodyEnvelope.top`, carte de hauteur) ;
  - le devant et le dos de l'épaule et les plis d'aisselle (peau pondérée « bras ») comptent dans le torse : le corsage
    les couvre ;
  - **blocs de jupe** (moteur S4) enfin visibles en 3D : jupe froncée / plissée (front + dos, fronces resserrées à la
    taille puis ouvertes en plis) et jupe cercle (circonférence exacte à chaque profondeur). Avant : pièces ignorées.
- Tests : `referenceDressFit.test.ts` (patron figé `__tests__/fixtures/robe-pois-maxi.pieces.json`, regénéré depuis les
  paramètres de la fiche), `garment3d.test.ts` (blocs de jupe), `robe.rule.test.ts` (encolure courbe, dos, robe de
  référence), `tests/test_reference_profiles.py` (étiquette valide). Aides de test : `helpers/humanBase.ts`,
  `helpers/rayCast.ts`.
- Limites : fronces sous la poitrine non tracées (pas d'empiècement dans le moteur) ; motif à pois non rendu (couleurs par
  zone) ; petite pointe au point d'encolure-épaule ; la robe froncée tombe en colonne (pas de simulation).


### 2026-10-12 (référence, suite) — Fronces sous poitrine, motif du tissu, point d'encolure, projet réel

- **Fronces sous la poitrine** : nouveau groupe de détails `corsage` (`LISSE` | `FRONCES_SOUS_POITRINE`) dans
  `@angaly/types`, le wizard (`details.const.ts`, rendu générique) et l'ai-service. Moteur (`robe.rule.ts`,
  `splitUnderbust`) : le devant est coupé sous la poitrine ; la pièce `Empiècement Devant` va de la couture à la taille
  (60–110 mm) ; le bas du devant fait 1,3 × la couture (creux de 4 cm max au-dessus de la poitrine + élargissement au
  côté), milieu devant toujours au pli. 3D (`stackMidriff`) : l'empiècement s'empile sous le devant, la largeur en trop
  au-dessus de la couture devient des fronces (plis ~2,5 cm), la couture est tracée.
- **Motif du tissu** : `fit.fabricPrint` (`UNI`/`POIS`/`RAYURES`/`CARREAUX`/`FLEURI`/`AUTRE`), `fit.fabricColor`,
  `fit.motifColor` (`#rrggbb`) — lus par l'analyse photo (prompt + `normalize_fit`), informatifs (jamais de géométrie).
  Le visualiseur reçoit `fabric` (page → `Garment3DPanel` → `Garment3DViewer`) et habille les panneaux d'une texture
  (`ui/fabricTextures.ts`, motif répété tous les 5 cm) posée sur des coordonnées de tissu à plat (`PanelMeshData.uvs`).
  Sans motif ni couleur : couleurs techniques par zone, comme avant. Ligne « Motif » dans le récapitulatif du wizard.
- **Point d'encolure** : près du cou, la couture d'épaule suit la pente propre de l'épaule (mesurée 3,5–6 cm plus loin) au
  lieu de la crête qui remonte le cou ; la carte de hauteur des épaules ne s'applique plus près du cou.
- **Décolleté `SAGE`** (« ras du cou ») = 75 × 75 mm, comme `ROND` (il plaçait le milieu devant au niveau de l'épaule).
- **Projet `dab617b9-…`** (ex-pantalon) : photo téléversée sur MinIO, analyse de référence, paramètres et version 2
  générée par les cas d'usage de l'API (script hors dépôt `apply-reference.cjs` dans le scratchpad) ; la version 1
  (pantalon) reste dans l'historique.


### 2026-10-12 (référence, fin) — Taille basse, jupe plissée, mannequin articulé

- **Lecture corrigée de la photo** : corsage froncé sous la poitrine + **long empiècement ajusté jusqu'aux hanches** (taille
  basse) + **jupe à plis creux** cousus à plat puis libres ; manches courtes bouffantes. Fiche de référence mise à jour
  (`taille: BASSE`, `PLEATED_SKIRT` 20 plis creux de 55 mm, ampleur de manche 1,5, pose `MIROIR`).
- **Moteur** : groupe de détails `taille` (`NATURELLE` | `BASSE`). `BASSE` : corsages prolongés de 110 mm sous la taille en
  s'élargissant vers la hanche, jupe (ou bloc de jupe) raccourcie d'autant, tour de couture = bas de la basque.
  `skirtOutline(…, hipDepthMm)`.
- **3D** : le corsage s'ancre à sa ligne de taille (rang le plus étroit, `waistRowOf`) et descend sur les hanches ; la
  jupe part de la couture basse (`ZoneGroup.topY`) ; une jupe froncée/plissée est cousue sur la longueur du bas du
  corsage (`seamLength`) ; les plis s'ouvrent progressivement jusqu'à l'ourlet (ligne A) et le nombre de plis vient des
  repères du patron.
- **Mannequin articulé** (`utils/garment3d/pose.ts`) : épaule (écarter, lever devant, rotation), coude, hanche (écarter,
  lever devant), genou, par membre ; bornes anatomiques ; préréglages « Debout » et « Selfie au miroir (comme la photo) ».
  Le corps posé est habillé : enveloppe de bras propre à chaque côté (`BodyEnvelope.armRight`), axe du bras pris sur le
  bras supérieur (coude plié), avant-bras exclu de l'épaule et du torse, tête de manche moins haute bras levé. Panneau 3D :
  menu « Pose » et bouton « Articulations » (curseurs par articulation, « Remettre debout ») — écran Stitch « Validation
  de Patron (Studio) » consulté : il ne prévoit pas de commandes 3D, style repris de la barre existante.
- Projet `dab617b9-…` : version 3 générée avec ces paramètres.
- Tests : `pose.test.ts`, `referenceDressFit.test.ts` (drapé sur la pose de la photo), `garment3d.test.ts` (basque),
  `Garment3DPanel.test.tsx` (pose), `robe.rule.test.ts` (taille basse, robe de référence).
- Limites : le léger croisé du devant froncé n'est pas tracé ; la main gauche ne tient pas la jupe (pas de contact) ; pas
  de simulation de tissu (la jupe ne suit pas une jambe pliée au-delà de l'enveloppe).


### 2026-10-21 — Patron superposé au modèle d'inspiration, pièce en surbrillance, 3D calée sur la photo

> Pas de maquette Stitch (l'écran « Validation de Patron (Studio) », vérifié via MCP Stitch le 2026-10-21, n'a pas de
> panneau modèle) : boutons segmentés et palette de l'écran (`#041329` / `#0C2650` / `#C5B190`, surbrillance `#FFC45C`).

- **Panneau « Modèle d'inspiration »** (Comparer → Modèle) : le vêtement drapé vu de face (`utils/garment3d/photo-frame.ts`,
  `projectGarment`) est posé dans le cadre du vêtement sur la photo. Cadre lu automatiquement (pixels de la couleur
  `fit.fabricColor`, sinon ce qui diffère du fond, plus grande tache), ou **Caler** : glisser le cadre / ses coins ;
  gardé par projet et par photo dans ce navigateur (`localStorage`), bouton baguette = recaler automatiquement.
  - **Pièces** : toutes les pièces en couleurs (curseur d'opacité) ; **en rouge** les parties du modèle qu'aucune pièce ne
    couvre, avec le taux de couverture (« Modèle couvert par le patron : 81 % ») — ce qui manque au patron.
  - La **pièce sélectionnée** (liste, 2D, 3D) s'allume sur la photo ; une pièce de dos est hachurée (« au dos ») ; une
    pièce intérieure (ceinture intérieure, coulisses) est signalée sans zone. **Clic sur la photo** = choisir la pièce.
- **3D + Superposer** : la vue passe de face et la photo est **calée sur la 3D** (même hauteur, centrée, découpée au
  canevas) d'après le cadre ci-dessus et le cadre du vêtement projeté par la caméra (`FrameReporter` du viewer,
  `alignPhoto` de `ComparisonLayout`) ; elle suit rotation et zoom.
- Le drapé (~100 ms) est partagé entre la 3D et la photo et gardé pour les 4 dernières entrées
  (`utils/garment3d/model-cache.ts`) : revenir sur l'onglet 3D ne redrape plus.
- Tests : `photoFrame`, `InspirationPanel`, `useInspirationOverlay` (+ cache), `PreviewModeTabs`.

### 2026-10-13 — Modèle d'inspiration, comparaison 3D et atelier de retouche

> Pas de maquette Stitch pour ces commandes (l'écran « Validation de Patron (Studio) » ne les prévoit pas) : le style
> reprend la barre d'onglets existante (palette `#041329` / `#0C2650` / `#C5B190`). À valider visuellement avec `agy`.

- **Comparer** (à droite des onglets) : vignette du **modèle d'inspiration** (`project.inspirationMediaUrl`) + sélecteur
  « Comparer : Aucun | Modèle | 3D ». Le modèle ou la 3D s'affiche à côté de la vue courante (2 colonnes ≥ `lg`, empilé en
  dessous). 3D + Modèle : case **Superposer** + curseur d'opacité (la photo recouvre la 3D). Comparer la 3D avec elle-même
  est désactivé ; sans photo, « Modèle » est grisé. Panneau modèle : zoom (molette / boutons) et déplacement au glisser.
- **Onglet « Atelier de retouche »** (`ui/studio/`) — planche de dessin SVG en millimètres :
  - Outils : Sélection (V : point ou pièce entière), Main (H / Espace / molette = zoom, pincement tactile), Ajouter un point
    (A), Supprimer un point (X), Dessiner une pièce (P : clics, Entrée / clic sur le 1er point = fermer, Échap, Retour
    arrière), Mètre ruban (M), Cran (N), Droit-fil (G : tracer la flèche). Maj = angles de 45° (15° pour le droit-fil),
    Alt = sans aimantation, flèches = 1 mm (Maj : 10 mm), Suppr = supprime le point, Ctrl+Z / Ctrl+Maj+Z / Ctrl+Y,
    Ctrl+S = enregistrer, F = ajuster à l'écran.
  - Aimantation (libre / 1 mm / 5 mm / 1 cm) sur la grille **et** sur les points existants ; grille adaptative ; longueurs
    des bords ; échelle ; coordonnées du curseur.
  - Inspecteur : nom, quantité, marge de couture, largeur / hauteur exactes, X / Y du point sélectionné, longueur de chaque
    bord (modifiable, le point d'arrivée glisse le long du bord), miroir, pivoter 90°, ±5 %, lisser (courbe), simplifier,
    dupliquer, supprimer ; alerte si le contour se croise.
  - Onglet **Mesures du corps** : mesures du catalogue `@angaly/types` (`measurementFieldsFor`) → « Régénérer » relance le
    moteur déterministe (`POST /api/pattern-projects/:id/generate` avec `measurements`) ; confirmation si des retouches
    manuelles ne sont pas enregistrées.
  - **Enregistrer une version** → `POST /api/pattern-versions/:id/edits` (nouvelle version, l'ancienne reste restaurable).
- **Brouillon partagé** (`usePatternDraft`, historique 100 pas, une action = un pas) : les retouches sont visibles tout de
  suite dans 2D / Ensemble / 3D avant d'être enregistrées (3D en `useDeferredValue`).
- **Fluidité** : pendant un glissement, la pièce vit dans un état local du canevas, mis à jour au plus une fois par image
  (`requestAnimationFrame`), et **un seul pas d'annulation** est validé au relâchement ; le curseur est lissé de même ;
  champs numériques validés au blur / Entrée ; aucune dépendance ajoutée (événements pointeur natifs).
- Fichiers : `utils/pattern-editing.ts`, `utils/studio-viewport.ts`, `hooks/{usePatternDraft,useSavePatternEdits,
  useRegeneratePattern}.ts`, `ui/{InspirationPanel,ComparisonLayout,PreviewModeTabs}.tsx`, `ui/studio/*`.
- Tests : `patternEditing`, `studioViewport`, `usePatternDraft`, `useSavePatternEdits`, `StudioCanvas`,
  `PatternStudioEditor`, `PreviewModeTabs` (+ layout / panneau modèle), `PatternPreviewValidationPage` (comparaison) ;
  API : `save-pattern-edits.use-case.spec.ts`.
- Limites : contours en polygones (une courbe = plusieurs points, « Lisser » aide) ; pas d'e2e Playwright (la page est
  derrière l'authentification serveur) ; une pièce dessinée à la main n'a pas de repère de pli.

### 2026-10-14 — Tête de la femme : visage stylisé et chignon (référence buste argile)

- Référence fournie par l'atelier : buste en argile, face + profil (visage stylisé, chignon haut, mèches qui encadrent
  le visage). Calage par superposition face/profil (yeux, nez, bouche, menton, ligne du front, chignon) sur des rendus
  argile hors ligne de la géométrie réelle.
- **Visage** (`stylizeFace`, `head-features.ts`, modèles `FEMME_*` uniquement, après `sculptFace`) : bas du visage
  raccourci (en écarts inter-pupillaires : yeux → bouche ≈ 0,79, yeux → menton ≈ 1,21 au lieu de ≈ 1,03 / 1,78),
  mâchoire en V et petit menton avancé, nez et bouche affinés, yeux en amande plus larges au coin externe relevé.
  Crâne, oreilles et cou ne bougent pas (le cou mesuré porte toujours les cols).
- **Coiffure `bun`** (femmes ; les filles gardent `long`) : cheveux tirés en arrière = calotte rainurée vers le chignon,
  oreilles dégagées, chignon haut à l'arrière (spires autour d'un noyau, quelques boucles lâches), trois fines mèches de
  chaque côté depuis la raie, par-dessus les tempes, tombant devant les oreilles jusqu'à la mâchoire. Les cheveux sont
  construits sur la tête sculptée (`sculpted.positions`).
- Tests : `humanBody.test.ts` (stylisation : proportions, mâchoire −15 %, crâne/cou immobiles ; chignon : mèches jusqu'à
  la mâchoire, chignon au-dessus de la tête, rien devant les yeux/nez/bouche).
- Limites : cou plus épais et oreilles un peu plus décollées que la référence (volontaire : mesures réelles) ; pas de
  boucle d'oreille ; le visage stylisé n'est pas appliqué aux hommes ni aux enfants.

### 2026-10-14 — Modeler le patron directement sur le mannequin 3D

- **Usage** : onglet « 3D sur mannequin » → « Modeler en 3D ». Le clic gauche **sur le vêtement** modèle (anneau du
  pinceau sous le curseur) ; ailleurs il fait toujours tourner la vue. Outils : **Modeler** (G, tirer le contour près
  d'une couture / d'un ourlet), **Ampleur** (W, élargir / resserrer le côté saisi sur une bande de hauteurs ; tirer le
  tissu hors du corps élargit aussi), **Longueur** (L, tout ce qui est au-delà du point suit), **Lisser** (S). Rayon
  1–40 cm (`[` `]`), atténuation (douce, linéaire, pointue, uniforme), « Pièces voisines » (la couture de côté du dos
  suit celle du devant, les ourlets ensemble). Ctrl+Z / Ctrl+Y, abandonner, « Enregistrer une version ».
- **2D automatique** : les gestes écrivent dans le même brouillon que l'Atelier de retouche (`usePatternDraft`) : la
  pièce 2D, l'ensemble et le Studio montrent la retouche immédiatement ; un geste = une annulation. La pièce saisie est
  sélectionnée. Un geste qui ferait se croiser un contour est refusé (la pièce garde sa dernière forme valide).
- **Principe** : chaque sommet drapé connaît le point du contour de sa pièce (`PanelMeshData.edit`, `garment-model.ts`).
  Le déplacement 3D (plan face à la caméra) est ramené à plat par le pseudo-inverse du jacobien du drapé sur le
  triangle saisi (`utils/garment3d/sculpt.ts`), puis appliqué au **contour** de la pièce (densifié sous le pinceau),
  et la pièce est drapée de nouveau. Le moteur `packages/pattern-engine` n'est pas modifié : il s'agit de retouches
  manuelles, comme dans le Studio 2D.
- **Pièces modelables** : devants / dos (moitiés au pli), empiècement empilé, manches, jambes de pantalon, jupes froncées
  ou plissées (blocs), enveloppe générique. Non modelables en 3D : jupe en cercle, cols, plastron, cordelière (Studio 2D).
- **Performance** : par retouche ~775 ms → ~75–135 ms de drapé (anneaux de manche résolus une fois par rangée, manches
  en cache par pièce, drapé procédural seulement à la demande, corps humain et enveloppe conservés tant que les mesures
  ne changent pas) ; au plus une mise à jour par image pendant le geste, la 3D reste différée (`useDeferredValue`).
- **Fichiers** : `utils/garment3d/sculpt.ts`, `hooks/usePatternSculpt.ts`, `hooks/useSaveDraft.ts` (aussi utilisé par
  le Studio), `ui/SculptBrush.tsx`, `ui/SculptToolbar.tsx`, `Garment3DPanel` (prop `editing`), `Garment3DViewer` (prop `sculpt`).
- **Maquette** : aucun écran Stitch pour l'édition 3D (écran `ade57b6cba4241ae9464fd96b7e46d89` vérifié) — barre dans le
  style des contrôles 3D existants, sélecteur segmenté repris de « Vue technique / Vue simplifiée ».
- Tests : `sculpt.test.ts`, `usePatternSculpt.test.ts`, `useSaveDraft.test.ts`, `SculptToolbar.test.tsx`,
  `Garment3DPanel.test.tsx` (modelage). Vérifié dans Chrome (projet `6726c934-…`, compte admin) : allongement de la jupe
  par « Longueur », anneau visible sur tissu clair.
- Limites : le pinceau n'agit que sur le contour (le drapé est construit à partir des largeurs des rangées) — saisir le
  milieu d'un panneau avec « Modeler » ne fait rien si aucun bord n'est dans le rayon (utiliser Ampleur / Longueur) ;
  les sommets ajoutés par les gestes s'accumulent (outil « Simplifier » du Studio).

### 2026-10-14 — Mode Édition 3D (points du patron un à un, façon Blender)

- **Modes** (barre sous la 3D, comme Blender) : **Objet** (regarder), **Sculpture** (pinceau, section précédente),
  **Édition** (Tab). En Édition, chaque sommet du contour de chaque pièce est affiché sur le vêtement drapé (pastille
  blanche, orange si sélectionné ; une pièce au pli ou une manche montre ses points sur les deux côtés).
- **Sélection** : clic, Maj + clic (ajouter / retirer), glisser = rectangle, A (tout / rien), Alt+A (rien), Ctrl+L ou
  « Pièce entière », Rayons X (Alt+Z) pour atteindre les points cachés. Navigation : Alt + glisser ou clic molette
  (tourner), clic droit (déplacer), molette (zoom).
- **Transformations modales** : G (déplacer, dans le plan face à la caméra), S (échelle autour de la médiane, X / Y sur
  le patron), R (rotation vue à l'écran) ; pendant la transformation : X / Y / Z (axe, de nouveau = libre), chiffres
  (valeur exacte : cm, facteur, degrés ; `-` change le signe), clic ou Entrée (valider), Échap ou clic droit (annuler,
  sans pas d'annulation). **Édition proportionnelle** (O) : les points voisins de la même pièce suivent, rayon à la
  molette pendant la transformation, atténuation au choix.
- **Topologie** : X / Suppr (supprimer, ≥ 3 points par pièce), « Subdiviser » (milieu des arêtes dont les deux bouts
  sont sélectionnés), Ctrl + clic sur une couture (insérer un point). Panneau « Transformation » : médiane X / Y (mm,
  coordonnées du patron) éditable.
- **2D** : chaque opération écrit dans le brouillon partagé (une annulation par opération) — Studio, pièce 2D et
  ensemble suivent ; « Enregistrer une version » comme en Sculpture.
- **Principe** : `utils/garment3d/mesh-edit.ts` place chaque point du contour sur le maillage drapé (barycentrique dans
  les triangles de la pièce, grille spatiale ; ~27 ms pour une robe) et lit un déplacement 3D sur le patron par le
  jacobien local du drapé (`sculpt.ts`). Seuls les points du **patron** sont éditables : l'intérieur d'un panneau drapé
  est calculé à partir des largeurs du patron et n'a pas de point à plat (même limite qu'un logiciel de CAO couture).
- **Fichiers** : `utils/garment3d/mesh-edit.ts`, `hooks/useMeshEdit.ts`, `ui/MeshEditLayer.tsx` (points, clic,
  rectangle, transformations à la souris), `ui/MeshEditToolbar.tsx`, `SculptToolbar` (sélecteur de mode),
  `usePatternDraft` (action `cancel`). Tests : `meshEdit.test.ts`, `useMeshEdit.test.ts`, `Garment3DPanel.test.tsx`,
  `SculptToolbar.test.tsx`. Vérifié dans Chrome (projet `6726c934-…`) : rectangle → G → Y → clic, ourlet remonté.

## 2026-10-14 — Rendu réaliste (tissu « photo »)

Quand le profil porte `fit.fabricFinish` (VELOURS / SATIN), la vue 3D passe en rendu photo : fond studio gris dégradé,
lumière rasante, pose « Présentation » par défaut, coutures masquées (réaffichées en modelage, en édition et sur la pièce
sélectionnée). Velours = `meshPhysicalMaterial` avec reflet (sheen) de la teinte du tissu ; occlusion ambiante par sommet
dans les creux des godets et des plis du ballon. Motifs procéduraux : `BROCART` (rinceaux, fleurs rouille), `ARABESQUE`
(volutes) ; `contrastPrint` habille le plastron, `accentPrint` le ballon des manches et les bordures du plastron.
Pièces cousues côte à côte (jupe en lés, manche en deux pièces) drapées en un seul panneau, coutures dessinées, chaque point
reste éditable sur sa pièce. Col officier construit sur la section réelle du cou ; chignon couvrant tempes et oreilles.

### 2026-10-15 — Retour, manche au poignet, col sur l'encolure

- **Flèche de retour** (en-tête « Projet ANG-PAT-… ») : mène à `/mes-projets-patron` (`ROUTES.mesProjetsPatron`), plus au
  studio. Écran Stitch vérifié (l'en-tête n'y a pas de flèche : changement de destination seulement). Test
  `ProjectStatusHeader.test.tsx`.
- **Manche qui ne suivait pas la main** (pose « Debout, bras le long du corps », et aussi « Présentation ») : l'avant-bras
  quitte l'axe du haut du bras (coude fléchi même au repos, 9 cm vers l'avant au poignet) ; la manche était drapée
  autour de cet axe droit et mesurée le long de lui. `LimbFrame.centre` (ligne centrale de l'avant-bras, prolongée
  au-delà du poignet) et `LimbFrame.atLength` (longueurs le long de cette ligne) ; la manche s'empile avant le poignet
  de la hauteur du poignet de robe (`endBefore`). Le poignet de robe est centré sur le poignet réel (< 3 cm).
- **Peau à l'épaule près de la nuque** : le pied du col officier ne rejoignait l'encolure du corsage qu'au dos ; il la
  rejoint tout autour (plastron compris). Peau visible sous 9 cm de la nuque : 55 → 2 points sur 381.
- **Ceinture** : le rayon de la ceinture ignorait les manches mais pas les poignets ; mains à la taille (bras écartés),
  elle s'étirait en barre jusqu'aux poignets.

### 2026-10-15 (suite) — Corsages « matelassés »

Les corsages ajustés montraient des « abdominaux » (sillon central, bandes sous la poitrine et sur le ventre). Ce n'était
pas la géométrie mais l'ombrage des plis (`ao` de `drapeHalfPanel`) : normalisé par rang, il était le plus sombre là
où les plis s'annulent (centre devant, coutures de côté) et basculait des rangs entiers à 4 mm de pli ; et le corsage
recevait des godets de jupe dès 6 % d'excès. Désormais l'ombre suit la profondeur réelle du creux sous les crêtes
voisines (`FOLD_AO_DEPTH` 3 cm), et un corsage n'a pas de godets (seulement ses fronces). Test `garment3dShading`.

### 2026-10-15 (fin) — Mains, poignets, motifs

- **Main posée sur la jupe** (pose Présentation) : `restHandOnSkirt` remplace `gripSkirt` — le tissu qui passerait
  par-dessus la main est repoussé sous la paume ; la jupe n'est plus tirée vers la main (« robe attirée par la main »).
- **Poignet de robe** : l'empilement d'une manche plus longue que le bras est plafonné (`STACK_MAX` 8 mm) et la
  direction du poignet prise sur ~12 rangs (`CUFF_DIR_ROWS`) : le poignet s'arrête au poignet, le pouce ne le traverse
  plus (pose Debout, bras le long du corps).
- **Taille du motif** : `GarmentFit.motifSizeCm` (lu sur la photo, 0,5–60 cm) règle la répétition de l'imprimé
  (`printTileM`) ; ex. grands lys brodés 14 cm (met-009), pois 2,5 cm (robe-portee-026).


### 2026-10-16 — « Rendu réaliste » (simulation Blender, phase 3 de `docs/features/realistic-render-blender.md`)

- **Maquette** : l'écran Stitch « Validation de Patron (Studio) » (`ade57b6cba4241ae9464fd96b7e46d89`, vérifié par MCP
  Stitch le 2026-10-16) n'a ni visualiseur 3D ni bouton de rendu réaliste : mêmes boutons que le reste du panneau 3D
  (fond `#0C2650`, bord or, état actif or plein).
- **Sous les commandes du panneau 3D** (`RealisticRenderSection`, affichée quand une version existe :
  `editing.versionId`) : bouton « Rendu réaliste » (désactivé pendant la simulation), état (« En file d'attente »,
  « Simulation du tissu en cours » avec pastille, « Rendu réaliste prêt (déjà calculé) », « Le rendu a échoué : … »),
  erreur du quota (429) ; une fois prêt, « Voir le rendu réaliste » / « Revenir à l'aperçu » et « Relancer ».
- **Données** : `useRealisticRender(versionId, pose)` (react-query) — dernier rendu de la pose au chargement, `POST`
  puis `GET …/:renderId` toutes les 5 s tant que `QUEUED`/`RUNNING` (`api/realistic-render.api.ts`). La pose suit le
  préréglage du panneau (`Personnalisée` → simulée en Présentation, c'est dit sous le bouton).
- **Visualiseur** (`RealisticRenderViewer`, Canvas à part : `Garment3DViewer` n'est pas modifié) : `.glb` Draco
  (`GLTFLoader` + `DRACOLoader`, décodeur servi depuis `public/draco/`, copié de three 0.170), tissus de l'aperçu par
  rôle de matériau (`clothRoleForMaterial` : robe, plastron, `:accent` = ballon de manche ; sans tissu lu, matériau du
  `.glb`), mannequin ajusté au même corps et posé avec `simPose` (`simulatedPose`, repli sur le préréglage). Limite :
  mannequin sans visage ni chignon (peau unie), éclairage simple.
- Tests : `realisticRender.test.ts`, `useRealisticRender.test.ts`, `RealisticRenderSection.test.tsx` ; e2e
  `e2e/pattern-studio/rendu-realiste.spec.ts` (voir `docs/testing.md`).

### 2026-11-05 — Rendu « studio » de l'aperçu 3D (lot 1 de `docs/plans/studio-3d-rendering.md`)

Méthode de rendu portée de `~/Documents/Projects/teardown` (scène V8) dans `Garment3DViewer` :

- `utils/studio3d/` (pur, testé) : `studio-config.ts` (niveaux de qualité `high/medium/low`, `pickInitialTier`,
  `nextTierOnSlowFrames` + `pushFrameTime`, préréglages d'éclairage `studio` / `soft` / `contrast`, réglages GTAO),
  `studio-scene.ts` (pièce à softboxes pour PMREM, sol « ombre seule » avec `polygonOffset`, ombre VSM de la clé
  dont le flou suit la taille de la carte, objets exclus de l'AO), `studio-composer.ts` (RenderPass → masquage →
  GTAO → réaffichage → OutputPass, cible HalfFloat + MSAA selon le niveau), `shader-warmup.ts` (portage de
  `warm.js`), `normal-guard.ts` (normale NaN d'une carte de relief → normale de la surface).
- `ui/studio3d/` : `StudioEnvironment`, `StudioLights`, `ShadowFloor`, `StudioPost` (rendu en `useFrame` priorité 1,
  gizmo en priorité 2, rien n'est dessiné avant la compilation des shaders : surimpression « Préparation du rendu… »
  au style des contrôles en surimpression de la maquette). Hooks : `useStudioQuality`, `useShaderWarmup`.
- Renderer : `NeutralToneMapping` (passé dans les props `gl`, sinon R3F remet ACES), ombres VSM, canevas opaque sans
  antialiasing (le MSAA vient du composer). Le disque noir sous les pieds est remplacé par l'ombre portée.
- Ombres : corps, tête, cheveux, panneaux, perles projettent ; la dentelle ne projette ni ne reçoit (ses jours se
  projettent sur elle-même) ; la broderie reçoit seulement. AO coupée en mode « Transparence ».
- Pièges rencontrés : la carte de relief de la broderie donne des normales NaN par endroits → pixels noirs après le
  post-traitement (corrigé par `normal-guard`) ; le préchauffage de l'OutputPass laissait une cible hors écran liée →
  gizmo invisible à partir du 2e projet ouvert (cible du canevas remise).
- Revue visuelle : 6 projets du catalogue face / côté / dos, avant / après (captures Playwright, script dans le
  scratchpad de la session, non versionné — le lot 5 en fera un outil du dépôt). Volumes plus lisibles, ombres des bras
  et du col, couleurs inchangées ; dos éclairé par une contre-lumière renforcée.
- Écart Stitch : la maquette n'a pas de viewer 3D ; les barres du panneau 3D gardent leur `rounded-lg` (hors périmètre
  du plan, à reprendre avec la maquette).
- Tests : `utils/studio3d/__tests__/*` (config, scène, composer, warm-up, normal-guard), `useStudioQuality.test.ts`,
  `useShaderWarmup.test.ts`, `studio3dComponents.test.tsx`.

### 2026-11-05 — Rendu réaliste sur le même studio (lot 2 de `docs/plans/studio-3d-rendering.md`)

- `RealisticRenderViewer` reprend tel quel le studio du lot 1 : `StudioEnvironment`, `StudioLights` (préréglage
  `studio`), `ShadowFloor` (avec mannequin), `StudioPost`, niveaux de qualité (`useStudioQuality`), renderer
  `configureStudioRenderer` + `NeutralToneMapping`, canevas sans antialiasing. Les 3 lumières codées en dur et le fond
  navy fixe ont disparu : fond papier gris (`ui/studio3d/StudioBackdrop.tsx`, sorti de `Garment3DViewer`) quand le
  tissu a une surface connue, navy sinon — comme l'aperçu.
- Ombres du `.glb` : `applyStudioShadows` (`utils/studio3d/studio-scene.ts`) — chaque maillage reçoit, et projette
  sauf une couche transparente (fil de broderie). Le mannequin projette et reçoit.
- AO plus forte sur les vrais plis simulés : `SIMULATED_CLOTH_AO_BLEND = 0.9` (option `aoBlend` de `StudioPost` /
  `createStudioComposer`, 0,75 par défaut pour l'aperçu).
- Smocks et broderie passent par `withNormalGuard` (normales NaN → pixels noirs).
- Attente : « Chargement du rendu réaliste… » pendant le chargement du `.glb`, puis « Préparation du rendu… »
  pendant la compilation des shaders (préchauffage relancé quand le `.glb` ou le corps scanné arrive).
- Tests : `__tests__/RealisticRenderViewer.test.tsx` (studio monté, ombres des maillages, fond papier, erreur de
  chargement), `studio-scene.test.ts` (`applyStudioShadows`), `studio-composer.test.ts` (`aoBlend`).
- **Non vérifié à l'écran** dans cette session : l'API 3003 était arrêtée et son redémarrage refusé en mode auto ;
  e2e `rendu-realiste.spec.ts` et captures avant/après à faire.

### 2026-11-05 — Réglages du rendu dans le viewer (lot 3 de `docs/plans/studio-3d-rendering.md`)

- Bouton icône « Réglages du rendu » (`SlidersHorizontal`) en surimpression **en haut à droite** du canevas de l'aperçu
  (`ui/StudioControls.tsx`, présentationnel) : Éclairage Studio / Doux / Contraste (onglets segmentés), Ombres et
  Occlusion (interrupteurs `role="switch"`), Qualité Auto / Haute / Moyenne / Basse avec le niveau réel en `font-mono`
  quand Auto. Échap ou un clic ailleurs ferme ; le focus revient au bouton ; les touches du panneau ne déclenchent pas
  les raccourcis de la scène. Une note dit que l'occlusion n'est calculée qu'en qualité haute.
- État : `hooks/useStudioSettings.ts` (défauts `studio / ombres / occlusion / auto`), mémorisé en `localStorage`
  (`angaly.studio3d.settings`, try/catch, confort par navigateur ; lecture validée par `parseStudioSettings`,
  `utils/studio3d/studio-settings.ts`). En Auto, le niveau descend sur images lentes (`useStudioQuality`) ; un niveau
  choisi reste fixe. Appelé une fois dans `Garment3DPanel` : l'aperçu et le rendu réaliste (`RealisticRenderSection` →
  `RealisticRenderViewer`) reçoivent la même prop `studio` (lumière, ombres, AO, niveau, `reportFrame`). Sans prop,
  chaque viewer garde son niveau automatique et la lumière `studio`.
- Ombres coupées : la lumière clé reste, sans ombre (`StudioLights shadows={false}`), et le sol « ombre seule » est retiré.
- Style Stitch (écran `ade57b6cba4241ae9464fd96b7e46d89`, revu via `agy` le 2026-11-05) : boîtier
  `bg-[#041329]/80 backdrop-blur-md border-[#18375D] rounded-sm`, segment actif `bg-[#18375D] text-[#F6F2E9]`, inactif
  `#8A877F`. Écart : la maquette n'a ni viewer 3D ni interrupteur ; les interrupteurs reprennent ce style (angles nets).
- Mesure sur GPU réel (Playwright local, WebGL matériel) : **60 images/s** pendant une rotation, niveau Auto resté en
  « haute » (critère du lot 1 vérifié).
- Tests : `__tests__/useStudioSettings.test.ts`, `__tests__/StudioControls.test.tsx`, `Garment3DPanel.test.tsx`
  (réglages transmis au viewer), `studio3dComponents.test.tsx` (clé sans ombre), e2e
  `e2e/pattern-studio/reglages-rendu.spec.ts` (réglages, captures par éclairage, mémorisation au rechargement, fps).

### 2026-11-05 — Vues caméra prédéfinies, transitions douces (lot 4 de `docs/plans/studio-3d-rendering.md`)

- Deux vues de plus dans le groupe « Vues » de `Garment3DPanel` : **3/4** (35° depuis la face, un peu au-dessus de la
  taille ; touche `5`) et **Ourlet** (gros plan du bas du vêtement ; touche `2`). L'ourlet vise le point le plus bas
  des panneaux principaux (devant/dos du corsage, de la jupe, du buste ou des jambes — traîne, manches et détails
  exclus), le genou à défaut (`hemHeight`, `utils/studio3d/camera-views.ts`).
- Les positions des vues sont sorties du viewer vers `utils/studio3d/camera-views.ts` (`viewPose`, `ViewName`
  réexporté par `Garment3DViewer`).
- Transition : `utils/studio3d/camera-tween.ts` (pur) — 600 ms, `cubic-bezier(0.65, 0, 0.35, 1)`, la cible avance en
  ligne droite et la caméra tourne autour d'elle sur une sphère par le plus court chemin (elle ne traverse pas le
  mannequin). `CameraRig` l'anime dans `useFrame` + `invalidate()` (canevas rendu à la demande) ; instantané sous
  `prefers-reduced-motion` ; saisir la vue (événement `start` d'`OrbitControls`) annule la transition.
- Stitch (écran `ade57b6cba4241ae9464fd96b7e46d89`, revu via `agy --print` le 2026-11-05) : pas de groupe de vues
  caméra sur le canevas (seuls zoom/recentrage en bas à gauche et « Vue technique / simplifiée » en bas à droite). Écart :
  les boutons 3/4 et Ourlet reprennent le style du groupe « Vues » existant (`rounded-lg`, hors périmètre du plan).
- Vérifié sur GPU réel (e2e) : 0 image dessinée au repos, ≈ 12 pendant la transition vers 3/4 ; vue figée ensuite ;
  captures 3/4 et ourlet relues (robe du compte client : bas de jupe et pieds cadrés).
- Tests : `utils/studio3d/__tests__/camera-tween.test.ts` (extrémités, monotonie, distance constante, plus court
  chemin), `camera-views.test.ts`, `Garment3DPanel.test.tsx` (boutons et touches `5` / `2`), e2e
  `e2e/pattern-studio/vues-camera.spec.ts`.
