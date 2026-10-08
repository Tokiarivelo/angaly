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
