# Feature — `notifications`

**Statut : ✅ Fait** (session 2026-09-15). Phase 3 — Production.

## Objet

Émission et consultation des notifications utilisateur (spec §84) : rendez-vous confirmé/rappel/
annulé, statut de commande changé, devis reçu, statut de patron changé, message reçu — sur les
canaux email et in-app au minimum.

## Emplacement Clean Architecture

`apps/api/src/notifications/`

```
domain/
  entities/notification.entity.ts
  repositories/notification.repository.ts    → INotificationRepository (zéro import Prisma)
  ports/notification-channel.port.ts         → INotificationChannelPort : send(notification) — abstraction par canal
application/
  use-cases/
    create-notification.use-case.ts          → persiste la Notification (in-app) puis tente l'envoi sur les canaux disponibles, en best-effort
    list-user-notifications.use-case.ts
    mark-notification-read.use-case.ts
    mark-all-read.use-case.ts
  dtos/
infrastructure/
  repositories/prisma-notification.repository.ts
  services/
    email-channel.adapter.ts    → implémente INotificationChannelPort (prestataire SMTP/transactionnel exact à confirmer)
    web-channel.adapter.ts      → in-app : correspond à la persistance Notification elle-même, pas d'envoi réseau
    whatsapp-channel.adapter.ts → NON BRANCHÉ — voir Points d'attention
  mappers/
presentation/
  controllers/notifications.controller.ts
  guards/ (utilisateur courant uniquement)
__tests__/
  unit/notification.entity.spec.ts
  unit/notification.mapper.spec.ts
  unit/prisma-notification.repository.spec.ts
  unit/create-notification.use-case.spec.ts
  unit/list-user-notifications.use-case.spec.ts
  unit/mark-notification-read.use-case.spec.ts
  unit/mark-all-read.use-case.spec.ts
  unit/email-channel.adapter.spec.ts
  unit/web-channel.adapter.spec.ts
  integration/notifications.controller.spec.ts
```

## Modèles Prisma

`Notification` (+ enum `NotificationType`) ; relation `User`, champs génériques
`relatedEntityType`/`relatedEntityId` pour référencer l'objet source (commande, rendez-vous,
devis, projet de patron…).

## Cas d'usage clés

- Créer une notification suite à un événement métier émis par un autre module
  (`APPOINTMENT_CONFIRMED`, `APPOINTMENT_REMINDER`, `APPOINTMENT_CANCELLED`,
  `ORDER_STATUS_CHANGED`, `QUOTE_RECEIVED`, `PATTERN_STATUS_CHANGED`, `MESSAGE_RECEIVED`) et
  l'envoyer sur les canaux disponibles (email + in-app minimum)
- Lister les notifications d'un utilisateur (avec filtre non lues)
- Marquer une notification, ou toutes, comme lues

## Endpoints exposés

| Méthode | Route | Use-case | Auth |
| --- | --- | --- | --- |
| `GET` | `/api/notifications` | `list-user-notifications` | Utilisateur authentifié |
| `PATCH` | `/api/notifications/:id/read` | `mark-notification-read` | Utilisateur authentifié (propriétaire) |
| `PATCH` | `/api/notifications/read-all` | `mark-all-read` | Utilisateur authentifié |

Aucun endpoint de création publique : `create-notification` est appelé en interne par les
autres modules via le service exporté de `notifications`, jamais par écriture directe dans la
table `Notification`.

## Points d'intégration

- **`orders`** : `create-order-from-cart`/`update-order-status` émettent `ORDER_STATUS_CHANGED`
  — **câblé**.
- **`payments`** : `confirm-payment` émet `ORDER_STATUS_CHANGED` une fois le paiement confirmé
  (le statut `Order` passe à `PAID` dans la même transaction) — **câblé**. `refund-payment`
  transitionne aussi l'`Order` (`REFUNDED`) mais n'émet pas encore de notification — non couvert
  par la vérification de sortie de phase, TODO explicite.
- **`appointments`** : `confirm-appointment` émet `APPOINTMENT_CONFIRMED` — **câblé**, mais
  seulement quand le rendez-vous est lié à un `Customer` connecté (`Appointment.customerId`
  non nul) : un visiteur anonyme n'a pas de `User` auquel rattacher une notification in-app.
  `create-appointment`/`cancel-appointment` (donc `APPOINTMENT_REMINDER`/`APPOINTMENT_CANCELLED`)
  ne sont **pas encore câblés** — TODO explicite dans `docs/features/appointments.md`.
- **`quotes`** : `QUOTE_RECEIVED` — **pas encore câblé**, TODO explicite dans
  `docs/features/quotes.md` (`send-quote`/`accept-quote`/`reject-quote`/`request-quote-change`).
- **`patterns`** : `PATTERN_STATUS_CHANGED` — **pas encore câblé**.
- Chacun de ces modules injecte le service exporté de `notifications` (`CreateNotificationUseCase`)
  plutôt que d'écrire directement dans la table `Notification`.

## Points d'attention

- **WhatsApp** (spec §84 « WhatsApp si intégré ») : aucun prestataire (Twilio, WhatsApp Business
  API, Meta Cloud API…) n'est confirmé à ce jour. `whatsapp-channel.adapter.ts` reste un stub
  non branché (pas enregistré dans `NOTIFICATION_CHANNELS`, `notifications.module.ts`) tant
  qu'un prestataire n'est pas choisi — `INotificationChannelPort` reste extensible pour
  l'ajouter sans changer le Domain. Email + in-app couvrent donc le minimum de cette phase.
- **Email** : `email-channel.adapter.ts` utilise `nodemailer` via SMTP générique (variables
  `SMTP_*`, voir `docs/environment-variables.md` §7) — provider-agnostique, aucun prestataire
  transactionnel précis imposé. `SMTP_HOST` vide désactive le canal (log + skip), la
  notification in-app reste créée.
- L'échec d'un canal (ex. email indisponible) ne doit jamais faire échouer la persistance
  in-app de la notification — `create-notification` reste best-effort par canal (`Promise.all`
  avec `try/catch` par canal). De même, l'échec de `CreateNotificationUseCase` lui-même (ex.
  DB indisponible) ne doit jamais faire échouer l'opération métier qui l'a déclenché — chaque
  point d'intégration (`orders`, `payments`, `appointments`) l'appelle dans son propre
  `try/catch`, après que l'écriture principale (commande, paiement, rendez-vous) a déjà été
  persistée.
- Un rendez-vous visiteur (`Appointment.customerId` nul) n'a pas de `User` auquel rattacher une
  `Notification` — `confirm-appointment` saute silencieusement la notification dans ce cas (voir
  "Points d'intégration"). Un envoi email direct à `Appointment.email`, indépendant du modèle
  `Notification`/`User`, resterait à concevoir si ce cas doit être couvert.

## Vérification

- [x] `create-notification` testé pour chaque scénario clé (persistance + best-effort multi-canal, y compris un canal en échec) — voir `__tests__/unit/create-notification.use-case.spec.ts`
- [x] `mark-notification-read`/`mark-all-read` testés
- [x] Guard "notifications d'un autre utilisateur inaccessibles" testé
- [x] `docs/checklist-implementation.md` : `notifications` passé à ✅
- [ ] `quotes`/`patterns`/`create-appointment`/`cancel-appointment`/`refund-payment` restent à câbler (voir "Points d'intégration")
