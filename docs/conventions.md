# Conventions — ANGALY

## Conventional Commits

Format : `<type>(<scope>): <description>`

> **Ces règles sont appliquées automatiquement** par les hooks Git (Husky + commitlint).
> Tout commit qui ne respecte pas le format est rejeté avant d'être enregistré.

### Types

| Type       | Usage                                             |
| ---------- | -------------------------------------------------- |
| `feat`     | Nouvelle fonctionnalité                            |
| `fix`      | Correction de bug                                  |
| `docs`     | Documentation uniquement                            |
| `style`    | Formatage (pas de changement de logique)            |
| `refactor` | Refactoring (pas de nouvelle feature ni bug fix)   |
| `perf`     | Amélioration de performance                         |
| `test`     | Ajout/modification de tests                         |
| `chore`    | Build, dépendances, config                          |
| `ci`       | Configuration CI/CD                                 |
| `revert`   | Annulation d'un commit                              |
| `wip`      | Travail en cours (à éviter sur `main`)              |

### Scopes autorisés

Définis dans `commitlint.config.ts` à la racine. Un scope hors liste provoque un rejet.

| Scope             | Périmètre                                              |
| ------------------ | -------------------------------------------------------- |
| `web`               | Application Next.js (`apps/web`)                        |
| `api`               | Application NestJS (`apps/api`)                          |
| `ai-service`        | Microservice FastAPI (`apps/ai-service`)                 |
| `database`          | Prisma, migrations, seeds (`packages/database`)          |
| `types`             | Types partagés (`packages/types`)                        |
| `config`            | Configs partagées (`packages/config`)                    |
| `storage`           | Client MinIO (`packages/storage`)                         |
| `pattern-engine`    | Moteur de patronage géométrique (`packages/pattern-engine`) |
| `auth`, `users`, `customers`, `ateliers`, `appointments`, `creations`, `collections`, `products`, `orders`, `payments`, `quotes`, `measurements`, `patterns`, `ai-inference`, `reviews`, `blog`, `notifications`, `media`, `search`, `i18n` | Un module backend/feature par nom |
| `docker`            | Dockerfiles, docker-compose, images                       |
| `ci`                | Pipelines CI/CD                                           |
| `deps`              | Mise à jour de dépendances                                |
| `release`           | Commits de release                                        |

### Exemples

```
feat(appointments): add availability calendar API
fix(pattern-engine): validate required measurements before computing pieces
test(media): add integration tests for presigned upload flow
chore(deps): update prisma to 6.5.0
docs(pages): document the pattern-studio-wizard component tree
```

---

## Hooks Git

Gérés par **Husky**, installés automatiquement via `pnpm install` (script `prepare`).

| Fichier             | Déclencheur  | Action                                                      |
| ------------------- | ------------ | ------------------------------------------------------------ |
| `.husky/commit-msg` | `git commit` | Valide le message avec **commitlint**                        |
| `.husky/pre-commit` | `git commit` | Formate les fichiers stagés avec **lint-staged** (Prettier)  |
| `.husky/pre-push`   | `git push`   | Lance `turbo lint` + `turbo typecheck` sur tout le monorepo   |

## Naming Conventions

### TypeScript — Général

- **Classes** : PascalCase → `PatternEngine`, `CreationEntity`
- **Interfaces** : PascalCase avec `I` prefix pour les repositories/moteurs → `IUserRepository`, `IPatternRule`
- **Types** : PascalCase → `PatternParameters`
- **Enums** : PascalCase → `Role.CLIENT`, `PatternStatus.VALIDATED`
- **Constantes** : SCREAMING_SNAKE_CASE → `QUERY_KEYS`, `STORAGE_BUCKETS`
- **Fonctions** : camelCase → `formatPriceAriary()`
- **Variables** : camelCase → `isLoading`, `currentCustomer`

### Fichiers

- **Components React** : PascalCase → `LoginForm.tsx`, `PatternPieceCanvas.tsx`
- **Hooks** : camelCase avec `use` prefix → `useLogin.ts`, `usePatternWizard.ts`
- **Services NestJS** : kebab-case → `jwt.service.ts`
- **Use Cases** : kebab-case avec `.use-case.ts` → `create-appointment.use-case.ts`
- **Guards** : kebab-case avec `.guard.ts` → `jwt.guard.ts`
- **Pattern rules** : kebab-case avec `.rule.ts` → `robe-mariee-princesse.rule.ts`
- **Tests** : même nom + `.test.ts`/`.test.tsx` (web/pattern-engine) ou `.spec.ts` (api)
- **Python** : snake_case → `schemas.py`, `test_pattern_suggestions.py`

### Répertoires

- **Features frontend** : kebab-case → `pattern-studio/`, `appointments/`
- **Modules backend** : kebab-case → `pattern-engine/`, `ai-inference/`

## Conventions React

### Composants

- Un fichier = un composant exporté
- Props typées avec interface → `interface LoginFormProps { ... }`

### Hooks

- Toujours commencer par `use`
- Retourner un objet nommé (pas un tableau)

```typescript
// ✅ Bon
export function useLogin() {
  return { login, isLoading, error, clearError };
}

// ❌ Éviter
export function useLogin() {
  return [login, isLoading, error];
}
```

## Structure d'imports

Ordre des imports (appliqué par Prettier, voir `.prettierrc`) :

1. `react`, `next`
2. Packages tiers
3. `@angaly/*` (packages internes)
4. `@/*` (alias local)
5. Imports relatifs

## Gestion des erreurs

### Frontend

- `ApiError` (`@/lib/api-client`) pour les erreurs API
- Afficher via un toast/alerte, jamais `console.error` en prod
- Erreurs de formulaire via `react-hook-form` + Zod

### Backend

- `HttpExceptionFilter` global (`apps/api/src/shared/filters/`) pour formater toutes les erreurs
- Toujours jeter des `HttpException` NestJS
- Logger avec `this.logger = new Logger(ClassName.name)`

### apps/ai-service (Python)

- Toujours des réponses Pydantic typées (`app/schemas.py`), jamais un dict brut
- `HTTPException` de FastAPI pour les erreurs, jamais un code 200 avec un champ `error`
