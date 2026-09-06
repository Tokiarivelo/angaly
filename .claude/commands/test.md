Lance les tests avec coverage pour le projet ANGALY.

Si l'argument est "web" ou "front" : tests frontend seulement.
Si l'argument est "api" ou "back" : tests backend seulement.
Si l'argument est "ai" : tests `apps/ai-service` (pytest).
Si l'argument est "pattern-engine" : tests `packages/pattern-engine`.
Si l'argument est "e2e" : tests end-to-end Playwright (nécessite l'api + la base démarrées, ex. `make dev`).
Si aucun argument : lance tous les tests Node (turbo) — rappelle que `make test.ai` est séparé (hors turborepo).

Commandes :

- Tous (Node) : `pnpm test:coverage`
- Frontend seulement : `pnpm --filter @angaly/web test:coverage`
- Backend seulement : `pnpm --filter @angaly/api test:coverage`
- Pattern engine : `pnpm --filter @angaly/pattern-engine test:coverage`
- AI service : `make test.ai` (pytest --cov=app)
- E2E (Playwright) : `pnpm --filter @angaly/web test:e2e`

Après les tests :

1. Affiche le résumé coverage par package (statements, branches, functions, lines).
2. Signale les fichiers sous le seuil de 80%.
3. Si des tests échouent, montre les erreurs et propose des corrections.
4. Rappelle les fichiers récemment modifiés qui n'ont pas de test associé.

## Rappel — règle tests (voir `.cursor/rules/004-testing.mdc`)

Tout code fonctionnel livré doit avoir ses tests dans le même commit :

| Type                       | Fichier de test                              |
| --------------------------- | --------------------------------------------- |
| Hook frontend                | `__tests__/<hookName>.test.ts`               |
| Composant UI interactif      | `__tests__/<ComponentName>.test.tsx`         |
| Use case backend             | `__tests__/unit/<use-case>.spec.ts`          |
| Controller backend           | `__tests__/integration/<controller>.spec.ts` |
| Règle `@angaly/pattern-engine` | `src/__tests__/<rule>.test.ts`             |
| Endpoint `apps/ai-service`   | `tests/test_<route>.py`                       |

Référence complète : `apps/api/src/shared/health/__tests__/health.controller.spec.ts` et
`packages/pattern-engine/src/__tests__/pattern-engine.test.ts`.
