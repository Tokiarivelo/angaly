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
  Gizmo d'axes cliquable (comme Blender), boutons Face / Dos / Côté / Dessus / Recentrer et raccourcis pavé numérique
  quand la scène a le focus : `1` face, `Ctrl+1` ou `9` dos, `3` côté, `7` dessus, `Home` recentrer.
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
