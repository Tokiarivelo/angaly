# ANGALY — Règles pour les AI Assistants

Ce fichier s'applique à GitHub Copilot, Gemini Code Assist, Cursor, Antigravity, Windsurf,
et tout autre assistant IA.

## Processus de traitement d'une page/fonctionnalité

**Avant toute implémentation**, suivre ces étapes dans l'ordre :

0. **Ouvrir `docs/mockup-reference.md`** — référence croisée obligatoire Page ↔ Maquette
   Stitch ↔ Section de spécification ↔ Phase.
1. **Consulter la maquette Stitch** référencée (projet
   https://stitch.withgoogle.com/projects/3703874896720765754, prompt source dans
   `stitch-prompts/`).
2. **Consulter `docs/checklist-implementation.md`** pour situer l'élément dans le périmètre
   global et connaître son statut actuel.
3. **Ouvrir `docs/pages/<slug>.md`** (frontend) ou **`docs/features/<slug>.md`** (backend),
   et la fiche de phase correspondante dans `docs/phases/`.
4. **Traiter une phase par session** — jamais tout le périmètre en un seul passage.
5. **Ajouter les tests à chaque implémentation** — Vitest (web/pattern-engine) / Jest (api) /
   pytest (ai-service) + Playwright pour les parcours critiques frontend.
6. **Vérifier systématiquement que tous les tests passent** avant de considérer terminé.
7. **Documenter** une fois terminé — comportement, usage, et toujours mettre à jour
   `docs/deployment.md`/`docs/development.md` si le changement touche l'infrastructure.
8. **Mettre à jour `docs/checklist-implementation.md`** pour refléter le nouveau statut.

## Architecture du projet

### Monorepo

- `apps/web` — Next.js 15, React 19, TypeScript 5.6, Tailwind CSS 4
- `apps/api` — NestJS 11, Clean Architecture
- `apps/ai-service` — FastAPI (Python) — inférence IA pour Angaly Pattern Studio
- `packages/database` — Prisma 6 + PostgreSQL 16
- `packages/types` — Types partagés front/back/ai-service
- `packages/config` — Configs partagées
- `packages/storage` — Client MinIO (tous les médias)
- `packages/pattern-engine` — Moteur de patronage géométrique déterministe

## Règles Frontend (apps/web)

### RÈGLE ABSOLUE : Les pages Next.js n'ont PAS de logique

```tsx
// ✅ Correct
import { HomePage } from '@/features/home';

export default function Page() {
  return <HomePage />;
}
```

### Structure d'une feature

```
features/<name>/
  ui/       → composants présentationnels (props → JSX)
  hooks/    → logique métier (useState, appels, router.push)
  api/      → react-query queries et mutations (via @/lib/api-client)
  schemas/  → validation Zod
  consts/   → constantes, query keys
  types/    → types locaux
  utils/    → fonctions pures
```

### Store global

**Zustand** pour les états globaux (panier, favoris, sidebar admin). Ne pas utiliser React
Context pour cet usage.

### Appels API

Uniquement via **react-query** (`useQuery`, `useMutation`) dans le dossier `api/`, qui
appelle `@/lib/api-client` — jamais `fetch` ou `axios` directs ailleurs.

## Règles Backend (apps/api)

### Clean Architecture — Flux de dépendances

```
Domain ← Application ← Infrastructure
                    ← Presentation
```

- **Domain** : zéro import Prisma, zéro import NestJS, zéro import `@angaly/storage`
- **Application** : use-cases, injecte uniquement des interfaces Domain
- **Infrastructure** : implémente les repos avec Prisma, les services avec MinIO/HTTP
- **Presentation** : controllers délèguent aux use-cases

### Swagger — Documentation obligatoire

Tout endpoint : `@ApiOperation`, `@ApiResponse`, `@ApiBearerAuth('access-token')` si protégé.
Tout champ DTO : `@ApiProperty({ description, example })`.

## Règles Angaly Pattern Studio

- `apps/ai-service` (Python/FastAPI) suggère des **paramètres**, ne produit jamais de
  géométrie de patron — c'est le rôle de `packages/pattern-engine` (déterministe, TypeScript
  pur, zéro dépendance externe)
- `apps/ai-service` n'est appelé que par le module NestJS `ai-inference` — jamais
  directement depuis `apps/web`
- `PatternAiSuggestionRequest`/`Response` doivent rester synchronisés entre
  `packages/types/src/index.ts` (TypeScript) et `apps/ai-service/app/schemas.py` (Pydantic)

## Règles Médias

Toute image/vidéo passe par MinIO via `@angaly/storage` (module `media` uniquement) —
jamais de stockage local ou en base de données.

## Règles communes

### TypeScript

- Strict mode — jamais `any`
- Imports de types avec `import type { ... }`
- Utiliser `@angaly/types` pour les types partagés

### Tests

- Coverage minimum : 80%
- Frontend/pattern-engine : Vitest + Testing Library
- Backend : Jest + @nestjs/testing + Supertest
- AI service : pytest + FastAPI TestClient

### Commits

- Format Conventional Commits : `feat(scope): description`
- Scopes : voir `commitlint.config.ts`

## Ne jamais faire

1. Mettre de la logique dans les pages Next.js
2. Importer Prisma ou `@angaly/storage` directement dans le Domain ou l'Application
3. Mettre de la logique métier dans les Controllers NestJS
4. Hardcoder des URLs ou des secrets
5. Utiliser `console.log` en production (Logger NestJS côté api)
6. Committer des fichiers `.env`/`.env.local`
7. Utiliser `any` TypeScript sans justification
8. Faire produire de la géométrie de patron par `apps/ai-service`
9. Appeler le client MinIO en dehors de `packages/storage`/du module `media`
