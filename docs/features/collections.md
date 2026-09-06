# Feature — `collections`

**Statut : ✅ Fait.** Phase 1 — Présence digitale.

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

- [x] `list-collections` testé (filtre `seasonYear`, exclusion des collections non
      publiées, pagination, tri)
- [x] `get-collection-by-slug` testé (cas trouvé/non trouvé/non publiée, créations et
      médias inclus)
- [x] `collections.controller.spec.ts` couvre les codes 200/400 (validation `sort`)/404
- [x] Testé manuellement de bout en bout contre Postgres réel : une collection publiée et
      une non publiée insérées, seule la publiée apparaît sur `GET /api/collections` et
      `GET /api/collections/:slug` (404 sur la non publiée), nettoyage après
- [x] `docs/checklist-implementation.md` : `collections` passé à ✅

## Note d'implémentation

- `sort` accepte `seasonYear:asc|desc` et `publishedAt:asc|desc` (défaut
  `publishedAt:desc`), au format `champ:direction` comme documenté dans
  `docs/pages/collections-liste.md`.
- Le DTO de liste (`CollectionResponseDto`) expose `creationsCount` (`_count.creations`
  Prisma) et **jamais** le tableau `Creation[]` complet ; seul le DTO de détail
  (`CollectionDetailResponseDto`, `GET /api/collections/:slug`) inclut `creations`, avec
  pour chacune un `coverImageUrl` dérivé de son premier média (`sortOrder` asc) — conforme
  à la remarque de `docs/pages/collections-liste.md` sur le compteur de la bannière.
- "Publiée" est dérivé de `publishedAt` (non nul et passé), jamais un flag stocké — appliqué
  au niveau du repository pour `list` et `findPublishedBySlug`, donc impossible d'oublier le
  filtre dans un futur appelant.
