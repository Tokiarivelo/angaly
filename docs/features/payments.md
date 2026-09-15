# Feature — `payments`

**Statut : ✅ Fait** (avec un écart documenté : pas de webhook signé prestataire, voir
"Points d'attention"). Phase 3 — Production.

## Objet

Couche d'abstraction du paiement (spec §59) : gérer le cycle de vie d'un `Payment` rattaché à
une `Order`, quel que soit le moyen (Mobile Money, carte, virement, à la livraison), sans que
le Domain ne connaisse le détail d'un prestataire concret.

## Emplacement Clean Architecture

`apps/api/src/payments/`

```
domain/
  entities/payment.entity.ts             → invariants (montant > 0, transitions de statut valides)
  repositories/payment.repository.ts     → IPaymentRepository (zéro import Prisma)
  ports/payment-provider.port.ts         → IPaymentProviderPort — initiatePayment()/confirmPayment()/refund(), zéro détail Mobile Money/carte/etc.
application/
  lib/resolve-customer-id.ts             → résout Customer.id depuis le userId du JWT (même pattern qu'orders/quotes/patterns)
  use-cases/
    initiate-payment.use-case.ts         → crée un Payment PENDING, vérifie que l'appelant possède la commande, délègue à l'IPaymentProviderPort résolu selon PaymentMethod
    confirm-payment.use-case.ts          → confirmation manuelle (mock/CASH_ON_DELIVERY), transitionne la commande via Order.transitionTo(PAID)
    refund-payment.use-case.ts           → rembourse un Payment PAID, transitionne la commande via Order.transitionTo(REFUNDED)
    get-payment-status.use-case.ts       → CLIENT (propriétaire de la commande) ou MANAGER/ADMIN
  dtos/
    initiate-payment-request.dto.ts, payment-response.dto.ts
infrastructure/
  repositories/prisma-payment.repository.ts
  mappers/payment.mapper.ts              → toResponseDto() (number ↔ "xx.xx" string, Date ↔ ISO string)
  services/
    mock-payment-provider.adapter.ts     → implémente IPaymentProviderPort — seul adapter existant, voir Points d'attention
    payment-provider.factory.ts          → résout l'adapter selon PaymentMethod (retourne toujours le mock aujourd'hui)
presentation/
  controllers/payments.controller.ts     → JwtAuthGuard partout ; RolesGuard+@Roles('MANAGER','ADMIN') sur confirm/refund
__tests__/
  unit/payment.entity.spec.ts, resolve-customer-id (réutilisé via orders — voir plus bas),
  unit/initiate-payment.use-case.spec.ts, confirm-payment.use-case.spec.ts,
  unit/get-payment-status.use-case.spec.ts, refund-payment.use-case.spec.ts,
  unit/prisma-payment.repository.spec.ts, payment.mapper.spec.ts,
  unit/mock-payment-provider.adapter.spec.ts, payment-provider.factory.spec.ts
  integration/payments.controller.spec.ts
```

## Modèles Prisma

`Payment` (+ enums `PaymentMethod`, `PaymentStatus`) ; relation `Order`. `Payment` n'a **pas**
de colonne `updatedAt` (seulement `createdAt` + `paidAt`) — `PaymentDto` (`@angaly/types`) ne
`extends` donc pas `Timestamps` comme les autres DTOs, c'est intentionnel.

## Cas d'usage clés

- Initier un paiement pour une commande selon le `PaymentMethod` choisi (le `CLIENT` doit
  posséder la commande, et celle-ci doit être `PENDING`)
- Confirmer un paiement (validation manuelle pour `CASH_ON_DELIVERY`/mock à ce jour) et
  propager la transition sur la commande associée
- Rembourser un paiement `PAID`, en transitionnant la commande vers `REFUNDED`
- Consulter le statut d'un paiement

## Endpoints exposés

| Méthode | Route | Use-case | Auth |
| --- | --- | --- | --- |
| `POST` | `/api/payments` | `initiate-payment` | `CLIENT` (propriétaire de la commande) |
| `GET` | `/api/payments/:id` | `get-payment-status` | `CLIENT` (propriétaire) ou `MANAGER`/`ADMIN` |
| `PATCH` | `/api/payments/:id/confirm` | `confirm-payment` | `MANAGER`/`ADMIN` (confirmation manuelle) |
| `POST` | `/api/payments/:id/refund` | `refund-payment` | `MANAGER`/`ADMIN` |

## Points d'intégration

- **`orders`** : `confirm-payment`/`refund-payment` transitionnent la commande associée via
  `Order.transitionTo()` (injecté depuis `OrdersModule`, `ORDER_REPOSITORY_TOKEN`) — jamais un
  statut écrit sans passer par cette validation. Le paiement et la commande sont mis à jour
  dans un seul `$transaction`, la validation du domaine se fait avant (aucune écriture si la
  transition est invalide).
- **`notifications`** : `confirm-payment` émet une notification `ORDER_STATUS_CHANGED` une fois
  le paiement confirmé et l'`Order` transitionné à `PAID` — l'enum `NotificationType` ne définit
  pas de type dédié au paiement à ce jour. **Câblé** (session 2026-09-15, voir
  `docs/features/notifications.md`). `refund-payment` transitionne aussi l'`Order` (`REFUNDED`)
  mais n'émet pas encore de notification — TODO.
- **`products`** : aucune dépendance directe — la disponibilité du stock est vérifiée en amont
  par `orders`.

## Points d'attention

- **Le Domain ne doit jamais importer un SDK de prestataire** (Mobile Money, carte…) — seule
  l'interface `IPaymentProviderPort` y est visible ; les adaptateurs concrets vivent
  exclusivement en Infrastructure.
- **Un seul adapter existe : `MockPaymentProviderAdapter`**, utilisé pour les 4
  `PaymentMethod` sans distinction — le prestataire Mobile Money exact (ex. MVola, Orange
  Money, Airtel Money) n'est toujours pas confirmé, donc les adapters `mobile-money-provider`/
  `card-provider`/`bank-transfer-provider` distincts envisagés par une version antérieure de
  cette fiche n'ont **pas** été créés : les inventer sans prestataire réel produirait du code
  jamais exécutable contre une vraie API. `payment-provider.factory.ts` retourne le mock pour
  toutes les méthodes ; à spécialiser une fois un prestataire choisi, sans changer
  `IPaymentProviderPort`.
- **Pas de webhook signé prestataire** : cette session a implémenté `PATCH
  /api/payments/:id/confirm` comme une confirmation **manuelle par le staff**
  (`MANAGER`/`ADMIN`, via `JwtAuthGuard`+`RolesGuard`) plutôt que le
  `POST /api/payments/webhook/:method` vérifié par signature qu'une version antérieure de
  cette fiche envisageait — cohérent avec le seul adapter réel existant (mock/manuel), mais
  **pas le modèle final** : un vrai callback prestataire devra être vérifié par sa propre
  signature, jamais par un JWT utilisateur, dans un controller séparé
  (`payments-webhook.controller.ts`) quand un prestataire réel est intégré.
- **Corrigé cette session** (le module existait déjà, mais : zéro guard d'authentification sur
  le controller — n'importe qui pouvait initier/confirmer un paiement sans être connecté ;
  `confirm-payment` écrivait `OrderStatus.PAID` directement via Prisma sans passer par
  `Order.transitionTo()`, donc sans valider que la commande partait bien de `CONFIRMED` — un
  paiement confirmé sur une commande `CANCELLED` aurait silencieusement "ressuscité" la
  commande ; `initiate-payment` ne vérifiait pas que l'appelant possédait la commande visée ;
  `IPaymentRepository`/`IPaymentProviderPort` utilisaient la syntaxe méthode raccourcie au lieu
  du style propriété-flèche des autres modules ; plusieurs `as any` dans
  `prisma-payment.repository.ts`) ; zéro test n'existait pour ce module malgré son statut ✅
  dans `docs/checklist-implementation.md` avant cette session.

## Vérification

- [x] `initiate-payment` testé : commande introuvable, commande d'un autre client (403),
      commande non-`PENDING` (400), création réussie avec le bon `transactionRef`/montant —
      `initiate-payment.use-case.spec.ts`
- [x] `confirm-payment` testé : la commande associée transite bien vers `PAID`, une transition
      illégale (ex. depuis `CANCELLED`) est rejetée **sans rien écrire** —
      `confirm-payment.use-case.spec.ts`
- [x] `refund-payment` testé : transition `PAID`/`DELIVERED` → `REFUNDED`, rejet d'un paiement
      non-`PAID` ou d'une commande dans un état non remboursable — `refund-payment.use-case.spec.ts`
- [x] `payments.controller.spec.ts` couvre 200/201/400/401/403/404 sur les 4 routes, y compris
      le rejet `403` d'un `CLIENT` sur `confirm`/`refund`
- [x] `pnpm --filter @angaly/api typecheck`, `pnpm --filter @angaly/api exec eslint src/payments`
      (0 erreur) et `pnpm --filter @angaly/api exec jest src/payments` (53 tests) tous verts
- [x] `docs/checklist-implementation.md` : `payments` reste ✅ (déjà coché, mais désormais
      corroboré par du code testé plutôt qu'un statut optimiste)
