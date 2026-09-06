# Feature — `payments`

**Statut : ⬜ À faire.** Phase 3 — Production.

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
  value-objects/payment-status.vo.ts
application/
  use-cases/
    initiate-payment.use-case.ts         → crée un Payment PENDING, délègue à l'IPaymentProviderPort résolu selon PaymentMethod
    confirm-payment.use-case.ts          → traite le callback/webhook (ou la validation manuelle pour CASH_ON_DELIVERY), déclenche update-order-status (orders) + notification
    refund-payment.use-case.ts
    get-payment-status.use-case.ts
  dtos/
infrastructure/
  repositories/prisma-payment.repository.ts
  services/
    mobile-money-provider.adapter.ts     → implémente IPaymentProviderPort — prestataire exact (ex. Mvola/Orange Money/Airtel Money) non tranché à ce jour, voir Points d'attention
    card-provider.adapter.ts             → implémente IPaymentProviderPort
    bank-transfer-provider.adapter.ts    → confirmation manuelle (rapprochement bancaire)
    cash-on-delivery-provider.adapter.ts → pas d'appel externe, confirmation à la livraison
    payment-provider.factory.ts          → résout l'adapter concret selon PaymentMethod
  mappers/
presentation/
  controllers/payments.controller.ts
  controllers/payments-webhook.controller.ts → callback(s) prestataire, vérifiés par signature (pas de Guard JWT utilisateur)
  guards/
__tests__/
  unit/initiate-payment.use-case.spec.ts
  unit/confirm-payment.use-case.spec.ts    → avec un IPaymentProviderPort stub par méthode
  integration/payments.controller.spec.ts
```

## Modèles Prisma

`Payment` (+ enums `PaymentMethod`, `PaymentStatus`) ; relation `Order`.

## Cas d'usage clés

- Initier un paiement pour une commande selon le `PaymentMethod` choisi
- Confirmer un paiement (callback/webhook prestataire, ou validation manuelle pour
  `CASH_ON_DELIVERY`) et propager la transition sur la commande associée
- Rembourser un paiement
- Consulter le statut d'un paiement

## Endpoints exposés

| Méthode | Route | Use-case | Auth |
| --- | --- | --- | --- |
| `POST` | `/api/payments` | `initiate-payment` | `CLIENT` (propriétaire de la commande) |
| `POST` | `/api/payments/webhook/:method` | `confirm-payment` | Interne — vérification par signature prestataire, pas de JWT utilisateur |
| `GET` | `/api/payments/:id` | `get-payment-status` | `CLIENT` (propriétaire) ou `MANAGER`/`ADMIN` |
| `POST` | `/api/payments/:id/refund` | `refund-payment` | `MANAGER`/`ADMIN` |

## Points d'intégration

- **`orders`** : `confirm-payment` déclenche `update-order-status` vers `PAID` (jamais l'inverse
  — `orders` ne connaît pas le détail du paiement, seulement le statut qui en résulte).
- **`notifications`** : un paiement confirmé se traduit par une notification
  `ORDER_STATUS_CHANGED` — l'enum `NotificationType` ne définit pas de type dédié au paiement à
  ce jour (voir `docs/features/notifications.md`), ce choix est documenté ici plutôt que d'ajouter
  un type non prévu par le schéma sans validation préalable.
- **`products`** : aucune dépendance directe — la disponibilité du stock est vérifiée en amont
  par `orders`.

## Points d'attention

- **Le Domain ne doit jamais importer un SDK de prestataire** (Mobile Money, carte…) — seule
  l'interface `IPaymentProviderPort` y est visible ; les adaptateurs concrets vivent
  exclusivement en Infrastructure.
- Le prestataire Mobile Money exact (ex. MVola, Orange Money, Airtel Money) n'est pas encore
  confirmé au moment de cette fiche — l'adaptateur concret sera nommé/implémenté une fois le
  choix arrêté, sans changer l'interface `IPaymentProviderPort`.
- Les webhooks (`payments-webhook.controller.ts`) doivent être vérifiés par signature
  prestataire, jamais par un JWT utilisateur classique.

## Vérification

- [ ] `initiate-payment` testé pour chaque `PaymentMethod` (avec provider stub)
- [ ] `confirm-payment` testé : la commande associée transite bien vers `PAID`
- [ ] `refund-payment` testé
- [ ] `docs/checklist-implementation.md` : `payments` passé à ✅
