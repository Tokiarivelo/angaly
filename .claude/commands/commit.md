Crée un commit Conventional Commits pour les changements en cours dans le projet ANGALY.

Étapes :

1. `git status` pour voir les fichiers modifiés/non trackés
2. `git diff` pour analyser le contenu des changements
3. Détermine automatiquement :
   - **type** : feat / fix / refactor / test / docs / chore / perf / style / ci
   - **scope** : voir la liste dans `commitlint.config.ts` (web / api / ai-service / database /
     types / config / storage / pattern-engine / auth / users / customers / ateliers /
     appointments / creations / collections / products / orders / payments / quotes /
     measurements / patterns / ai-inference / reviews / blog / notifications / media /
     search / i18n / docker / ci / deps / release)
   - **description** : courte (max 100 caractères), sans majuscule initiale

Format : `type(scope): description`

Exemples :

- `feat(appointments): add availability calendar API`
- `fix(pattern-engine): validate required measurements before computing pieces`
- `feat(media): wire presigned upload flow to MinIO`
- `docs(phases): mark phase-1 pages as in progress`

Ajoute un corps si les changements sont complexes (expliquer le POURQUOI, pas le QUOI).

N'inclut PAS dans le commit :

- `.env`, `.env.local`, ou tout fichier contenant des secrets
- `node_modules/`, `apps/ai-service/.venv/`
- Fichiers de build (`.next/`, `dist/`, `packages/database/generated/`)

Après avoir proposé le message, demande confirmation avant de commiter.
Si l'argument est "push" : propose aussi de pousser après le commit.
