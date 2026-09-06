# Feature — `creations`

**Statut : ✅ Fait.** Phase 1 — Présence digitale.

## Objet

Catalogue des réalisations uniques de la maison (créations pièce-unique, pas le
prêt-à-porter — voir `products` pour ça). Lecture seule côté public en Phase 1 ; l'édition
passe par `docs/features/content.md` en Phase 6 pour les textes de mise en avant, mais la
création/suppression de fiches `Creation` reste un besoin ADMIN non couvert par une maquette
Stitch dédiée à ce jour (voir la note de scope dans `docs/phases/phase-6-admin-cms.md`).

## Emplacement Clean Architecture

`apps/api/src/creations/`

```
domain/
  entities/creation.entity.ts        → invariants métier (slug non vide, disponibilité valide)
  repositories/creation.repository.ts → interface ICreationRepository (zéro import Prisma)
  value-objects/availability.vo.ts
application/
  use-cases/
    list-creations.use-case.ts       → filtre catégorie/collection/featured, pagination
    get-creation-by-slug.use-case.ts
  dtos/creation-response.dto.ts
infrastructure/
  repositories/prisma-creation.repository.ts  → implémente ICreationRepository via PrismaService
  mappers/creation.mapper.ts                  → Prisma model → domain entity → DTO
presentation/
  controllers/creations.controller.ts
  decorators/ (aucun spécifique à ce module pour l'instant)
__tests__/
  unit/list-creations.use-case.spec.ts
  integration/creations.controller.spec.ts
```

## Modèles Prisma

`Creation` (relations : `Category`, `Collection?`, `Media[]` via `CreationMedia`,
`Favorite[]`, `Quote[]`).

## Cas d'usage clés

- Lister les créations avec filtres `categoryId`, `collectionId`, `isFeatured`, pagination
  offset/curseur (voir `packages/types`' `PaginatedResponse<T>`)
- Récupérer une création par `slug` avec ses médias ordonnés
- (Hors Phase 1) Marquer une création "à la une" avec fenêtre `featuredFrom`/`featuredUntil`

## Endpoints exposés

| Méthode | Route | Use-case | Auth |
| --- | --- | --- | --- |
| `GET` | `/api/creations` | `list-creations` | Public |
| `GET` | `/api/creations/:slug` | `get-creation-by-slug` | Public |

## Points d'intégration

- **`media`** : les URLs d'images retournées passent par `packages/storage`'s
  `buildPublicUrl()`, jamais une clé d'objet brute.
- **Pages consommatrices** : `home` (créations vedettes), `nos-creations-galerie`,
  `creation-detail`, `collection-detail` (créations d'une collection).
- **`favorites`** (modèle `Favorite`, porté par le module `customers`) : le compteur/état
  favori sur `creation-detail` dépend de Phase 2, ne pas bloquer Phase 1 dessus — exposer le
  DTO sans le champ `isFavorite` tant que `customers` n'existe pas, l'ajouter ensuite sans
  breaking change (champ optionnel).

## Vérification

- [x] `list-creations` et `get-creation-by-slug` testés unitairement (cas trouvé/non trouvé/filtres)
- [x] `creations.controller.spec.ts` couvre les codes 200/400 (validation `sort`)/404
- [x] Toutes les requêtes Prisma utilisent `select` explicite (`CREATION_DETAIL_SELECT`,
      partagé entre `list` et `findBySlug` — pas de `include` non scopé)
- [x] Testé manuellement de bout en bout contre Postgres réel (insertion SQL temporaire,
      `GET /api/creations` + filtres + `GET /api/creations/:slug` + 404, nettoyage après)
- [x] `docs/checklist-implementation.md` : `creations` passé à ✅

## Note d'implémentation

`sort` accepte `newest` (défaut, `createdAt desc`), `featured` (`isFeatured desc` puis
`createdAt desc`) et `featuredFrom` (`featuredFrom desc` puis `createdAt desc`, ajouté pour
`docs/pages/la-une.md` — tri par date de mise en avant plutôt que par simple booléen). Le DTO
de réponse n'a pas de champ `isFavorite` (voir "Points d'intégration" ci-dessus — dépend de
`customers`/Phase 2).
