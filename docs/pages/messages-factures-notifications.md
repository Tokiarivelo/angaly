# Page — `messages-factures-notifications`

**Statut : ⬜ À faire.** Phase 3 — Production.

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
    useConversations.ts, useConversationThread.ts, useSendMessage.ts → cf point d'attention
                                       (backend manquant)
    useInvoices.ts                  → liste des factures (dérivées de `Payment`) via react-query
    useDownloadInvoice.ts           → téléchargement du PDF
    useNotifications.ts             → liste des notifications
    useMarkNotificationsRead.ts     → "tout marquer comme lu" / lecture individuelle
  api/
    messages.api.ts                 → placeholder tant que le module backend n'existe pas
    invoices.api.ts                  → useInvoicesQuery, useDownloadInvoiceQuery (module `payments`)
    notifications.api.ts             → useNotificationsQuery, useMarkAllReadMutation,
                                        useMarkNotificationReadMutation
  consts/
    queryKeys.ts
  types/
    conversation.types.ts, invoice.types.ts
  __tests__/
    useNotifications.test.ts
    useInvoices.test.ts
    useMarkNotificationsRead.test.ts
  index.ts
```

Toute logique (navigation d'onglet, chargement, envoi, marquage lu) vit dans `hooks/` ; les
composants `ui/` restent purement présentationnels.

## Endpoints API consommés

| Endpoint | Module | Usage |
| --- | --- | --- |
| `GET /api/notifications?customerId=me` | `notifications` | Liste des notifications |
| `PATCH /api/notifications/:id/read` / `POST /api/notifications/mark-all-read` | `notifications` | Marquage lu |
| `GET /api/payments?customerId=me` | `payments` | Liste des "factures" dérivées des `Payment` |
| `GET /api/payments/:id/invoice-pdf` | `payments` | Téléchargement du justificatif (à spécifier, cf point d'attention) |
| — (aucun endpoint) | — | Onglet Messages non connectable en Phase 3 — cf point d'attention majeur |

## Modèles Prisma touchés

`Notification` (`userId`, `type`, `title`, `body`, `isRead`, `relatedEntityType`,
`relatedEntityId`), `Payment` (`method`, `status`, `amount`, `transactionRef`, `paidAt` — base
des "factures"), `Order`/`Quote` (lecture, pour le libellé "commande/projet lié" de chaque
facture). **Aucun modèle** pour la messagerie (voir point d'attention).

## Points d'attention

- **Gap majeur — messagerie non modélisée** : aucun modèle `Message`/`Conversation` n'existe
  dans `packages/database/prisma/schema.prisma`, et aucun module `messages` n'existe dans
  `apps/api/src/` (contrairement à `notifications` et `payments`, déjà présents) — cohérent
  avec le fait que le périmètre backend de cette fiche ne liste que `notifications, payments
  (factures)`. Le type `NotificationType.MESSAGE_RECEIVED` du schéma confirme que la
  fonctionnalité est prévue au niveau produit, mais son backend reste à concevoir (migration
  `Conversation`/`Message`, nouveau module NestJS). **Ne pas implémenter l'onglet "Messages"
  contre un faux endpoint** : le livrer soit derrière un feature flag avec état vide permanent,
  soit avec des données de démonstration explicitement non persistées, en attendant qu'une
  fiche `docs/features/messages.md` et une migration Prisma soient traitées.
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

- [ ] Reproduit fidèlement `stitch-prompts/28-*.md` Écran B (barre d'onglets, messagerie deux volets, liste factures, liste notifications)
- [ ] Onglet actif synchronisé avec `?tab=` et les liens de la sidebar client
- [ ] Onglet Notifications : liste réelle via l'API `notifications`, "Tout marquer comme lu" fonctionnel
- [ ] Onglet Factures : liste réelle dérivée de `Payment`, badges de statut corrects, téléchargement PDF (ou état "à venir" explicite si le backend PDF n'est pas encore traité)
- [ ] Onglet Messages : explicitement non connecté à un backend réel tant que `docs/features/messages.md` n'est pas traité (état vide ou feature flag documenté, jamais de faux endpoint)
- [ ] Tests : `useNotifications.test.ts`, `useInvoices.test.ts`, `useMarkNotificationsRead.test.ts`
- [ ] `docs/checklist-implementation.md` et `docs/mockup-reference.md` mis à jour à ✅
