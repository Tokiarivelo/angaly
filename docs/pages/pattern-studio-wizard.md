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
      CutStep.tsx               → étape 4 : chips coupe
      DetailsStep.tsx           → étape 5 : accordéons de détails
      InspirationStep.tsx       → étape 6 : dropzone + résultat d'analyse IA (placeholder Phase 4/5)
      MeasurementsStep.tsx      → étape 7 : sélection/saisie de profil de mesures
    WizardFooterNav.tsx         → boutons Retour/Continuer, réutilisé à chaque étape
    GenerationLoadingScreen.tsx → écran "Génération en cours"
  hooks/
    usePatternWizard.ts         → état global du wizard (étape courante, payload cumulé),
                                    persistance de brouillon (draft autosave)
    useCreatePatternProject.ts  → mutation de création (étape 1) → renvoie projectId
    useUploadInspirationPhoto.ts→ upload vers MinIO (bucket `patterns/`) + appel `ai-inference`
    useMeasurementProfiles.ts   → liste des profils existants du client (module `measurements`)
    useGeneratePattern.ts       → mutation finale → appelle `pattern-engine` (+ suggestion `ai-inference`)
  api/
    pattern-projects.api.ts
    measurements.api.ts
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

## Checklist d'acceptation

- [ ] Les 7 étapes reproduisent fidèlement `stitch-prompts/17-*.md` (palette sombre dédiée Pattern Studio)
- [ ] Navigation Retour/Continuer fonctionnelle, bouton Continuer désactivé tant que l'étape n'est pas valide
- [ ] Reprise d'un projet en brouillon (revenir sur `/pattern-studio/wizard/:projectId` restaure l'état)
- [ ] Upload de photo d'inspiration fonctionnel vers MinIO, avec état de chargement et résultat d'analyse affiché
- [ ] Génération finale déclenche un appel à `packages/pattern-engine` et affiche l'écran de chargement puis redirige vers `pattern-studio-preview-validation-export`
- [ ] Tests : `usePatternWizard.test.ts` (transitions d'étapes), `useGeneratePattern.test.ts`, au moins un test e2e du parcours complet
- [ ] `docs/checklist-implementation.md` et `docs/mockup-reference.md` mis à jour à ✅
