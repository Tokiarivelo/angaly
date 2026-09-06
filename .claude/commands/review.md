Effectue une revue de code approfondie des changements en cours dans le projet ANGALY.

Étapes :

1. `git diff --stat` pour voir les fichiers modifiés
2. `git diff` pour le contenu complet des changements

Pour chaque fichier modifié, vérifie :

**Frontend (apps/web/)**

- [ ] Les pages n'ont pas de logique (uniquement l'import du composant racine d'une feature)
- [ ] Les composants `ui/` sont purement présentationnels
- [ ] Toute la logique est dans les hooks, pas dans les composants
- [ ] Les appels API passent par react-query dans `api/`, jamais `fetch` direct
- [ ] Les schémas Zod sont définis dans `schemas/`
- [ ] Les nouveaux composants/hooks ont des tests

**Backend (apps/api/)**

- [ ] Le Domain ne dépend pas de Prisma, NestJS, ni `@angaly/storage`
- [ ] Les Controllers délèguent aux use-cases sans logique métier
- [ ] Les DTOs utilisent class-validator + décorateurs Swagger
- [ ] Les nouveaux use-cases ont des tests unitaires, les controllers des tests d'intégration
- [ ] Les guards sont au niveau Controller

**Angaly Pattern Studio (packages/pattern-engine, apps/ai-service, ai-inference)**

- [ ] Aucune géométrie de patron n'est produite côté `apps/ai-service` (suggestions de
      paramètres uniquement)
- [ ] `packages/pattern-engine` reste sans dépendance externe (pas de Prisma/NestJS/réseau)
- [ ] `PatternAiSuggestionRequest`/`Response` restent synchronisés entre
      `packages/types/src/index.ts` et `apps/ai-service/app/schemas.py`

**Médias (packages/storage)**

- [ ] Aucun import direct du client `minio` en dehors de `packages/storage`
- [ ] Tout nouveau média a un `altText`

**Général**

- [ ] Pas de `any` TypeScript non justifié
- [ ] Pas de credentials ou clés hardcodées
- [ ] Conventional commits respectés (voir `commitlint.config.ts` pour les scopes)
- [ ] Types partagés utilisés depuis `@angaly/types`, pas redéfinis localement

**Traçabilité (`docs/mockup-reference.md` et `docs/checklist-implementation.md`)**

- [ ] La page/le module concerné a bien une ligne dans `docs/mockup-reference.md`
- [ ] Le changement correspond à ce que décrit la maquette Stitch référencée sur cette ligne
- [ ] `docs/checklist-implementation.md` a été mis à jour si le statut a changé
- [ ] `docs/deployment.md`/`docs/development.md` ont été mis à jour si le changement touche
      l'infra, une variable d'environnement, ou la procédure de lancement

Présente le rapport sous forme de checklist avec ✅ / ❌ / ⚠️ et des suggestions concrètes
pour chaque problème trouvé.
