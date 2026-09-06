# Feature — `collections`

**Statut : ⬜ À faire.** Phase 1 — Présence digitale.

## Objet

Catalogue des collections saisonnières de la maison (regroupements thématiques de
`Creation`, avec un récit éditorial propre). Lecture seule côté public en Phase 1 ; l'édition
des textes de mise en avant passe par `docs/features/content.md` en Phase 6.

## Emplacement Clean Architecture

`apps/api/src/collections/`

```
domain/
  entities/collection.entity.ts        → invariants métier (slug non vide, publicité dérivée de publishedAt)
  repositories/collection.repository.ts → interface ICollectionRepository (zéro import Prisma)
application/
  use-cases/
    list-collections.use-case.ts       → filtre seasonYear, pagination, exclut les collections non publiées
    get-collection-by-slug.use-case.ts → avec ses créations et ses médias ordonnés
  dtos/collection-response.dto.ts
infrastructure/
  repositories/prisma-collection.repository.ts → implémente ICollectionRepository via PrismaService
  mappers/collection.mapper.ts                 → Prisma model → domain entity → DTO
presentation/
  controllers/collections.controller.ts
__tests__/
  unit/list-collections.use-case.spec.ts
  unit/get-collection-by-slug.use-case.spec.ts
  integration/collections.controller.spec.ts
```

## Modèles Prisma

`Collection` (relations : `Creation[]`, `Media[]` via `CollectionMedia`).

## Cas d'usage clés

- Lister les collections publiées (`publishedAt` non nul et passé), filtrables par
  `seasonYear`, pagination offset/curseur (`PaginatedResponse<T>` de `packages/types`)
- Récupérer une collection par `slug` avec ses créations associées (`Creation[]`) et ses
  médias ordonnés (`sortOrder`)
- Une collection dont `publishedAt` est `null` ou dans le futur n'apparaît jamais sur les
  endpoints publics (prévisualisation admin hors périmètre Phase 1, voir `content`)

## Endpoints exposés

| Méthode | Route | Use-case | Auth |
| --- | --- | --- | --- |
| `GET` | `/api/collections` | `list-collections` | Public |
| `GET` | `/api/collections/:slug` | `get-collection-by-slug` | Public |

## Points d'intégration

- **`creations`** : une collection agrège ses `Creation[]` par lecture directe de la
  relation Prisma ; ce module ne duplique pas la logique de filtrage/disponibilité déjà
  portée par `creations`.
- **`media`** : les URLs d'images passent par `packages/storage`'s `buildPublicUrl()`,
  jamais une clé d'objet brute.
- **Pages consommatrices** : `collections-liste`, `collection-detail`, `home` (mise en
  avant éventuelle d'une collection courante).

## Vérification

- [ ] `list-collections` testé (filtre `seasonYear`, exclusion des collections non
      publiées, pagination)
- [ ] `get-collection-by-slug` testé (cas trouvé/non trouvé, créations et médias inclus)
- [ ] `collections.controller.spec.ts` couvre les codes 200/404
- [ ] `docs/checklist-implementation.md` : `collections` passé à ✅
