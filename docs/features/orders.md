# Feature — `orders`

**Statut : ✅ Fait** (module backend). Phase 3 — Production.

## Objet

Transformation du panier en commande persistée et suivi de son cycle de vie (spec §97) :
`Order` → `OrderItem[]`, du statut `PENDING` jusqu'à `DELIVERED` (ou `CANCELLED`/`REFUNDED`).
Le panier lui-même (ajout/retrait d'articles avant commande) reste un état frontend volatile
(Zustand, voir `docs/pages/fiche-produit.md`) — `orders` ne gère que la commande une fois
créée.

## Emplacement Clean Architecture

`apps/api/src/orders/`

```
domain/
  entities/order.entity.ts             → invariants (total = subtotal + shippingCost) ; transitionTo() encode le cycle OrderStatus
  entities/order-item.entity.ts        → invariants (quantity > 0, unitPrice >= 0)
  repositories/order.repository.ts     → IOrderRepository (zéro import Prisma)
application/
  lib/resolve-customer-id.ts           → résout Customer.id depuis le userId du JWT (même pattern que quotes/patterns, dupliqué par module)
  use-cases/
    create-order-from-cart.use-case.ts → construit Order + OrderItem[] depuis un payload panier, réserve le stock atomiquement
    get-order.use-case.ts              → CLIENT (propriétaire) ou MANAGER/ADMIN (tout)
    list-customer-orders.use-case.ts   → CLIENT (ses commandes) ou MANAGER/ADMIN (toutes)
    update-order-status.use-case.ts    → transition contrôlée via Order.transitionTo(), jamais un statut arbitraire
    cancel-order.use-case.ts           → uniquement tant que PENDING/CONFIRMED (encodé dans transitionTo())
  dtos/
    create-order-request.dto.ts, update-order-status-request.dto.ts, order-response.dto.ts
infrastructure/
  repositories/prisma-order.repository.ts
  mappers/order.mapper.ts              → toDomain() + toResponseDto() (Decimal ↔ number ↔ "xx.xx" string)
presentation/
  controllers/orders.controller.ts     → JwtAuthGuard partout, RolesGuard+@Roles('MANAGER','ADMIN') sur PATCH :id/status
__tests__/
  unit/order.entity.spec.ts, order-item.entity.spec.ts, resolve-customer-id.spec.ts,
  unit/create-order-from-cart.use-case.spec.ts, get-order.use-case.spec.ts,
  unit/list-customer-orders.use-case.spec.ts, update-order-status.use-case.spec.ts,
  unit/cancel-order.use-case.spec.ts, order.mapper.spec.ts, prisma-order.repository.spec.ts
  integration/orders.controller.spec.ts
```

## Modèles Prisma

`Order`, `OrderItem` (+ enum `OrderStatus`) ; relations `Customer`, `ProductVariant` (via
`OrderItem`), `Payment[]` (lecture pour dériver le statut de paiement affiché).

## Cas d'usage clés

- Créer une commande depuis le panier : vérifier `Inventory.quantityAvailable` par variante,
  réserver le stock, calculer `subtotal`/`shippingCost`/`total`
- Lister les commandes d'un client (ou, côté back-office, toutes les commandes filtrées)
- Faire transiter le statut selon des règles strictes (ex. le passage à `PAID` est piloté par
  `payments`, jamais directement par le client)
- Annuler une commande tant qu'elle est `PENDING`/`CONFIRMED`

## Endpoints exposés

| Méthode | Route | Use-case | Auth |
| --- | --- | --- | --- |
| `POST` | `/api/orders` | `create-order-from-cart` | `CLIENT` |
| `GET` | `/api/orders/:id` | `get-order` | `CLIENT` (propriétaire) ou `MANAGER`/`ADMIN` |
| `GET` | `/api/orders` | `list-customer-orders` | `CLIENT` (ses commandes) ou `MANAGER`/`ADMIN` (toutes) |
| `PATCH` | `/api/orders/:id/status` | `update-order-status` | `MANAGER`/`ADMIN` (ou déclenchement interne par `payments`) |
| `POST` | `/api/orders/:id/cancel` | `cancel-order` | `CLIENT` (propriétaire, si annulable) |

## Points d'intégration

- **`products`** : lecture de `ProductVariant`/`Inventory` pour vérifier et réserver le stock au
  moment de `create-order-from-cart` — décrémentation de `quantityAvailable` dans une transaction
  Prisma unique pour éviter la survente en cas de commandes concurrentes.
- **`payments`** : le passage au statut `PAID` est déclenché par `payments` (jamais l'inverse) —
  le Domain d'`orders` reste agnostique du moyen de paiement utilisé. `confirm-payment`/
  `refund-payment` (module `payments`) injectent `ORDER_REPOSITORY_TOKEN` depuis `OrdersModule`
  et transitionnent la commande via `Order.transitionTo()`, jamais une écriture de statut brute
  — voir `docs/features/payments.md`.
- **`notifications`** : `create-order-from-cart` et `update-order-status` émettent
  `ORDER_STATUS_CHANGED` via `CreateNotificationUseCase` (jamais une écriture directe dans la
  table `Notification`) — **câblé** (session 2026-09-15, voir `docs/features/notifications.md`).
  Best-effort : un échec de notification ne fait jamais échouer la création/transition de la
  commande elle-même.
- **`customers`** : relation `Customer` propriétaire de la commande, résolue depuis le JWT via
  `resolveCustomerId()`.

## Points d'attention

- Le panier (ajout/retrait d'articles avant validation) vit côté frontend — `orders` ne
  persiste que la commande une fois "passée", pas les états intermédiaires du panier.
- **Réservation de stock atomique** : `create-order-from-cart` utilise un `inventory.updateMany`
  conditionné sur `quantityAvailable >= quantity` (jamais un `findUnique` puis `update` séparés)
  — la réévaluation du `WHERE` sous le verrou de ligne que Postgres prend pour l'`UPDATE`
  garantit qu'une deuxième commande concurrente sur le dernier exemplaire d'une variante ne peut
  jamais aboutir en même temps que la première (`count: 0` côté perdant).
- **Trouvé en reprenant ce module** (il existait déjà en squelette 🟡, jamais exécuté de bout en
  bout) : le calcul du prix unitaire lisait `variant.price`, un champ qui n'existe pas sur
  `ProductVariant` (seul `ProductVariant.priceOverride` existe, le prix "de base" vit sur
  `Product.price`) — chaque commande créée avant ce correctif aurait eu un `subtotal: NaN`.
  Corrigé : `variant.priceOverride ?? variant.product.price`. Le contrôleur passait aussi
  directement `req.user.sub` (le `User.id` du JWT) comme `Order.customerId`, alors que ce champ
  référence `Customer.id` — corrigé via `resolveCustomerId()` (même pattern que `quotes`).
- **`payments` a été repris dans une session suivante** (guards d'authentification ajoutés,
  `confirm-payment`/`refund-payment` branchés sur `Order.transitionTo()`, module testé de bout
  en bout) — voir `docs/features/payments.md`.

## Vérification

- [x] `create-order-from-cart` testé avec stock suffisant et insuffisant (rejet propre, aucune
      commande partielle créée), y compris la réservation atomique et le calcul du prix
      (`priceOverride` vs prix produit) — `create-order-from-cart.use-case.spec.ts`
- [x] `update-order-status` testé pour les transitions valides et invalides du cycle `OrderStatus`
      — `update-order-status.use-case.spec.ts`, `order.entity.spec.ts`
- [x] Ownership testé (un `CLIENT` ne peut pas accéder à/annuler la commande d'un autre ; un
      `MANAGER`/`ADMIN` le peut) — `get-order.use-case.spec.ts`, `cancel-order.use-case.spec.ts`,
      `list-customer-orders.use-case.spec.ts`
- [x] `orders.controller.spec.ts` couvre 200/201/400/401/403/404 sur les 5 routes
- [x] `pnpm --filter @angaly/api typecheck`, `pnpm --filter @angaly/api exec eslint src/orders`
      (0 erreur) et `pnpm --filter @angaly/api exec jest src/orders` (68 tests) tous verts
- [x] `docs/checklist-implementation.md` : module backend `orders` passé à ✅ (les 6 pages
      consommatrices — `panier`, `checkout`, etc. — restent 🟡, non câblées à cette API dans
      cette session)
