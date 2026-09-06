# Feature — `orders`

**Statut : ⬜ À faire.** Phase 3 — Production.

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
  entities/order.entity.ts             → invariants (total = subtotal + shippingCost, devise cohérente)
  entities/order-item.entity.ts
  repositories/order.repository.ts     → IOrderRepository (zéro import Prisma)
  value-objects/order-status.vo.ts     → transitions valides du cycle OrderStatus
application/
  use-cases/
    create-order-from-cart.use-case.ts → construit Order + OrderItem[] depuis un payload panier, vérifie/réserve le stock
    get-order.use-case.ts
    list-customer-orders.use-case.ts
    update-order-status.use-case.ts    → transition contrôlée (jamais un statut arbitraire)
    cancel-order.use-case.ts           → uniquement tant que PENDING/CONFIRMED
  dtos/
infrastructure/
  repositories/prisma-order.repository.ts
  mappers/order.mapper.ts
presentation/
  controllers/orders.controller.ts
  guards/ (propriétaire de la commande, ou MANAGER/ADMIN)
__tests__/
  unit/create-order-from-cart.use-case.spec.ts
  unit/update-order-status.use-case.spec.ts
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
  le Domain d'`orders` reste agnostique du moyen de paiement utilisé.
- **`notifications`** : émettre un événement `ORDER_STATUS_CHANGED` à chaque transition de
  statut, via le service exporté du module `notifications` (jamais une écriture directe dans la
  table `Notification`).
- **`customers`** : relation `Customer` propriétaire de la commande.

## Points d'attention

- Le panier (ajout/retrait d'articles avant validation) vit côté frontend — `orders` ne
  persiste que la commande une fois "passée", pas les états intermédiaires du panier.
- La vérification/réservation de stock doit être atomique : deux commandes concurrentes sur le
  dernier exemplaire d'une variante ne doivent jamais aboutir toutes les deux.

## Vérification

- [ ] `create-order-from-cart` testé avec stock suffisant et insuffisant (rejet propre, aucune commande partielle créée)
- [ ] `update-order-status` testé pour les transitions valides et invalides du cycle `OrderStatus`
- [ ] Guard "propriétaire de la commande" testé (un client ne peut pas accéder à la commande d'un autre)
- [ ] `docs/checklist-implementation.md` : `orders` passé à ✅
