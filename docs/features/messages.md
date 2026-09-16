# Feature — `messages`

**Statut : ✅ Fait** (MVP volontairement restreint — pas de boîte de réception staff, voir
"Points d'attention"). Phase 3 — Production.

## Objet

Messagerie client ↔ atelier (spec §51) : le client échange avec l'atelier ANGALY qui suit sa
commande/son projet sur-mesure, depuis l'onglet "Messages" de
`messages-factures-notifications`. Ferme le gap documenté dans
`docs/phases/phase-3-production.md` — jusqu'ici, aucun modèle `Message`/`Conversation`
n'existait.

## Emplacement Clean Architecture

`apps/api/src/messages/`

```
domain/
  entities/
    conversation.entity.ts   → invariants (customerId/atelierId/atelierName/lastMessagePreview
                                non vides, unreadCount ≥ 0) ; atelierName et unreadCount sont
                                des champs de lecture hydratés par le mapper (jointure Atelier +
                                comptage filtré), jamais persistés tels quels sur Conversation
    message.entity.ts        → invariants (conversationId/senderUserId/content non vides,
                                senderRole reconnu)
  repositories/
    conversation.repository.ts → IConversationRepository (zéro import Prisma)
    message.repository.ts      → IMessageRepository
application/
  lib/resolve-customer-id.ts   → même pattern qu'orders/payments/quotes/patterns (dupliqué, pas importé)
  use-cases/
    list-my-conversations.use-case.ts    → CLIENT (les siennes) ou COUTURIERE/MANAGER/ADMIN (toutes)
    get-conversation-thread.use-case.ts  → propriétaire uniquement pour CLIENT (403 sinon) ;
                                            marque les messages STAFF non lus comme lus à l'ouverture
    send-message.use-case.ts             → ajoute un message à une conversation EXISTANTE ;
                                            émet MESSAGE_RECEIVED (best-effort) si l'auteur est staff
    start-conversation.use-case.ts       → staff uniquement — voir "Comment une nouvelle
                                            conversation est créée" ci-dessous
  dtos/
    conversation-response.dto.ts, message-response.dto.ts,
    send-message-request.dto.ts, start-conversation-request.dto.ts
infrastructure/
  repositories/prisma-conversation.repository.ts → jointure `atelier: true` +
                                                     `_count` filtré (messages STAFF non lus)
  repositories/prisma-message.repository.ts
  mappers/conversation.mapper.ts, message.mapper.ts
presentation/
  controllers/messages.controller.ts → JwtAuthGuard partout ; RolesGuard+@Roles('COUTURIERE',
                                        'MANAGER','ADMIN') sur POST /messages/conversations
__tests__/
  unit/conversation.entity.spec.ts, message.entity.spec.ts,
  unit/list-my-conversations.use-case.spec.ts, get-conversation-thread.use-case.spec.ts,
  unit/send-message.use-case.spec.ts, start-conversation.use-case.spec.ts,
  unit/conversation.mapper.spec.ts, message.mapper.spec.ts,
  unit/prisma-conversation.repository.spec.ts, prisma-message.repository.spec.ts
  integration/messages.controller.spec.ts
```

## Modèles Prisma

**Nouveaux cette session** : `Conversation` (`customerId`, `atelierId`, `relatedEntityType`/
`relatedEntityId` génériques — même pattern que `Notification`, `lastMessagePreview`,
`lastMessageAt`) et `Message` (`conversationId`, `senderRole` (`MessageSenderRole`:
`CLIENT`/`STAFF`), `senderUserId`, `content`, `isRead`, `createdAt`). Une seule `Conversation`
par couple `(customerId, atelierId)` (`@@unique([customerId, atelierId])`) — voir ci-dessous.
Migration : `packages/database/prisma/migrations/20260916035657_add_conversation_message/`.

`NotificationType.MESSAGE_RECEIVED` (déjà présent dans le schéma) est désormais réellement
émis par `send-message`/`start-conversation` quand l'auteur est staff.

## Comment une nouvelle conversation est créée

Décision prise cette session : **find-or-create staff-only**, pas de flux CLIENT de "nouvelle
conversation" (cohérent avec le fait que la maquette Stitch et les hooks frontend déjà
construits — `useSendMessage(threadId, content)` — supposent un fil déjà existant, jamais un
`atelierId` cible). `POST /api/messages/conversations` (staff : `COUTURIERE`/`MANAGER`/`ADMIN`)
prend `{ customerId, atelierId, content, relatedEntityType?, relatedEntityId? }`,
cherche une `Conversation` existante pour ce couple `(customerId, atelierId)`, la crée si
absente (avec `relatedEntityType`/`relatedEntityId` enregistrés **uniquement** à la création —
un message ultérieur sur la même conversation ne les réécrit jamais), puis délègue à
`send-message` pour l'ajout du premier message. Alternative écartée : une
`create-conversation.use-case` séparée du premier message — jugée inutilement complexe pour ce
MVP (aucune conversation "vide" n'a de sens produit).

Aucune UI staff n'existe dans cette phase (hors scope, voir contraintes) : ce chemin n'est donc
exercé que via l'API/les tests, authentifié `COUTURIERE`/`MANAGER`/`ADMIN` — pas de boîte de
réception staff à construire ici.

## Cas d'usage clés

- Lister les conversations du client connecté (`CLIENT`) ou de tous les clients (staff)
- Ouvrir un fil de conversation (propriétaire uniquement pour `CLIENT`) — marque les messages
  STAFF non lus comme lus
- Envoyer un message dans une conversation existante (`CLIENT` propriétaire, ou staff)
- (Staff) Démarrer une nouvelle conversation avec un client

## Endpoints exposés

| Méthode | Route | Use-case | Auth |
| --- | --- | --- | --- |
| `GET` | `/api/messages/conversations` | `list-my-conversations` | `CLIENT` (les siennes) ou `COUTURIERE`/`MANAGER`/`ADMIN` (toutes) |
| `GET` | `/api/messages/conversations/:id/messages` | `get-conversation-thread` | `CLIENT` propriétaire (403 sinon) ou staff |
| `POST` | `/api/messages/conversations/:id/messages` | `send-message` | `CLIENT` propriétaire, ou staff |
| `POST` | `/api/messages/conversations` | `start-conversation` | `COUTURIERE`/`MANAGER`/`ADMIN` uniquement |

## Points d'intégration

- **`notifications`** : `send-message` (et donc `start-conversation`, qui délègue à
  `send-message`) émet `MESSAGE_RECEIVED` en best-effort — uniquement quand l'auteur du message
  est staff (un client n'a pas besoin d'être notifié de son propre message). Best-effort strict :
  une erreur de notification (ex. DB indisponible) est loguée et n'annule jamais l'envoi du
  message déjà persisté — même pattern que `orders`.`update-order-status`.
- **`ateliers`** : `ATELIER_REPOSITORY.findById()` valide l'`atelierId` fourni par le staff
  avant de créer une conversation.
- **`customers`** : `CUSTOMER_REPOSITORY` résout `Customer.id` depuis le JWT (`CLIENT`), et
  résout le `Customer.userId` cible pour l'auteur staff (notification, `start-conversation`).

## Points d'attention

- **Pas de boîte de réception staff** : aucune UI staff/admin pour lister et répondre aux
  conversations n'existe dans cette phase — explicitement hors périmètre (voir consignes de
  cette session). `POST /api/messages/conversations` et l'auteur `STAFF` de
  `send-message`/`markStaffMessagesRead` ne sont donc exercés qu'via l'API/les tests
  authentifiés `COUTURIERE`/`MANAGER`/`ADMIN`, jamais depuis un écran construit.
- **Un seul fil par (client, atelier)** : pas de système de tickets multi-fils pour un même
  couple client/atelier (une seule `Conversation` par paire, contrainte `@@unique`). Si un
  produit futur veut plusieurs fils parallèles (un par commande, par exemple), il faudra lever
  cette contrainte et faire porter le "find" sur `(customerId, atelierId, relatedEntityId)` —
  non fait ici pour rester simple.
- **`relatedEntityType`/`relatedEntityId` figés à la création** : contrairement à
  `Notification` où ce couple est renseigné à chaque émission, `Conversation` ne le met à jour
  qu'à la création du fil — un message ultérieur sur un sujet différent (ex. un nouveau
  rendez-vous) dans la même conversation atelier ne change pas ce qu'affiche la liste des fils.
  Accepté pour ce MVP.
- **`atelierName`/`unreadCount` ne sont pas des colonnes** : `atelierName` vient d'une jointure
  Prisma (`include: { atelier: true }`), `unreadCount` d'un comptage filtré
  (`_count.select.messages.where`) — voir `infrastructure/mappers/conversation.mapper.ts`. Toute
  nouvelle méthode de repository qui retourne une `ConversationEntity` doit inclure ces deux
  relations, sinon le mapper échoue.
- **Vérification de la maquette Stitch** : les composants présentationnels
  (`ConversationThreadList`/`ConversationThreadView`/`MessageComposer`) existaient déjà avant
  cette session (voir `docs/pages/messages-factures-notifications.md`) ; cette session les a
  reconnectés à de vraies données sans modifier leur structure JSX. L'accès direct aux outils
  Stitch (`agy`/`mcp__stitch__*`) a échoué dans cet environnement headless (erreur
  d'authentification côté serveur MCP) — la mise en page à deux volets ajoutée dans
  `MessagesFacturesNotificationsPage.tsx` (liste à gauche, fil + composer à droite, bascule
  mobile avec flèche retour) s'appuie sur la description déjà consignée dans
  `stitch-prompts/28-espace-client-favoris-messages.md` (Écran B) plutôt que sur une nouvelle
  vérification de l'écran rendu — à revérifier avec `agy` dès qu'une session interactive est
  disponible, avant toute retouche visuelle de cet écran.

## Vérification

- [x] `list-my-conversations`/`get-conversation-thread`/`send-message`/`start-conversation`
      testés (propriétaire, staff, 403/404, best-effort notification) — voir `__tests__/`
- [x] Guard "conversation d'un autre client inaccessible" testé (`GET` et `POST` messages)
- [x] Migration Prisma appliquée (`add_conversation_message`) et `Prisma Client` régénéré
- [x] Frontend reconnecté : `useConversations`/`useConversationThread`/`useSendMessage` +
      `api/messages.api.ts`, `MessagingComingSoonPanel` retiré (plus référencé nulle part)
- [x] `docs/checklist-implementation.md`, `docs/mockup-reference.md`,
      `docs/pages/messages-factures-notifications.md`,
      `docs/phases/phase-3-production.md` mis à jour
