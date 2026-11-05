# ANGALY — Règles pour tous les agents IA et développeurs (Monorepo)

Source **unique** des règles du dépôt : Claude Code la lit via `CLAUDE.md` (`@AGENTS.md`), les autres agents
(Antigravity, Cursor, Copilot, Gemini, Windsurf…) directement. Ne pas dupliquer ces règles ailleurs : modifier ce fichier.

Maison de couture numérique (vitrine, boutique, sur-mesure, espace client, back-office,
**Angaly Pattern Studio** — patron assisté par IA). Architecture et ADR : `docs/architecture.md`.

- `apps/web` — Next.js 15, App Router, React 19, Tailwind CSS 4
- `apps/api` — NestJS 11, Clean Architecture
- `apps/ai-service` — FastAPI (Python) — inférence IA pour Pattern Studio
- `packages/database` — Prisma 6, PostgreSQL 16
- `packages/types` — Types partagés TS (front/back + contrat ai-service)
- `packages/config` — Configs partagées (ESLint, TS, Vitest)
- `packages/storage` — Client MinIO (upload/presign/delete de tous les médias)
- `packages/pattern-engine` — Moteur de patronage géométrique déterministe

## Processus page/fonctionnalité (avant implémentation)

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
4. **Une phase (ou un lot de plan) par session** — jamais plusieurs. Skills (`.claude/skills/`, `.agents/skills/`) :
   **`start`** (début de chaque session : handoff + section du plan seulement), `new-feature`, `new-page-from-stitch`, `pattern-engine-rule`, `angaly-design-system`, **`pattern-generation`**
   (obligatoire pour toute génération / création de patron, analyse d'inspiration, rendu 3D d'un vêtement ou patron
   qui ne ressemble pas à son modèle).
5. Tests avec chaque implémentation (voir ci-dessous) ; tous doivent passer avant de clore.
6. Documenter : la fiche, et `docs/deployment.md`/`docs/development.md` si infra, variable
   d'env, port ou procédure de lancement changent.
7. Mettre à jour `docs/checklist-implementation.md` et `docs/mockup-reference.md`.
8. **Handoff (obligatoire)** : à chaque changement d'agent, à l'épuisement des tokens et en fin de session,
   mettre à jour `docs/handoff.md` **avant de clore** selon le format ci-dessous.

## Économie de contexte (tokens)

- **Lire par morceaux** : `mockup-reference.md`, `checklist-implementation.md`, les plans (`docs/plans/`) et les gros
  fichiers source (ex. `garment-model.ts`, 3 500 lignes) se lisent par grep puis `offset`/`limit`, jamais en entier.
  Pour un plan : §0 + le lot en cours seulement.
- **Retouche triviale** (typo, une classe, une ligne) : garder l'étape 1 (Stitch) et les tests, sauter 2–3 et 6–7
  sauf si le statut change.
- **Tests** : pendant le travail, seulement les tests de la zone touchée ; la suite complète + coverage une fois en
  fin de lot.
- **Archives non lues par défaut** : `docs/handoff-archive/`, `docs/checklist-archive.md` (y déplacer les items
  terminés de la checklist ; à créer au besoin). Y chercher avec grep si un historique est nécessaire.
- Sous-agents / recherches larges seulement quand la recherche couvre beaucoup de fichiers : chaque sous-agent repart
  de zéro et recharge du contexte.

## Handoff (`docs/handoff.md`)

**Quand** : contexte à ~70–80 %, fin de lot ou de phase, changement d'agent, fin de session.

**Format** — 150 lignes maximum, 5 rubriques fixes, **réécrites** à chaque passation (on n'empile pas les sessions) :

1. **État du dépôt** — branche, dernier commit, fichiers non commités, derniers résultats de tests.
2. **Dernière session** — 5 à 10 puces : ce qui a été fait, décisions, écarts au plan.
3. **Prochaines actions** — dans l'ordre, avec chemins de fichiers et **la section exacte** du plan à lire.
4. **Pièges encore actifs** — retirer ceux qui ne s'appliquent plus.
5. **Plans ouverts** — tableau plan / statut / section à lire.

**Agent sortant** :

1. `pnpm typecheck` + tests de la zone modifiée.
2. Déplacer l'ancienne rubrique 2 en haut de `docs/handoff-archive/<AAAA-MM>.md` (créer le fichier du mois au besoin),
   puis réécrire les 5 rubriques. Les détails longs (captures, mesures, ids de projets) vont dans la fiche
   `docs/pages|features/<slug>.md` ou dans le plan, et le handoff y renvoie.
3. Donner la consigne de reprise à l'utilisateur : ouvrir une nouvelle session (ou `/clear`) avec
   **`Lis docs/handoff.md et poursuis le travail selon les priorités définies.`**
   (Claude Code : `/start` fait la même chose.)

**Agent entrant** : lire `docs/handoff.md` seulement (pas l'archive), `git status --short`, puis la première
prochaine action et uniquement les fichiers qu'elle cite. Pour vérifier un travail déjà livré, contrôler le code
(routes, hooks, endpoints, tests) plutôt que re-comparer la maquette.

## Règles absolues

### Général

1. TypeScript strict — jamais `any`, jamais `@ts-ignore` sans explication ; `import type { … }` pour les types
2. Types partagés front/back/ai-service : toujours `@angaly/types`
3. Variables d'environnement via `process.env.XXX`, jamais hardcodées (ni URLs, ni secrets ; jamais de `.env` commité)
4. Conventional Commits (`feat(auth): add refresh token`) — scopes dans `commitlint.config.ts`
5. Tests obligatoires à chaque implémentation

### Frontend (apps/web)

6. Pages Next.js vides de logique — elles importent le composant racine d'une feature :
   `export default function Page() { return <HomePage />; }`
7. Feature-sliced : `src/features/<name>/{ui,hooks,api,schemas,consts,types,utils}` — `ui` présentationnel,
   `hooks` logique, `api` react-query via `@/lib/api-client`, `utils` fonctions pures
8. Composants UI purement présentationnels — logique dans les hooks
9. Vérifier l'écran Stitch réel (`agy` ou MCP Stitch) avant tout JSX/TSX/CSS/classes/styles (étape 1)
10. react-query pour tous les appels API — jamais de `fetch`/`axios` direct dans les composants
11. Zustand pour les états globaux (panier, favoris, sidebar admin), pas React Context
12. Zod pour la validation des formulaires
13. Design system (skill `.agents/skills/angaly-design-system/`) : `#061938` Deep Navy, `#F6F2E9` Ivory, `#936C3E`
    Antique Gold, `#C5B190` Champagne, règle 60-25-10-5 ; `font-heading` (Cormorant Garamond) pour les titres,
    `font-sans` (Inter) pour l'interface ; angles nets ou `rounded-sm`, jamais `rounded-xl`/`rounded-2xl`

### Backend (apps/api)

14. Clean Architecture stricte : Domain ← Application ← Infrastructure / Presentation
15. Le Domain et l'Application ne dépendent ni de Prisma, ni de NestJS, ni de `@angaly/storage`
16. Les Controllers délèguent aux use-cases — zéro logique métier ; Guards au niveau Controller, jamais dans les use-cases
17. DTOs validés avec class-validator (+ Zod pour les formulaires côté web)
18. Swagger : tout endpoint `@ApiOperation`, `@ApiResponse`, `@ApiBearerAuth('access-token')` si protégé ;
    tout champ DTO `@ApiProperty({ description, example })`. Logger NestJS, jamais `console.log` en production

### Angaly Pattern Studio (IA + Pattern Engine)

19. L'IA (`apps/ai-service`) peut produire la géométrie via un modèle génératif dédié pour les
    types de vêtements qu'il couvre (règle inversée le 2026-09-21). Un prototype existe
    (`apps/ai-service/ml/scripts/train_pattern_generator_model.py`, voir
    `docs/features/ai-model-settings.md`) mais **n'est pas branché en production** : il
    approxime le moteur sans l'égaler, et une géométrie non validée risque pièces mal
    formées, tissu gâché, vêtement raté. Tant qu'un modèle n'est pas validé et explicitement
    branché, `packages/pattern-engine` est la seule source de géométrie (ADR-005).
20. `packages/pattern-engine` reste déterministe et sans dépendance externe (source de vérité,
    repli/validation d'un futur modèle) — voir `.cursor/rules/007-pattern-engine.mdc`
21. `apps/ai-service` n'est appelé que par le module NestJS `ai-inference` — jamais depuis `apps/web`
22. `PatternAiSuggestionRequest`/`Response` restent synchronisés entre `packages/types/src/index.ts` et
    `apps/ai-service/app/schemas.py`

### Médias

23. Tout média passe par MinIO via `@angaly/storage` (module `media` uniquement) — jamais de stockage local ou en
    base — voir `.cursor/rules/009-storage-minio.mdc`

## Tests — dans le même commit que le code

| Ce qu'on implémente       | Test                                                      |
| ------------------------- | --------------------------------------------------------- |
| Hook frontend             | `__tests__/<hookName>.test.ts` (Vitest + Testing Library) |
| Composant UI interactif   | `__tests__/<ComponentName>.test.tsx`                      |
| Util / fonction pure      | `__tests__/<name>.test.ts`                                |
| Use case backend          | `__tests__/unit/<use-case>.spec.ts` (Jest)                |
| Controller backend        | `__tests__/integration/<controller>.spec.ts` (Supertest)  |
| Règle pattern-engine      | `src/__tests__/<rule>.test.ts` (Vitest)                   |
| Endpoint ai-service       | `tests/test_<route>.py` (pytest)                          |
| Parcours critique (front) | `apps/web/e2e/<feature>/<parcours>.spec.ts` (Playwright)  |

Références : `apps/api/src/shared/health/` (Presentation-only),
`packages/pattern-engine/src/pattern-engine.ts` (règles enregistrées), `apps/ai-service/app/` + `tests/`.

Vérification (minimum 80 % de coverage) : `pnpm --filter @angaly/{api,web,pattern-engine} test:coverage`,
`make test.ai`, `pnpm --filter @angaly/web test:e2e`. Autres commandes courantes : `pnpm dev`,
`pnpm test`, `pnpm lint`, `pnpm typecheck`, `docker compose up -d`, `make dev.ai`.
