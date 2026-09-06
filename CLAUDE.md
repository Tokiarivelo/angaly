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
1. **Consulter la maquette Stitch** référencée (projet
   https://stitch.withgoogle.com/projects/3703874896720765754 + prompt source dans
   `stitch-prompts/`) — c'est la référence visuelle et de contenu à respecter.
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
9. **react-query** pour tous les appels API — jamais de `fetch` direct dans les composants
10. **Zustand** pour les états globaux (panier, favoris, sidebar admin)
11. **Zod** pour la validation des formulaires

### Backend (apps/api)

12. **Clean Architecture stricte** : Domain → Application → Infrastructure → Presentation
13. **Le Domain ne dépend de rien** (pas Prisma, pas NestJS, pas `@angaly/storage`)
14. **Les Controllers délèguent** aux use-cases — zéro logique métier dans les controllers
15. **DTOs validés** avec class-validator (+ Zod pour les schémas de formulaires côté web)
16. **Guards au niveau Controller** — jamais dans les use-cases

### Angaly Pattern Studio (IA + Pattern Engine)

17. **L'IA (`apps/ai-service`) ne produit jamais de géométrie de patron** — uniquement des
    suggestions de paramètres, toujours soumises à validation humaine/couturière
18. **`packages/pattern-engine` est déterministe et sans dépendance externe** — voir
    `.cursor/rules/007-pattern-engine.mdc`
19. **`apps/ai-service` n'est appelé que par le module `ai-inference`** côté NestJS —
    jamais directement depuis `apps/web`

### Médias

20. **Tout média passe par MinIO via `@angaly/storage`**, jamais de stockage local ou en
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
