# ANGALY — Règles Claude Code (Monorepo)

Maison de couture numérique (vitrine, boutique, sur-mesure, espace client, back-office,
**Angaly Pattern Studio** — patron assisté par IA). Architecture et ADR : `docs/architecture.md`.

- `apps/web` — Next.js 15, App Router, React 19
- `apps/api` — NestJS 11, Clean Architecture
- `apps/ai-service` — FastAPI (Python) — inférence IA pour Pattern Studio
- `packages/database` — Prisma 6, PostgreSQL 16
- `packages/types` — Types partagés TS (front/back + contrat ai-service)
- `packages/config` — Configs partagées (ESLint, TS, Vitest)
- `packages/storage` — Client MinIO (upload/presign/delete de tous les médias)
- `packages/pattern-engine` — Moteur de patronage géométrique déterministe

## Processus page/fonctionnalité (tout agent IA et tout dev, avant implémentation)

0. `docs/mockup-reference.md` — localiser (ou ajouter) la ligne Page ↔ Maquette ↔ Spec ↔ Phase.
1. **Consulter la maquette Stitch réelle via `agy`** (projet
   https://stitch.withgoogle.com/projects/3703874896720765754) — **obligatoire**, même pour une
   simple retouche JSX/TSX/CSS/classes. `stitch-prompts/` n'est qu'un mémo et **ne remplace
   jamais** l'écran rendu : structure, copy exacte et nombre d'éléments (nav, colonnes de footer,
   cartes, étapes de stepper…) se vérifient sur l'écran réel. Si `agy --print` échoue en
   headless (permission MCP) : session `agy` interactive, sinon MCP Stitch (`get_screen` +
   capture). Jamais deviner un détail visuel. Voir `.cursor/rules/006-phase-workflow.mdc`.
2. `docs/checklist-implementation.md` — situer l'élément et son statut.
3. Fiche `docs/pages/<slug>.md` (front) ou `docs/features/<slug>.md` (back) + phase dans `docs/phases/`.
4. **Une phase par session** — jamais plusieurs. Skills : `new-feature`, `new-page-from-stitch`,
   `pattern-engine-rule`.
5. Tests avec chaque implémentation (voir ci-dessous) ; tous doivent passer avant de clore.
6. Documenter : la fiche, et `docs/deployment.md`/`docs/development.md` si infra, variable
   d'env, port ou procédure de lancement changent.
7. Mettre à jour `docs/checklist-implementation.md` et `docs/mockup-reference.md`.
8. **Passation de session / Handoff** : Dès que les tokens s'épuisent ou que la session se
   termine, consigner immédiatement l'état dans `docs/handoff.md` avant de clore.

**Économie de contexte & bascule d'agent** : lire uniquement la ligne/section concernée de
`mockup-reference.md` et de `checklist-implementation.md` (grep, `offset`/`limit`), jamais en
entier — la fiche de la page et sa phase suffisent. Retouche triviale (typo, une classe, une ligne) :
garder l'étape 1 (Stitch) mais sauter 2–3 et 6–7 sauf si le statut change (les tests de l'étape 5
restent obligatoires).
**Bascule d'agent** : Dès que le contexte approche de la saturation, mettre à jour `docs/handoff.md`
(résumé, diff git, tests validés, prochaines actions précises) puis proposer `/clear` ou une
nouvelle session. Le nouvel agent reprend directement avec la consigne :
*« Lis docs/handoff.md et poursuis le travail selon les priorités définies. »*
Garder les checklists courtes : déplacer les items terminés vers `docs/checklist-archive.md` (à créer
au besoin), non lu par défaut.

## Règles absolues

### Général

1. TypeScript strict — jamais `any`, jamais `@ts-ignore` sans explication
2. Types partagés front/back/ai-service : toujours `@angaly/types`
3. Variables d'environnement via `process.env.XXX`, jamais hardcodées
4. Conventional Commits (`feat(auth): add refresh token`) — scopes dans `commitlint.config.ts`
5. Tests obligatoires à chaque implémentation

### Frontend (apps/web)

6. Pages Next.js vides de logique — elles importent le composant racine d'une feature
7. Feature-sliced : `src/features/<name>/`
8. Composants UI purement présentationnels — logique dans les hooks
9. Vérifier l'écran Stitch réel (`agy` ou MCP Stitch) avant tout JSX/TSX/CSS/classes/styles
   (voir étape 1 ci-dessus)
10. react-query pour tous les appels API — jamais de `fetch` direct dans les composants
11. Zustand pour les états globaux (panier, favoris, sidebar admin)
12. Zod pour la validation des formulaires

### Backend (apps/api)

13. Clean Architecture stricte : Domain → Application → Infrastructure → Presentation
14. Le Domain ne dépend de rien (ni Prisma, ni NestJS, ni `@angaly/storage`)
15. Les Controllers délèguent aux use-cases — zéro logique métier
16. DTOs validés avec class-validator (+ Zod pour les schémas de formulaires côté web)
17. Guards au niveau Controller — jamais dans les use-cases

### Angaly Pattern Studio (IA + Pattern Engine)

18. L'IA (`apps/ai-service`) peut produire la géométrie via un modèle génératif dédié pour les
    types de vêtements qu'il couvre (règle inversée le 2026-09-21). Un prototype existe
    (`apps/ai-service/ml/scripts/train_pattern_generator_model.py`, voir
    `docs/features/ai-model-settings.md`) mais **n'est pas branché en production** : il
    approxime le moteur sans l'égaler, et une géométrie non validée risque pièces mal
    formées, tissu gâché, vêtement raté. Tant qu'un modèle n'est pas validé et explicitement
    branché, `packages/pattern-engine` est la seule source de géométrie (ADR-005).
19. `packages/pattern-engine` reste déterministe et sans dépendance externe (source de vérité,
    repli/validation d'un futur modèle) — voir `.cursor/rules/007-pattern-engine.mdc`
20. `apps/ai-service` n'est appelé que par le module NestJS `ai-inference` — jamais depuis `apps/web`

### Médias

21. Tout média passe par MinIO via `@angaly/storage` — voir `.cursor/rules/009-storage-minio.mdc`

## Tests — dans le même commit que le code

| Ce qu'on implémente         | Test                                                     |
| --------------------------- | -------------------------------------------------------- |
| Hook frontend               | `__tests__/<hookName>.test.ts` (Vitest + Testing Library) |
| Composant UI interactif     | `__tests__/<ComponentName>.test.tsx`                     |
| Util / fonction pure        | `__tests__/<name>.test.ts`                               |
| Use case backend            | `__tests__/unit/<use-case>.spec.ts` (Jest)               |
| Controller backend          | `__tests__/integration/<controller>.spec.ts` (Supertest) |
| Règle pattern-engine        | `src/__tests__/<rule>.test.ts` (Vitest)                  |
| Endpoint ai-service         | `tests/test_<route>.py` (pytest)                         |
| Parcours critique (front)   | `apps/web/e2e/<feature>/<parcours>.spec.ts` (Playwright) |

Références : `apps/api/src/shared/health/` (Presentation-only),
`packages/pattern-engine/src/pattern-engine.ts` (règles enregistrées), `apps/ai-service/app/` + `tests/`.

Vérification (minimum 80 % de coverage) : `pnpm --filter @angaly/{api,web,pattern-engine} test:coverage`,
`make test.ai`, `pnpm --filter @angaly/web test:e2e`. Autres commandes courantes : `pnpm dev`,
`pnpm test`, `pnpm lint`, `pnpm typecheck`, `docker compose up -d`, `make dev.ai`. Slash commands
projet : `.claude/commands/`.
