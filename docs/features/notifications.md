# Feature — `notifications`

**Statut : ⬜ À faire.** Phase 3 — Production.

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
  unit/create-notification.use-case.spec.ts
  unit/mark-notification-read.use-case.spec.ts
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

- **`appointments`** : `APPOINTMENT_CONFIRMED`/`APPOINTMENT_REMINDER`/`APPOINTMENT_CANCELLED`
- **`orders`** / **`payments`** : `ORDER_STATUS_CHANGED` (y compris pour un paiement confirmé,
  voir `docs/features/payments.md`)
- **`quotes`** : `QUOTE_RECEIVED`
- **`patterns`** : `PATTERN_STATUS_CHANGED`
- Chacun de ces modules injecte le service exporté de `notifications` (`create-notification`)
  plutôt que d'écrire directement dans la table `Notification`.

## Points d'attention

- **WhatsApp** (spec §84 « WhatsApp si intégré ») : aucun prestataire (Twilio, WhatsApp Business
  API, Meta Cloud API…) n'est confirmé à ce jour. `whatsapp-channel.adapter.ts` reste un stub
  non branché tant qu'un prestataire n'est pas choisi — `INotificationChannelPort` doit rester
  extensible pour l'ajouter sans changer le Domain. Email + in-app constituent donc le minimum
  couvert par cette phase ; documenter ce gap dans `docs/phases/phase-3-production.md` au moment
  de l'implémentation.
- L'échec d'un canal (ex. email indisponible) ne doit jamais faire échouer la persistance
  in-app de la notification — `create-notification` reste best-effort par canal.

## Vérification

- [ ] `create-notification` testé pour chaque `NotificationType` déclencheur (au moins un cas par canal, avec un mock du provider email)
- [ ] `mark-notification-read`/`mark-all-read` testés
- [ ] Guard "notifications d'un autre utilisateur inaccessibles" testé
- [ ] `docs/checklist-implementation.md` : `notifications` passé à ✅
