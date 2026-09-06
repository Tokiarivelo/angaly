Build le projet ANGALY pour la production.

Si l'argument est "web" : build uniquement le frontend.
Si l'argument est "api" : build uniquement le backend.
Si l'argument est "ai" : vérifie `apps/ai-service` (pas de build — Python n'a rien à
compiler ; lance plutôt `ruff check` et `mypy` pour valider avant l'image Docker).
Si aucun argument : build complet via Turborepo (web + api + packages).

Étapes du build complet (Node) :

1. Type-check : `pnpm typecheck`
2. Lint : `pnpm lint`
3. Tests : `pnpm test`
4. Build : `pnpm build`

Build individuel :

- Frontend : `pnpm --filter @angaly/web build`
- Backend : `pnpm --filter @angaly/api build`
- Types (prérequis des deux) : `pnpm --filter @angaly/types build`

Après le build :

- Affiche la taille du bundle Next.js (`.next/`) et du dist NestJS (`dist/`)
- Signale les warnings (chunks trop lourds, pages lentes)
- Affiche le temps total de build

En cas d'erreur : montre les erreurs complètes et propose des corrections.
