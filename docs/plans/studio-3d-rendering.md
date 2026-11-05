# Plan d'implémentation — Rendu 3D « studio » et contrôles du viewer

> Rédigé le 2026-11-05 par Claude Code. But : appliquer aux deux viewers 3D du Pattern Studio
> (`Garment3DViewer`, `RealisticRenderViewer`) la méthode de rendu du projet `~/Documents/Projects/teardown`
> (studio à softboxes, ombres douces, occlusion ambiante, MSAA, niveaux de qualité, shaders préchauffés,
> capture image par image) pour un rendu plus réaliste, et donner plus de contrôle à l'utilisateur :
> réglages studio, vues caméra prédéfinies, capture haute résolution.
> Chaque lot est autonome, se livre avec ses tests et se vérifie sur captures.

## 0. Avant de commencer (tous les lots)

1. Lire `docs/handoff.md`, puis la section du lot ci-dessous.
2. Règles du dépôt (`CLAUDE.md`) : TypeScript strict, logique dans les hooks, UI présentationnelle,
   écran Stitch réel avant tout JSX/CSS, tests dans le même changement, coverage ≥ 80 %,
   `docs/handoff.md` à jour avant de clore, **une phase (un lot) par session**.
3. Skill `pattern-generation` (`.claude/skills/pattern-generation/SKILL.md`) dès qu'un rendu de vêtement
   ne ressemble plus à son modèle : le changement d'éclairage peut modifier la lecture des couleurs et
   des tissus. Revérifier les 6 projets du lot 4 précédent (`~/angaly-catalog-run/results.json`).
4. Référence technique : `~/Documents/Projects/teardown`
   - `sims/v8-shared/stage.js` : studio PMREM à softboxes, VSM, sol « ombre seule », GTAO, MSAA 8×, NeutralToneMapping ;
   - `sims/kit/warm.js` : compilation parallèle des shaders (`renderer.compileAsync`) avant la 1re image ;
   - `sims/v8-shared/live.js` (`TIERS`) : niveaux de qualité ;
   - `sims/capture.mjs` : capture Playwright image par image, planches de revue ;
   - `SKILL.md` § « three.js traps » et checklist 3D.

### Maquette Stitch (vérifiée le 2026-11-05 via `agy`)

Écran **ANGALY — Validation de Patron (Studio)** (`ade57b6cba4241ae9464fd96b7e46d89`) : la maquette ne contient
**pas** de viewer 3D (canevas technique 2D seulement) ; aucun contrôle d'éclairage, de qualité, de caméra ni
d'export d'image. Le viewer 3D a été ajouté après coup. Les nouveaux contrôles reprennent donc le style
des **contrôles en surimpression** de la maquette :

- boîtier `bg-[#041329]/80 backdrop-blur-md border border-[#18375D] rounded-sm` ;
- bouton/onglet actif `bg-[#18375D] text-[#F6F2E9]`, inactif `text-[#8A877F]`, icônes `#D8D3C8` → `#C5B190` au survol ;
- labels Inter majuscules `tracking-widest`, valeurs en `font-mono` ;
- placement : surimpression dans le canevas (la maquette met zoom/recentrage en bas à gauche, bascule de vue en bas à droite ;
  le gizmo 3D occupe déjà le bas à droite → réglages studio **en haut à droite**).

Les barres existantes du panneau 3D (`Garment3DPanel.tsx`) utilisent `rounded-lg` ; ne pas les refaire dans ce plan
(hors périmètre), le noter comme écart dans `docs/pages/pattern-studio-preview-validation-export.md`.

### Ordre conseillé

| Ordre | Lot                                                  | Pourquoi dans cet ordre           | Charge estimée |
| ----- | ---------------------------------------------------- | --------------------------------- | -------------- |
| 1     | Lot 1 — Module « studio » partagé + aperçu 3D        | socle de tous les autres lots     | 1,5 j          |
| 2     | Lot 2 — Rendu réaliste (Blender) sur le même studio  | réutilise le lot 1 tel quel       | 0,5 j          |
| 3     | Lot 3 — Réglages studio dans le viewer               | expose les options du lot 1       | 1 j            |
| 4     | Lot 4 — Vues caméra prédéfinies, transitions douces  | indépendant du lot 3              | 0,5 j          |
| 5     | Lot 5 — Capture haute résolution + planches de revue | s'appuie sur le pipeline du lot 1 | 1 j            |

---

## Lot 1 — Module « studio » partagé, appliqué à l'aperçu 3D

### Constat (code au 2026-11-05)

- `Garment3DViewer.tsx` (l. ~984-1085) : `<Canvas frameloop="demand" dpr={[1,1.5]} gl={{antialias:true}}>`,
  environnement `RoomEnvironment` à intensité 0.25, 4 `directionalLight` + ambiante + hémisphère, **aucune ombre
  projetée** (seul un disque noir semi-transparent sous les pieds, l. ~465), pas d'occlusion ambiante, tone mapping
  par défaut de R3F (ACES).
- Résultat : volumes plats, plis du tissu peu lisibles, vêtement qui « flotte » sur le mannequin.

### À faire

Nouveau dossier `apps/web/src/features/pattern-studio-preview-validation-export/utils/studio3d/` :

1. `studio-config.ts` (pur, sans three.js, testable) :
   - `QUALITY_TIERS` : `high {samples:8, ao:true, shadowMap:4096, maxDpr:2}`, `medium {4, false, 2048, 1.5}`,
     `low {0, false, 1024, 1}` ; `pickInitialTier({coarsePointer, minSide, deviceMemory})` (mobile → `low`) ;
   - `LIGHTING_PRESETS` : `studio` (softbox haute + 2 bandes latérales + kicker chaud, comme le V8),
     `soft` (softbox haute seule, ombre large), `contrast` (lumière rasante latérale, fait ressortir velours et smocks) :
     positions, intensités, couleurs, rayon d'ombre ;
   - `nextTierOnSlowFrames(tier, frameTimesMs)` : descend d'un niveau si la moyenne dépasse 28 ms sur 60 images.
2. `StudioEnvironment.tsx` : remplace l'actuel (`RoomEnvironment`) par une scène de softboxes convertie avec
   `PMREMGenerator.fromScene(env, 0.02)` ; `scene.environmentIntensity` selon le preset. Garder une variante pour le
   fond navy (mode sans `fabricFinish`).
3. `StudioLights.tsx` : clé `directionalLight castShadow`, ombre `VSMShadowMap` (rayon 14, `blurSamples` 24,
   `bias -0.0004`, `normalBias 0.002`), caméra d'ombre serrée sur le mannequin (≈ ±1,2 m) ; hémisphère en appoint.
4. `ShadowFloor.tsx` : plan `ShadowMaterial` (opacité ≈ 0.3) avec **`polygonOffset`** (piège teardown : sinon il perd
   le test de profondeur dans le render target). Remplace le disque noir sous les pieds.
5. `StudioPost.tsx` : `EffectComposer` three (pas de dépendance nouvelle : `three/examples/jsm/postprocessing/*`
   existent en 0.170) — `RenderPass` → masquer sol + gizmo → `GTAOPass` (radius 0.05, samples 16, blend 0.75) →
   réafficher → `OutputPass`. Render target `HalfFloatType`, `samples` selon le tier. Rendu via
   `useFrame((s) => composer.render(), 1)`.
   - `frameloop="demand"` reste : le composer ne rend que quand R3F invalide.
   - **Attention** : `useFrame` avec priorité > 0 coupe le rendu automatique de R3F ; vérifier que `GizmoHelper`
     (`renderPriority` par défaut 1) se dessine encore → lui donner `renderPriority={2}`.
   - Mode « Transparence » : les matériaux transparents ne passent pas dans le pass de normales GTAO ; vérifier
     l'absence de halo.
   - `MeshEditLayer` / `SculptBrush` (points, curseur) : les sortir de l'AO (calque ou masquage comme le sol).
6. `useShaderWarmup.ts` : portage de `teardown/sims/kit/warm.js` (`renderer.compileAsync` sur la scène + matériaux
   des passes), afficher « Préparation du rendu… » tant que la promesse n'est pas résolue.
7. Réglages renderer dans `onCreated` : `toneMapping = NeutralToneMapping`, `shadowMap.enabled = true`,
   `shadowMap.type = VSMShadowMap`, `outputColorSpace = SRGB`, `gl={{ antialias:false }}` (le MSAA vient du composer).
8. Dans `Garment3DViewer.tsx` : `castShadow`/`receiveShadow` sur les panneaux, le corps (`Person`, `Mannequin`),
   la tête et les cheveux ; retirer les 4 `directionalLight` codées en dur au profit de `<StudioLights preset=… />`.
9. Matériaux (checklist teardown) : tissu satiné `roughness ≥ 0.38` déjà ok ; vérifier que les blancs (dentelle,
   plastron `#E9DFC6`) ne brûlent pas sous la nouvelle clé ; `envMapIntensity ≈ 0.5` sur les grandes surfaces brillantes ;
   bloom **non** ajouté (mange les détails des broderies).

### Tests

- `utils/studio3d/__tests__/studio-config.test.ts` : tiers, `pickInitialTier`, `nextTierOnSlowFrames`, presets complets.
- `__tests__/useShaderWarmup.test.ts` : état « prêt » après résolution, nettoyage au démontage (renderer mocké).
- Tests existants du viewer : doivent rester verts (vérifier comment `@react-three/fiber` est mocké dans
  `__tests__/`, ajouter les nouveaux composants au mock si besoin).
- Revue visuelle : captures face / côté / dos des 6 projets catalogue (fourreau df576026, péplum 3a7ebe43,
  biais e6966074, portefeuille 16c37a2a, dirndl 0099e9eb, paysanne 6ec398b0) avant / après, planche côte à côte.

### Critères de fin

Ombre portée nette au sol et sous les bras/col ; plis lisibles ; aucune image noire (NaN) ; ≥ 50 fps en `high`
sur GPU dédié, ≥ 30 fps en `low` sur GPU intégré ; pas de gel au premier affichage.

---

## Lot 2 — Rendu réaliste (Blender) sur le même studio

### Constat

`RealisticRenderViewer.tsx` (l. ~200-223) : 3 lumières codées en dur, fond navy, pas d'environnement, pas d'ombre.
Il ne ressemble pas à l'aperçu alors qu'il doit être « la version réaliste ».

### À faire

- Monter `StudioEnvironment`, `StudioLights`, `ShadowFloor`, `StudioPost`, `useShaderWarmup` du lot 1.
- `castShadow`/`receiveShadow` sur la scène du `.glb` (`scene.traverse`).
- Le `.glb` simulé a de vrais plis : c'est ici que le GTAO apporte le plus ; tester `blend 0.9`.

### Tests

`__tests__/RealisticRenderViewer.test.tsx` (existant ou à créer) : ombres activées sur les meshes du glb ;
e2e `apps/web/e2e/pattern-studio/rendu-realiste.spec.ts` toujours vert.

---

## Lot 3 — Réglages studio dans le viewer

### À faire

1. Hook `hooks/useStudioSettings.ts` : `{ lighting: 'studio'|'soft'|'contrast', shadows: boolean, ao: boolean,
quality: 'auto'|'high'|'medium'|'low' }`, défauts `studio / true / true / auto` ; mémorisé en `localStorage`
   (try/catch, simple confort par navigateur) ; en `auto`, applique `nextTierOnSlowFrames`.
   État local au viewer (pas global → pas de Zustand nécessaire).
2. Composant présentationnel `ui/StudioControls.tsx` : bouton icône « Réglages du rendu » (lucide `SlidersHorizontal`)
   en surimpression **en haut à droite** du canevas, qui ouvre un petit panneau au style Stitch (§0) :
   - « Éclairage » : onglets segmentés Studio / Doux / Contrasté ;
   - « Ombres » et « Occlusion » : interrupteurs ;
   - « Qualité » : Auto / Haute / Moyenne / Basse, avec le niveau réel affiché en `font-mono` quand Auto ;
   - Échap ferme, focus rendu au bouton, `aria-expanded`, `role="group"` + labels.
3. Brancher dans `Garment3DPanel.tsx` → props du viewer ; les deux viewers lisent les mêmes réglages.

### Tests

- `__tests__/useStudioSettings.test.ts` : défauts, persistance, `localStorage` qui lève une exception, descente auto.
- `__tests__/StudioControls.test.tsx` : ouverture/fermeture, Échap, chaque contrôle appelle son setter, a11y.

---

## Lot 4 — Vues caméra prédéfinies, transitions douces

### Constat

`ViewName = 'front'|'back'|'side'|'top'|'reset'|'face'` ; `CameraRig` **saute** directement à la position
(pas de transition). Raccourcis clavier 1 / 3 / 7 / 9 / Ctrl+1 / Home déjà en place.

### À faire

- Ajouter `threeQuarter` (« 3/4 », position ≈ 35° de la face, légèrement au-dessus) et `hem` (« Ourlet », gros plan
  bas de jupe / bas de pantalon, cible selon `bodyLandmarks`). Raccourcis : `5` → 3/4, `2` → ourlet.
- `utils/studio3d/camera-tween.ts` (pur) : interpolation position + cible avec
  `cubic-bezier(0.65, 0, 0.35, 1)` sur 600 ms (règle « state to state » de teardown), interpolation sphérique autour
  de la cible pour ne pas traverser le mannequin.
- `CameraRig` : anime via `useFrame` + `invalidate()` à chaque image pendant la transition ; instantané si
  `prefers-reduced-motion` ; une interaction de l'utilisateur (OrbitControls `start`) annule la transition.
- Boutons « 3/4 » et « Ourlet » ajoutés au groupe « Vues » existant de `Garment3DPanel.tsx`.

### Tests

- `utils/studio3d/__tests__/camera-tween.test.ts` : extrémités exactes, monotonie, distance à la cible constante.
- Test du panneau : nouveaux boutons et raccourcis émettent la bonne `ViewRequest`.

---

## Lot 5 — Capture haute résolution + planches de revue

### À faire

1. **Bouton « Capture HD »** (dans `StudioControls`, ou à côté de « Plein écran ») : choix 2× / 4× ;
   `utils/studio3d/capture.ts` : fixe temporairement le pixel ratio (`gl.setPixelRatio`, `composer.setPixelRatio`),
   force le tier `high`, rend une image, `canvas.toBlob('image/png')`, rétablit l'état, télécharge
   `angaly-<projectRef>-<vue>.png`. Limiter la taille à `gl.capabilities.maxTextureSize`.
   Téléchargement local uniquement : rien n'est stocké → la règle MinIO (§21) ne s'applique pas ; si un jour la
   capture est enregistrée côté serveur, passer par `@angaly/storage`.
2. **Hook de capture déterministe** : sur `?capture=1`, le viewer expose `window.__ANGALY_3D = { ready, setView(v),
renderPng(scale) }` et coupe animations et amortissement (comme `render(t)` pur de teardown).
3. **Script de planches** `apps/web/scripts/capture-3d-sheet.mjs` (Playwright déjà en devDependency) :
   `node apps/web/scripts/capture-3d-sheet.mjs --project <id> --views front,threeQuarter,side,back --scale 2
--out <png>` ; lance Chromium avec les drapeaux GPU de `teardown/paths.mjs`
   (`--ignore-gpu-blocklist --enable-gpu-rasterization --force_high_performance_gpu`), affiche le GPU obtenu
   (avertir si SwiftShader/llvmpipe), assemble une planche étiquetée. À utiliser dans la boucle de revue
   du skill `pattern-generation` à la place des captures manuelles.
4. Documenter la commande dans `docs/development.md` et dans le skill `pattern-generation`.

### Tests

- `utils/studio3d/__tests__/capture.test.ts` : nom de fichier, plafond de taille, état rétabli même en cas d'erreur.
- e2e `apps/web/e2e/pattern-studio/capture-hd.spec.ts` : le bouton déclenche un téléchargement PNG non vide.

---

## Fin de chaque lot

1. `pnpm --filter @angaly/web test:coverage` (≥ 80 %), `pnpm typecheck`, `pnpm --filter @angaly/web test:e2e`
   (parcours pattern-studio).
2. Mettre à jour `docs/pages/pattern-studio-preview-validation-export.md` (section 3D : studio, réglages, vues,
   capture, écart Stitch), `docs/checklist-implementation.md`, `docs/mockup-reference.md` si le statut change.
3. Cocher le lot ci-dessous et mettre à jour `docs/handoff.md`.

## Suivi

- [x] Lot 1 — Module studio partagé + aperçu 3D (2026-11-05). Écarts : composants R3F dans `ui/studio3d/` (pas
      `utils/`), hooks dans `hooks/` ; `normal-guard.ts` ajouté (normales NaN de la broderie) ; flou d'ombre exprimé pour une
      carte 2048 et mis à l'échelle ; contre-lumière du preset `studio` relevée (dos trop sombre). Fps non mesurés sur GPU
      réel (captures en SwiftShader) : à vérifier au lot 3.
- [x] Lot 2 — Rendu réaliste sur le même studio (2026-11-05). Écarts : `StudioBackdrop` sorti de `Garment3DViewer` vers
      `ui/studio3d/` ; option `aoBlend` (0,9) ajoutée à `StudioPost`/composer ; `applyStudioShadows` ajouté. Vérifié le 2026-11-05 :
      e2e `rendu-realiste` ✓ (26 s, WebGL sur GPU — en SwiftShader le `.glb` ne finit pas de charger en 60 s), capture
      sans pixel noir, plis marqués, AO 0,9 acceptable. Pas de capture « avant » (ancien code non relancé).
- [x] Lot 3 — Réglages studio (2026-11-05). Écarts : réglages purs dans `utils/studio3d/studio-settings.ts` ; le hook
      porte aussi le niveau auto (via `useStudioQuality`) et le passe aux deux viewers (prop `studio`) ; fermeture au clic
      extérieur et note « occlusion en qualité haute seulement » ajoutées ; e2e `reglages-rendu.spec.ts`. Fps sur GPU réel :
      60 images/s en rotation, niveau haute.
- [x] Lot 4 — Vues caméra et transitions (2026-11-05). Écarts : positions des vues sorties dans
      `utils/studio3d/camera-views.ts` (`viewPose`, `hemHeight` : point le plus bas des panneaux devant/dos principaux,
      genou à défaut) ; e2e `vues-camera.spec.ts` ajouté (compte les images dessinées pendant la transition, une capture
      est trop lente pour saisir 600 ms).
- [ ] Lot 5 — Capture HD et planches de revue

## Risques connus

- **Performance** : GTAO + VSM 4096 coûtent cher sur GPU intégré → tiers + mode auto ; tester sur un portable.
- **Pièges three.js** (teardown `SKILL.md`) : `smoothstep(a,b,x)` avec `a > b` renvoie 0 sous ANGLE/D3D ;
  un pixel NaN noircit l'image après post-traitement (borner les `pow()` des shaders de `surface-shading.ts`) ;
  GTAO sur un modèle coupé doit recevoir les mêmes plans de coupe sur `gtao.normalMaterial`.
- **Couleurs** : le passage à `NeutralToneMapping` éclaircit/désature moins qu'ACES → revérifier la fidélité des
  couleurs des 6 projets catalogue face à leurs photos d'inspiration.
- **Contextes WebGL** : deux viewers montés en même temps (aperçu + réaliste) doublent la mémoire des render targets ;
  garder la gestion de `webglcontextlost` existante.
