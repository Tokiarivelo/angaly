# Page — `messages-factures-notifications`

**Statut : ✅ Fait — Messages, Factures et Notifications câblés pour de vrai.** Phase 3 —
Production. Mis à jour le 2026-09-16 (câblage de l'onglet Messages, gap fermé — voir
`docs/features/messages.md`).

- **Onglet Notifications** : `useNotifications.ts`/`useMarkNotificationsRead.ts` appellent
  réellement `GET /api/notifications`, `PATCH /api/notifications/:id/read` (au clic sur une
  notification non lue) et `PATCH /api/notifications/read-all` — ce sont les **vraies** routes
  (voir `apps/api/src/notifications/presentation/controllers/notifications.controller.ts`),
  différentes de celles que documentait initialement ce fichier (`POST /api/notifications/
  mark-all-read`, `?customerId=me` — corrigées ci-dessous).
- **Onglet Factures** : dérivé de `Payment` comme prévu. `GET /api/payments` (liste par client)
  **n'existait pas** — ajouté cette session (`ListCustomerPaymentsUseCase`, mirroir exact du
  pattern `orders`, voir `docs/features/payments.md`). `useInvoices.ts` joint ce résultat avec
  `GET /api/orders` pour résoudre un `orderReference` (`orderNumber`) lisible. Le téléchargement
  de PDF reste un état "Bientôt disponible" **désactivé explicite** — aucune génération de PDF
  ni `MediaEntityType` pour un justificatif n'existe, conformément au point d'attention déjà
  documenté ci-dessous ; `useDownloadInvoice.ts` ne simule plus un téléchargement.
- **Onglet Messages** : **câblé pour de vrai, session du 2026-09-16.** Nouveau module backend
  `apps/api/src/messages/` (`Conversation`/`Message`, migration
  `20260916035657_add_conversation_message`, voir `docs/features/messages.md`) et frontend
  reconnecté : `useConversations`/`useConversationThread`/`useSendMessage` appellent
  réellement `GET /api/messages/conversations`, `GET /api/messages/conversations/:id/messages`
  et `POST /api/messages/conversations/:id/messages`. `ConversationThreadList`/
  `ConversationThreadView`/`MessageComposer` (déjà construits, présentationnels) remplacent
  `MessagingComingSoonPanel`, qui a été supprimé (plus référencé nulle part). Comme le client
  n'a jamais d'entrée "nouvelle conversation" (aucune maquette ne le prévoit — voir
  `docs/features/messages.md`), une conversation ne peut être démarrée que côté staff
  (`POST /api/messages/conversations`, hors UI de cette phase, voir "Points d'attention").

## Objet

Regroupe, en une seule page à onglets, la messagerie avec l'atelier, la liste des factures et
l'historique des notifications du client connecté (spec §51, où "Mes messages", "Mes
factures" et "Mes notifications" sont trois entrées de sidebar distinctes, réunies ici en un
seul écran conformément à la maquette Stitch).

## Route(s)

`apps/web/src/app/(client)/mes-messages/page.tsx` → `/mes-messages`
(+ `?tab=messages|factures|notifications` ; chaque entrée de la sidebar de l'espace client
("Mes messages", "Mes factures", "Notifications") pointe vers le tab correspondant sur cette
même route).

Client Component dès la racine : les trois onglets partagent un état de navigation interne
(tab actif) et la messagerie nécessite une interactivité proche du temps réel (sélection de
fil, envoi de message) peu compatible avec un rendu SSR déterminant.

## Référence maquette

- Prompt Stitch : `stitch-prompts/28-espace-client-favoris-messages.md` (Écran B — Messages /
  Factures / Notifications)
- Écran Stitch : **ANGALY — Messages, Factures & Notifications**
- Section spécification : §51 (`docs/specifications/ANGALY_Specifications_Completes.md`)

## Arborescence de composants attendue

```
apps/web/src/features/messages-factures-notifications/
  ui/
    MessagesFacturesNotificationsPage.tsx → shell : sidebar client + zone d'onglets
    ClientSpaceTabBar.tsx        → Messages / Factures / Notifications
    messages/
      ConversationThreadList.tsx  → liste des fils (atelier, dernier message, timestamp, badge non lu)
      ConversationThreadView.tsx  → bulles de message (client navy/blanc à droite, Angaly
                                     ivoire/navy à gauche + avatar)
      MessageComposer.tsx          → barre de saisie + envoi
    factures/
      InvoiceList.tsx               → lignes facture (numéro, commande/projet lié, date, montant, statut)
      InvoiceStatusBadge.tsx        → Payée / En attente / Partiellement payée / Remboursée
      DownloadInvoiceButton.tsx     → "Télécharger le PDF"
    notifications/
      NotificationList.tsx          → icône catégorie, message, timestamp, indicateur non lu
      MarkAllReadLink.tsx           → "Tout marquer comme lu"
  hooks/
    useClientSpaceTab.ts           → onglet actif synchronisé avec `?tab=`
    useConversations.ts, useConversationThread.ts, useSendMessage.ts → câblés au module
                                       backend `messages` (voir docs/features/messages.md)
    useInvoices.ts                  → liste des factures (dérivées de `Payment`) via react-query
    useDownloadInvoice.ts           → téléchargement du PDF
    useNotifications.ts             → liste des notifications
    useMarkNotificationsRead.ts     → "tout marquer comme lu" / lecture individuelle
  api/
    messages.api.ts                 → useConversationsQuery, useConversationThreadQuery,
                                        useSendMessageMutation (module `messages`)
    invoices.api.ts                  → useInvoicesQuery, useDownloadInvoiceQuery (module `payments`)
    notifications.api.ts             → useNotificationsQuery, useMarkAllReadMutation,
                                        useMarkNotificationReadMutation
  consts/
    queryKeys.ts
  __tests__/
    useNotifications.test.ts
    useInvoices.test.ts
    useMarkNotificationsRead.test.ts
    useConversations.test.ts
    useConversationThread.test.ts
    useSendMessage.test.ts
  index.ts
```

Toute logique (navigation d'onglet, chargement, envoi, marquage lu) vit dans `hooks/` ; les
composants `ui/` restent purement présentationnels.

## Endpoints API consommés

**Corrigé le 2026-09-16** : les routes ci-dessous sont les vraies routes implémentées (voir
`apps/api/src/notifications/presentation/controllers/notifications.controller.ts`,
`apps/api/src/payments/presentation/controllers/payments.controller.ts` et
`apps/api/src/messages/presentation/controllers/messages.controller.ts` — sources de vérité,
pas cette table). La version précédente de ce tableau documentait des noms/verbes de route
obsolètes, écrits avant que le backend n'existe.

| Endpoint | Module | Usage |
| --- | --- | --- |
| `GET /api/notifications` | `notifications` | Liste des notifications du client connecté (identifié via le JWT, pas un `?customerId=me`) |
| `PATCH /api/notifications/:id/read` | `notifications` | Marquage lu d'une notification (au clic) |
| `PATCH /api/notifications/read-all` | `notifications` | "Tout marquer comme lu" (204, pas `POST /mark-all-read`) |
| `GET /api/payments` | `payments` | Liste des "factures" dérivées des `Payment` du client connecté — **ajouté cette session** (`ListCustomerPaymentsUseCase`) |
| `GET /api/orders` | `orders` | Jointe côté frontend pour résoudre l'`orderReference` (`orderNumber`) de chaque facture et de chaque conversation liée à une commande |
| — (aucun endpoint) | — | Téléchargement PDF : pas de `GET /api/payments/:id/invoice-pdf`, bouton désactivé "Bientôt disponible" (cf point d'attention) |
| `GET /api/messages/conversations` | `messages` | Liste des fils du client connecté — **nouveau module cette session** (voir `docs/features/messages.md`) |
| `GET /api/messages/conversations/:id/messages` | `messages` | Messages d'un fil (propriétaire uniquement) ; marque les messages atelier non lus comme lus |
| `POST /api/messages/conversations/:id/messages` | `messages` | Envoi d'un message dans un fil existant (`useSendMessage`) |

## Modèles Prisma touchés

`Notification` (`userId`, `type`, `title`, `body`, `isRead`, `relatedEntityType`,
`relatedEntityId`), `Payment` (`method`, `status`, `amount`, `transactionRef`, `paidAt` — base
des "factures"), `Order`/`Quote` (lecture, pour le libellé "commande/projet lié" de chaque
facture), et désormais `Conversation`/`Message` (+ enum `MessageSenderRole`) — **ajoutés cette
session**, voir `docs/features/messages.md`.

## Points d'attention

- **Messagerie — pas de flux "nouvelle conversation" côté client** : cohérent avec la maquette
  (aucune entrée "nouvelle conversation" dans `stitch-prompts/28-espace-client-favoris-messages.md`
  Écran B) et avec les hooks déjà construits (`useSendMessage(threadId, content)` suppose un
  fil existant), le client ne peut qu'ouvrir/répondre à des fils déjà créés. Un fil est
  démarré exclusivement côté staff (`POST /api/messages/conversations`, `COUTURIERE`/
  `MANAGER`/`ADMIN`) — aucune UI staff pour ça dans cette phase, voir
  `docs/features/messages.md` "Points d'attention".
- **Pas de modèle "Facture" dédié** : les "factures" affichées dans l'onglet Factures sont
  dérivées de `Payment` (pas de champ `invoiceNumber`, ni de relation `Media` pour un PDF
  généré — `MediaEntityType` ne comporte aucune valeur pour un justificatif de paiement). Le
  bouton "Télécharger le PDF" suppose une génération de PDF à la volée (ou un stockage MinIO à
  ajouter) qui reste à spécifier avec le module `payments` avant l'implémentation — ne pas
  présumer qu'un PDF existe déjà pour chaque `Payment`.
- Le badge de statut de facture (Payée / En attente / Partiellement payée / Remboursée) se
  dérive de `PaymentStatus` (`PAID`, `PENDING`/`AUTHORIZED`, `PARTIALLY_PAID`, `REFUNDED`) —
  `FAILED` n'a pas d'équivalent visuel prévu dans la maquette, à trancher (ton `Error`,
  probablement fusionné avec "En attente" côté UX si jugé trop technique pour le client).
- L'onglet actif doit rester synchronisé avec `?tab=` pour que chaque entrée de la sidebar
  client ("Mes messages", "Mes factures", "Notifications") renvoie directement au bon onglet,
  malgré la fusion des trois en une seule route/feature.
- "Tout marquer comme lu" ne doit affecter que les notifications visibles du client connecté
  (`Notification.userId`), jamais une portée plus large.
- Mobile : la vue messagerie à deux volets devient une seule vue avec flèche retour vers la
  liste des fils ; factures et notifications restent des listes simples empilées.

## Checklist d'acceptation

- [x] Onglet actif synchronisé avec `?tab=` et les liens de la sidebar client (inchangé, déjà
      fonctionnel avant cette passe)
- [x] Onglet Notifications : liste réelle via l'API `notifications`, "Tout marquer comme lu"
      fonctionnel, marquage individuel au clic ajouté
- [x] Onglet Factures : liste réelle dérivée de `Payment` (nouvel endpoint `GET /api/payments`),
      badges de statut corrects (`FAILED`/`AUTHORIZED` fusionnés dans `PENDING`, documenté),
      téléchargement PDF explicitement désactivé ("Bientôt disponible") — pas de PDF simulé
- [x] Onglet Messages : câblé pour de vrai (nouveau module `messages`, voir
      `docs/features/messages.md`) — liste des fils, ouverture d'un fil (marquage lu),
      envoi de message ; `MessagingComingSoonPanel` supprimé
- [x] Tests : `useNotifications.test.ts` (2), `useInvoices.test.ts` (2),
      `useMarkNotificationsRead.test.ts` (2), `useConversations.test.ts` (3),
      `useConversationThread.test.ts` (2), `useSendMessage.test.ts` (2),
      `MessagesFacturesNotificationsPage.test.tsx` (1) — plus, côté backend,
      `list-customer-payments.use-case.spec.ts`, les ajouts à
      `prisma-payment.repository.spec.ts`/`payments.controller.spec.ts`, et le module
      `messages` complet (11 fichiers de tests, 57 assertions — voir `docs/features/messages.md`)
- [x] `docs/checklist-implementation.md` et `docs/mockup-reference.md` mis à jour
