# ANGALY — Règles Claude Code (Monorepo)

## Vue d'ensemble du projet

Monorepo ANGALY — maison de couture numérique (vitrine, boutique, sur-mesure, espace
client, back-office, et **Angaly Pattern Studio** — génération de patron assistée par IA).

- `apps/web` — Next.js 15, App Router, React 19
- `apps/api` — NestJS 11, Clean Architecture
- `apps/ai-service` — FastAPI (Python) — inférence IA pour Pattern Studio
- `packages/database` — Prisma 6, PostgreSQL 16
- `packages/types` — Types partagés TypeScript (front/back + contrat avec ai-service)
- `packages/config` — Configs partagées (ESLint, TS, Vitest)
- `packages/storage` — Client MinIO (upload/presign/delete pour tous les médias)
- `packages/pattern-engine` — Moteur de patronage géométrique déterministe (le "rules set")

## Processus de traitement d'une page/fonctionnalité

**S'applique à tout agent IA (Claude Code, Cursor, Antigravity, Windsurf, etc.) et à tout
développeur, avant toute implémentation.** Suivre ces étapes dans l'ordre :

0. **Ouvrir `docs/mockup-reference.md`** — référence croisée obligatoire Page ↔ Maquette
   Stitch ↔ Section de spécification ↔ Phase. Localiser la ligne concernée (ou l'ajouter).
1. **Consulter la maquette Stitch réelle via `agy`** (projet
   https://stitch.withgoogle.com/projects/3703874896720765754) — **obligatoire**, y compris
   pour une simple retouche de JSX/TSX, CSS, classes ou styles sur une page déjà livrée. Le
   prompt texte dans `stitch-prompts/` sert de mémo de contenu mais **ne remplace jamais**
   l'écran Stitch rendu : structure, copy exacte, nombre d'éléments (nav, colonnes de footer,
   cartes de catégories, étapes d'un stepper, etc.) doivent être vérifiés sur l'écran réel
   avant d'écrire le moindre élément visuel. Voir règle absolue dédiée ci-dessous et
   `.cursor/rules/006-phase-workflow.mdc`.
2. **Consulter `docs/checklist-implementation.md`** pour situer l'élément dans le périmètre
   global et connaître son statut actuel.
3. **Ouvrir la fiche dédiée** — `docs/pages/<slug>.md` (frontend) ou
   `docs/features/<slug>.md` (backend) — et la phase correspondante dans `docs/phases/`.
4. **Traiter une phase par session** — jamais plusieurs phases, jamais tout le périmètre en
   un seul passage. Utiliser les skills `new-feature` / `new-page-from-stitch` /
   `pattern-engine-rule` pour scaffolder.
5. **Ajouter les tests à chaque implémentation** — voir règle détaillée ci-dessous.
6. **Vérifier systématiquement que tous les tests passent** avant de considérer une page ou
   un module terminé.
7. **Documenter** — mettre à jour la fiche `docs/pages/<slug>.md`/`docs/features/<slug>.md`,
   et **toujours** `docs/deployment.md`/`docs/development.md` si le changement touche
   l'infrastructure, une variable d'environnement, un port, ou la procédure de lancement.
8. **Mettre à jour `docs/checklist-implementation.md` et `docs/mockup-reference.md`** pour
   refléter le nouveau statut.

## Règles absolues

### Général

1. **TypeScript strict** — jamais `any`, jamais `@ts-ignore` sans explication
2. **Toujours utiliser `@angaly/types`** pour les types partagés front/back/ai-service
3. **Variables d'environnement** via `process.env.XXX`, jamais hardcodées
4. **Conventional Commits** — `feat(auth): add refresh token` — scopes autorisés définis
   dans `commitlint.config.ts`
5. **Tests obligatoires à chaque implémentation** — voir règle détaillée ci-dessous

### Frontend (apps/web)

6. **Les pages Next.js sont vides de logique** — elles importent seulement le composant
   racine d'une feature
7. **Architecture feature-sliced** — chaque feature dans `src/features/<name>/`
8. **Composants UI purement présentationnels** — toute la logique dans les hooks
9. **Toujours utiliser `agy` (ou, à défaut, les outils MCP Stitch directs) pour vérifier
   l'écran réel avant d'écrire du JSX/TSX, du CSS, des classes ou des styles** — que ce soit
   pour une nouvelle page ou une retouche sur une page existante. Ne jamais s'appuyer
   uniquement sur `stitch-prompts/*.md` pour la structure, la copy exacte ou le nombre
   d'éléments visuels : ces prompts textuels dérivent parfois de l'écran réel sans le
   reproduire fidèlement. Si `agy --print` échoue en mode headless (erreur de permission
   MCP), utiliser une session `agy` interactive, ou à défaut les outils MCP Stitch
   (`get_screen` + capture d'écran) — jamais deviner un détail visuel déjà tranché dans la
   maquette.
10. **react-query** pour tous les appels API — jamais de `fetch` direct dans les composants
11. **Zustand** pour les états globaux (panier, favoris, sidebar admin)
12. **Zod** pour la validation des formulaires

### Backend (apps/api)

13. **Clean Architecture stricte** : Domain → Application → Infrastructure → Presentation
14. **Le Domain ne dépend de rien** (pas Prisma, pas NestJS, pas `@angaly/storage`)
15. **Les Controllers délèguent** aux use-cases — zéro logique métier dans les controllers
16. **DTOs validés** avec class-validator (+ Zod pour les schémas de formulaires côté web)
17. **Guards au niveau Controller** — jamais dans les use-cases

### Angaly Pattern Studio (IA + Pattern Engine)

18. **L'IA (`apps/ai-service`) ne produit jamais de géométrie de patron** — uniquement des
    suggestions de paramètres, toujours soumises à validation humaine/couturière
19. **`packages/pattern-engine` est déterministe et sans dépendance externe** — voir
    `.cursor/rules/007-pattern-engine.mdc`
20. **`apps/ai-service` n'est appelé que par le module `ai-inference`** côté NestJS —
    jamais directement depuis `apps/web`

### Médias

21. **Tout média passe par MinIO via `@angaly/storage`**, jamais de stockage local ou en
    base — voir `.cursor/rules/009-storage-minio.mdc`

## Règle tests — s'applique toujours

**Toute implémentation de code fonctionnel doit inclure ses tests dans le même commit.**

| Ce qu'on implémente          | Tests obligatoires                                        |
| ----------------------------- | ----------------------------------------------------------- |
| Hook frontend                  | `__tests__/<hookName>.test.ts` (Vitest + Testing Library)  |
| Composant UI interactif        | `__tests__/<ComponentName>.test.tsx`                       |
| Util / fonction pure             | `__tests__/<name>.test.ts`                                 |
| Use case backend                | `__tests__/unit/<use-case>.spec.ts` (Jest)                 |
| Controller backend               | `__tests__/integration/<controller>.spec.ts` (Supertest)   |
| Règle `@angaly/pattern-engine`  | `src/__tests__/<rule>.test.ts` (Vitest)                    |
| Endpoint `apps/ai-service`      | `tests/test_<route>.py` (pytest)                            |
| Parcours critique (frontend)    | `apps/web/e2e/<feature>/<parcours>.spec.ts` (Playwright)   |

### Références d'implémentation

- **Health check backend** : `apps/api/src/shared/health/` — controller + test, référence
  minimale du pattern Presentation-only
- **Pattern engine orchestrateur** : `packages/pattern-engine/src/pattern-engine.ts` +
  `src/__tests__/pattern-engine.test.ts` — référence du pattern "règles enregistrées"
- **AI service** : `apps/ai-service/app/` + `tests/` — référence FastAPI + pytest

### Commandes de vérification

```bash
pnpm --filter @angaly/api test:coverage             # Jest — minimum 80%
pnpm --filter @angaly/web test:coverage             # Vitest — minimum 80%
pnpm --filter @angaly/pattern-engine test:coverage  # Vitest — minimum 80%
make test.ai                                        # pytest — minimum 80%
pnpm --filter @angaly/web test:e2e                  # Playwright — parcours critiques
```

## Commandes Claude Code (slash commands)

| Commande                                               | Description                                      |
| ------------------------------------------------------ | ------------------------------------------------- |
| `/dev`                                                  | Démarre l'infra Docker + `pnpm dev`               |
| `/test [web\|api\|ai\|pattern-engine\|e2e]`            | Lance les tests avec coverage                     |
| `/db <migrate\|seed\|reset\|studio\|generate\|status>` | Gestion Prisma / PostgreSQL                       |
| `/lint [fix]`                                           | Lint + typecheck (avec correction auto si `fix`)  |
| `/review`                                               | Revue de code des changements en cours            |
| `/build [web\|api\|ai]`                                | Build production                                  |
| `/infra <up\|down\|reset\|logs\|status>`               | Gestion Docker                                    |
| `/commit [push]`                                        | Commit Conventional Commits guidé                 |

Skills projet : `new-feature`, `new-page-from-stitch`, `pattern-engine-rule` (voir
`.claude/skills/`).

## Commandes manuelles

```bash
pnpm dev                    # Démarre web + api
pnpm test                   # Lance tous les tests Node
pnpm lint                   # Lint tout
pnpm typecheck              # Type-check tout
docker compose up -d        # Infrastructure (postgres, minio, adminer)
make dev.ai / make test.ai  # apps/ai-service (hors turborepo)
```

## Architecture de référence

Voir `docs/architecture.md` pour les diagrammes et ADR.
