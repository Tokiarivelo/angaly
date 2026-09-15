# Page — `pattern-studio-wizard`

**Statut : ✅ Fait.** Phase 4 — Premium (Angaly Pattern Studio).

## Objet

Assistant guidé en 7 étapes où le client configure un nouveau projet de patron paramétrique
(type de vêtement, occasion, style, coupe, détails, photo d'inspiration, mesures), puis
déclenche la génération. C'est le cœur du parcours différenciant de la Phase 4.

## Route(s)

`apps/web/src/app/(client)/pattern-studio/wizard/[projectId]/page.tsx` →
`/pattern-studio/wizard/:projectId` (le `projectId` est créé côté serveur dès l'étape 1
validée, pour permettre une reprise si le client quitte le flux — spec §19).

Client Component dès la racine (état de wizard multi-étapes, pas de bénéfice SSR).

## Référence maquette

- Prompt Stitch : `stitch-prompts/17-pattern-studio-wizard-creation.md`
- Écrans Stitch : **ANGALY Pattern Studio — Étape 1 / Étape 7 / Génération en cours**
- Section spécification : §19-24

## Arborescence de composants attendue

```
apps/web/src/features/pattern-studio-wizard/
  ui/
    PatternStudioWizard.tsx     → shell : header sombre, barre de progression, switch d'étape
    WizardProgressBar.tsx
    steps/
      GarmentTypeStep.tsx       → étape 1 : grille de cartes vêtement
      OccasionStep.tsx          → étape 2 : chips occasion
      StyleStep.tsx             → étape 3 : cartes style
      CutStep.tsx               → étape 4 : chips coupe + bouton "Obtenir une suggestion IA"
                                    (session 2026-09-14 — voir Points d'attention)
      DetailsStep.tsx           → étape 5 : accordéons de détails
      InspirationStep.tsx       → étape 6 : dropzone + résultat d'analyse IA (placeholder Phase 4/5)
      MeasurementsStep.tsx      → étape 7 : profil existant, saisie manuelle, ou "taille standard"
                                    (XS/S/M/L/XL…, session 2026-09-14 — voir Points d'attention)
    WizardFooterNav.tsx         → boutons Retour/Continuer, réutilisé à chaque étape
    GenerationLoadingScreen.tsx → écran "Génération en cours"
  hooks/
    usePatternWizard.ts         → état global du wizard (étape courante, payload cumulé),
                                    persistance de brouillon (draft autosave)
    useCreatePatternProject.ts  → mutation de création (étape 1) → renvoie projectId
    useUploadInspirationPhoto.ts→ upload vers MinIO (bucket `patterns/`) + appel `ai-inference`
    useMeasurementProfiles.ts   → liste des profils existants du client (module `measurements`)
    useSizeCharts.ts            → table de tailles standard par genre (module `measurements`)
    useGeneratePattern.ts       → mutation finale → appelle `pattern-engine` (+ suggestion `ai-inference`)
  api/
    pattern-projects.api.ts
    measurements.api.ts
    size-charts.api.ts
  schemas/
    wizard-step.schema.ts       → un schema Zod par étape, composés en un schema global
  consts/
    garment-types.const.ts, occasions.const.ts, styles.const.ts, cuts.const.ts
  types/
    wizard-state.types.ts
  __tests__/
    usePatternWizard.test.ts
    useGeneratePattern.test.ts
  index.ts
```

`PatternStudioWizard.tsx` et chaque `steps/*Step.tsx` ne contiennent que du JSX + hooks —
toute la machine à états du wizard (étape courante, validation par étape, payload cumulé)
vit dans `usePatternWizard.ts`.

## Endpoints API consommés

| Endpoint | Module | Usage |
| --- | --- | --- |
| `POST /api/pattern-projects` | `patterns` | Création du projet (étape 1) |
| `PATCH /api/pattern-projects/:id` | `patterns` | Mise à jour incrémentale à chaque étape |
| `GET /api/measurement-profiles` | `measurements` | Profils du client pour l'étape 7 |
| `GET /api/measurements/size-charts` | `measurements` | Table de tailles standard (XS/S/M/L/XL…) pour l'étape 7 |
| `POST /api/ai-inference/pattern-suggestions` | `ai-inference` | Suggestion de coupe à l'étape 4 (bouton, jamais appliquée automatiquement) |
| `POST /api/media/presigned-upload` | `media` | URL pré-signée MinIO pour la photo d'inspiration |
| `POST /api/ai-inference/inspiration-analysis` | `ai-inference` | Analyse de la photo (placeholder tant que Phase 5 n'est pas traitée) |
| `POST /api/pattern-projects/:id/generate` | `patterns` → `pattern-engine` | Génération de la première version du patron |

## Modèles Prisma touchés

`PatternProject`, `MeasurementProfile`, `Measurement`, `Media` (photo d'inspiration),
`PatternVersion` (créée par la génération finale), `AIConversation` (si un échange avec
l'assistant a lieu pendant le wizard).

## Points d'attention

- **Autosave obligatoire** : un client peut quitter le wizard à tout moment ; `usePatternWizard`
  doit persister le `projectId` + l'étape courante (au minimum via l'API `PATCH`, en
  complément un cache local léger pour l'UX offline-tolérant).
- Le résultat de l'étape 6 (analyse de photo) reste un **placeholder** tant que
  `docs/phases/phase-5-ai-avancee.md` n'est pas traitée — afficher clairement une confiance
  nulle/indicative, jamais présenter le résultat comme définitif (ADR-005,
  `docs/architecture.md`).
- L'étape 7 doit permettre de créer un nouveau profil de mesures inline (redirection vers
  `mes-mesures` sinon, mais l'inline est préférable pour ne pas casser le flux).
- Chaque étape est un `dynamic import()` pour ne pas charger tout le wizard au premier
  rendu (poids des cartes illustrées).
- **Correction 2026-09-14 — vocabulaire de mesures** : `MeasurementsStep.tsx` utilisait un jeu
  de clés (`TOUR_HANCHES`, `LARGEUR_EPAULES`, `LONGUEUR_VETEMENT`, `LONGUEUR_BRAS`) différent du
  vocabulaire canonique utilisé par `mes-mesures` et par `packages/pattern-engine`
  (`TOUR_POITRINE`, `TOUR_TAILLE`, `TOUR_BASSIN`, `LONGUEUR_DOS`, `CARRURE_DOS`, `TOUR_COU`) —
  les mesures saisies dans le wizard n'atteignaient donc jamais le moteur de patron, qui
  retombait systématiquement sur un corps par défaut codé en dur. Corrigé : les 6 champs de
  l'étape 7 utilisent désormais le vocabulaire canonique.
- **Ajout 2026-09-14 — taille standard** : mode alternatif à la saisie manuelle
  (`Ruler` toggle « Mesures personnalisées » / « Taille standard »), avec sélecteur de genre et
  pastilles XS/S/M/L/XL/XXL… pré-remplissant les mesures depuis
  `packages/types/src/size-charts.ts`. **Écran Stitch non revérifié pour cet ajout** : `agy
  --print` échoue en mode headless dans cet environnement (interruption avant réponse) et les
  outils MCP Stitch directs (`get_screen`/`list_screens`) échouent avec `Incompatible auth
  server: does not support dynamic client registration` — ni la session interactive `agy` ni le
  fallback MCP direct n'ont pu être utilisés (règle absolue #9). Le nouveau bloc réutilise
  strictement les patterns visuels déjà présents sur cet écran (toggle pilule `cm`/`pouces`,
  cartes de sélection du profil existant) plutôt que d'inventer une nouvelle mise en page — à
  confirmer contre l'écran Stitch réel dès qu'un accès `agy`/MCP fonctionnel est disponible.
- **Ajout 2026-09-14 — suggestion IA à l'étape 4** : `CutStep.tsx` gagne un bouton « Obtenir une
  suggestion IA » (icône `Sparkles`) qui appelle `POST /api/ai-inference/pattern-suggestions`
  avec le `garmentType`/`occasion`/`style` déjà choisis ; le résultat s'affiche dans un bandeau
  indicatif avec un bouton explicite « Appliquer cette coupe » — la suggestion n'est **jamais**
  appliquée automatiquement (règle absolue #18). Même caveat Stitch que ci-dessus : réutilise le
  style de bandeau déjà établi (`EstimatedMeasurementsBanner.tsx`) plutôt qu'une mise en page
  inventée.

## Checklist d'acceptation

- [ ] Les 7 étapes reproduisent fidèlement `stitch-prompts/17-*.md` (palette sombre dédiée Pattern Studio)
- [ ] Navigation Retour/Continuer fonctionnelle, bouton Continuer désactivé tant que l'étape n'est pas valide
- [ ] Reprise d'un projet en brouillon (revenir sur `/pattern-studio/wizard/:projectId` restaure l'état)
- [ ] Upload de photo d'inspiration fonctionnel vers MinIO, avec état de chargement et résultat d'analyse affiché
- [ ] Génération finale déclenche un appel à `packages/pattern-engine` et affiche l'écran de chargement puis redirige vers `pattern-studio-preview-validation-export`
- [ ] Tests : `usePatternWizard.test.ts` (transitions d'étapes), `useGeneratePattern.test.ts`, au moins un test e2e du parcours complet
- [ ] `docs/checklist-implementation.md` et `docs/mockup-reference.md` mis à jour à ✅
