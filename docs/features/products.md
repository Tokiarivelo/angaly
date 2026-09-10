# Feature — `products`

**Statut : ✅ Fait.** Phase 2 — Conversion.

## Objet

Catalogue prêt-à-porter (spec §11-12) : produits disponibles immédiatement, avec variantes
(taille/couleur/matière) et stock. Lecture seule côté public en Phase 2 ; l'ajout au panier
proprement dit (spec §14) est hors périmètre de ce module — voir Points d'attention — et la
gestion admin du catalogue (création/édition de `Product`) reste un besoin ADMIN non couvert
par une maquette Stitch dédiée à ce jour (même note de scope que `creations`).

## Emplacement Clean Architecture

`apps/api/src/products/`

```
domain/
  entities/product.entity.ts             → invariants métier (sku/slug non vides, prix positif)
  entities/product-variant.entity.ts     → invariants (taille/couleur non vides)
  repositories/product.repository.ts     → interface IProductRepository (zéro import Prisma)
  value-objects/price.vo.ts              → Decimal + devise, jamais un float brut
application/
  use-cases/
    list-products.use-case.ts            → filtres catégorie/taille/couleur/matière/statut/prix, tri, pagination
    get-product-by-slug.use-case.ts      → produit + variantes + inventaire + médias
    list-similar-products.use-case.ts    → même catégorie, produit courant exclu, limité
    check-variant-availability.use-case.ts → lecture Inventory pour une variante (consommé par `orders`/`reviews` en Phase 3)
  dtos/
    product-response.dto.ts
    product-variant-response.dto.ts
infrastructure/
  repositories/prisma-product.repository.ts → implémente IProductRepository via PrismaService
  mappers/product.mapper.ts                 → Prisma model → domain entity → DTO (agrège ProductVariant + Inventory)
presentation/
  controllers/products.controller.ts
__tests__/
  unit/list-products.use-case.spec.ts
  unit/get-product-by-slug.use-case.spec.ts
  integration/products.controller.spec.ts
```

## Modèles Prisma

`Product` (`sku`, `slug` uniques, `categoryId`, `atelierId?`, `price` `Decimal(12,2)`,
`currency`, `status` — enum `ProductAvailability`), `ProductVariant` (`sku` unique, `size`,
`color`, `material?`, `priceOverride?`), `Inventory` (`variantId` unique,
`quantityAvailable`, `quantityReserved`).

## Cas d'usage clés

- Lister les produits avec filtres (`categoryId`, `size`, `color`, `material`, `status`,
  `priceMin`/`priceMax`), tri et pagination offset/curseur (`PaginatedResponse<T>`)
- Récupérer un produit par `slug` avec ses variantes, leur inventaire et ses médias ordonnés
- Suggérer des produits similaires (même `categoryId`, produit courant exclu, ex. limite 4)
- Vérifier la disponibilité réelle d'une variante (`Inventory.quantityAvailable -
  quantityReserved`) — utilisé en interne par `orders` (Phase 3) avant confirmation d'achat,
  pas exposé publiquement comme écriture par ce module

## Endpoints exposés

| Méthode | Route | Use-case | Auth |
| --- | --- | --- | --- |
| `GET` | `/api/products?category=&size=&color=&material=&status=&priceMin=&priceMax=&sort=&page=` | `list-products` | Public |
| `GET` | `/api/products/:slug` | `get-product-by-slug` | Public |
| `GET` | `/api/products?category=&exclude=&limit=4` | `list-similar-products` (même endpoint, paramètres dédiés) | Public |

## Points d'intégration

- **`media`** : les URLs d'images passent par le module `media`/`packages/storage` — jamais
  une clé d'objet brute (voir `docs/features/media.md`).
- **`ateliers`** : `Product.atelierId` optionnel référence l'atelier de retrait (lecture
  seule, ce module n'écrit jamais dans `Atelier`).
- **`customers`** : les favoris produit (`Favorite.entityType = PRODUCT`) sont portés par
  `customers`, pas par ce module (voir `docs/features/customers.md`).
- **`orders`** (Phase 3) : `check-variant-availability` est le point d'entrée que `orders`
  doit utiliser avant de décrémenter `Inventory.quantityAvailable` à la confirmation d'une
  commande — ce module reste la seule source de vérité sur le stock.
- **`reviews`** (Phase 2) : `Review.productId` référence `Product` en lecture seule côté
  `reviews`.
- **Pages consommatrices** : `pret-a-porter-catalogue`, `fiche-produit`.

## Points d'attention

- Le panier (`POST /api/cart/items` référencé par `docs/pages/fiche-produit.md`) est
  volontairement **hors périmètre** de ce module : le découpage exact (sous-module de
  `products` vs. module `orders` dédié) est renvoyé à la session d'implémentation de Phase 3
  (`docs/phases/phase-3-production.md`), ce module expose uniquement la lecture du
  catalogue et la vérification de disponibilité.
- `Product.status` (statut merchandising global, ex. `LAST_PIECE`) et
  `Inventory.quantityAvailable`/`quantityReserved` (stock réel par variante) sont deux
  informations **distinctes et non dérivées automatiquement l'une de l'autre** dans le
  schéma actuel : `get-product-by-slug` doit renvoyer les deux sans supposer qu'un stock à
  zéro implique `status = OUT_OF_STOCK` — la cohérence entre les deux reste une décision
  éditoriale/admin tant qu'un job de recalcul automatique n'est pas spécifié.
- **`GET /api/products` sert aussi les produits similaires** (`exclude` + `categoryId`
  présents ensemble → `list-similar-products` au lieu de `list-products`, même route) — pas
  de route dédiée, conformément au tableau "Endpoints exposés" de cette fiche.
- **`check-variant-availability` n'a pas de route publique** : c'est un use-case injectable
  (`PRODUCT_REPOSITORY` et `CheckVariantAvailabilityUseCase` sont exportés par
  `ProductsModule`) que `orders` (Phase 3) appellera directement, comme prévu par "Points
  d'intégration" — pas un GET exposé.
- **`Price` (value object)** représente `amount` comme une chaîne décimale (jamais un
  float) : `ProductMapper` convertit le `Prisma.Decimal` en `.toString()` à la frontière
  infrastructure → domaine, une seule fois.

## Vérification

- [x] `list-products` testé (chaque filtre — catégorie/taille/couleur/matière/statut/prix —,
      tri, pagination) — `list-products.use-case.spec.ts`, `prisma-product.repository.spec.ts`
- [x] `get-product-by-slug` testé (cas trouvé/non trouvé, variantes + inventaire inclus,
      variante sans ligne `Inventory`) — `get-product-by-slug.use-case.spec.ts`,
      `product.mapper.spec.ts`
- [x] `check-variant-availability` testé (stock suffisant/insuffisant, quantité par défaut,
      variante inconnue) — `check-variant-availability.use-case.spec.ts`
- [x] `products.controller.spec.ts` couvre 200/400/404, y compris le basculement vers le
      mode "produits similaires"
- [x] `docs/checklist-implementation.md` : `products` passé à ✅
- [x] `pnpm --filter @angaly/api typecheck`, `lint`, `test` (412 tests) tous verts
- [ ] `docs/checklist-implementation.md` : `products` passé à ✅
