# Phase 3 — Production

**Statut : ✅ Complète (6/6 pages câblées).** Dépend de : Phase 2 (`auth`, `customers`,
`products`, `appointments`, `quotes`). Modules backend `orders`/`payments`/`notifications`/
`messages` : ✅.
**Mise à jour 2026-09-16 (session 1)** : l'étape 4 de l'"Ordre suggéré" (câblage des 6 pages aux
API réelles) est traitée — `panier`, `checkout`, `espace-client-dashboard`, `mes-rendez-vous`,
`suivi-commande` sont désormais ✅ (câblage API réel, tests passants). Deux nouveaux endpoints
ont été ajoutés au passage (`GET /api/appointments` liste-mine, `GET /api/payments`
liste-par-client), tous deux testés (unit + integration). `messages-factures-notifications`
restait 🟡 : ses onglets Notifications et Factures étaient câblés pour de vrai, mais son onglet
Messages restait intentionnellement non connecté (aucun modèle `Message`/`Conversation`).
**Mise à jour 2026-09-16 (session 2)** : le gap Messages est fermé. Nouveau module
`apps/api/src/messages/` (`Conversation`/`Message`, migration
`20260916035657_add_conversation_message`) + câblage frontend réel de l'onglet Messages —
voir `docs/features/messages.md`. Les trois onglets de `messages-factures-notifications` sont
désormais câblés pour de vrai ; **Phase 3 est donc entièrement ✅** au sens de sa "Vérification
de sortie de phase" ci-dessous. Écarts documentés qui restent hors périmètre de cette
vérification (déjà acceptés comme tels avant cette session, non spécifiques à
`messages-factures-notifications`) : WhatsApp non branché, `MESSAGE_RECEIVED` désormais câblé
mais `quotes`/`patterns`/`create-appointment`/`cancel-appointment`/`refund-payment` toujours
sans notification (voir `docs/features/notifications.md`), pas de boîte de réception staff
pour `messages` (voir `docs/features/messages.md`), pas de génération de PDF de facture.

## Objectif (spec §101, Phase 3)

Commandes, paiements, suivi de confection, espace client complet, notifications. C'est la
phase qui rend le parcours d'achat/production réellement transactionnel de bout en bout.

## Pages en scope

| Page | Fiche |
| --- | --- |
| panier | `docs/pages/panier.md` |
| checkout | `docs/pages/checkout.md` |
| espace-client-dashboard | `docs/pages/espace-client-dashboard.md` |
| mes-rendez-vous | `docs/pages/mes-rendez-vous.md` |
| suivi-commande | `docs/pages/suivi-commande.md` |
| messages-factures-notifications | `docs/pages/messages-factures-notifications.md` |

## Modules backend en scope

`orders`, `payments`, `notifications`, `messages`.

## Ordre suggéré

1. ✅ `orders` (panier → commande, statuts spec §97) → pages `panier`, `checkout` (module
   backend fait, pages restent 🟡)
2. ✅ `payments` (couche d'abstraction — spec §59 : Mobile Money, carte, virement, à la
   livraison ; ne pas coupler le domaine à un prestataire précis)
3. ✅ `notifications` (email SMTP générique + notification web — session 2026-09-15). WhatsApp
   **non branché** : aucun fournisseur (Twilio, WhatsApp Business API, Meta Cloud API…) n'est
   confirmé à ce jour — `whatsapp-channel.adapter.ts` reste un stub non enregistré, écart
   documenté dans `docs/features/notifications.md` "Points d'attention". Câblage dans
   `orders`/`payments`/`appointments` fait ; `quotes`/`patterns`/`create-appointment`/
   `cancel-appointment`/`refund-payment` restent TODO (voir `docs/features/notifications.md`
   "Points d'intégration").
4. ✅ `espace-client-dashboard`, `mes-rendez-vous` (complète Phase 2's `prendre-rendez-vous`
   avec une vue liste/gestion), `suivi-commande` (timeline spec §54-55),
   `messages-factures-notifications` (Notifications/Factures/Messages câblés pour de vrai —
   nouveau module `messages`, voir `docs/features/messages.md`) — `panier`/`checkout` câblés
   aux API `orders`/`payments` ✅
5. ✅ `messages` (`Conversation`/`Message`, find-or-create staff-only pour démarrer un fil,
   `MESSAGE_RECEIVED` câblé côté staff — voir `docs/features/messages.md`)

## Points d'attention

- `checkout` doit rester calme et sobre (voir `stitch-prompts/10-*.md` : "avoid aggressive
  discount banners, neon urgency messaging") — pas de patterns e-commerce agressifs.
- Le statut de commande (`OrderStatus`) et le statut de suivi sur-mesure (timeline de
  `suivi-commande`) ne sont pas le même modèle : une commande prêt-à-porter suit
  `OrderStatus`, une création sur-mesure suit son propre pipeline (spec §54-55) — clarifier
  lequel s'applique à quelle carte dans `docs/pages/suivi-commande.md` avant de coder.

## Vérification de sortie de phase

- [x] Un client peut acheter un article prêt-à-porter de bout en bout (panier → `POST
      /api/orders` → `POST /api/payments` → confirmation) et suivre sa commande depuis son
      espace client — câblage API réel vérifié par tests (pas de test e2e Playwright ajouté
      cette session)
- [x] `docs/checklist-implementation.md` : 6/6 pages + 4 modules passés à ✅
- [x] Notifications déclenchées sur au moins : rendez-vous confirmé, commande créée, statut de
      commande changé (déjà acquis avant cette session, voir `docs/features/notifications.md`),
      message reçu d'un membre de l'atelier (`MESSAGE_RECEIVED`, nouveau cette session — voir
      `docs/features/messages.md`)
- [x] Un client peut échanger avec l'atelier depuis son espace client (liste des fils, lecture,
      envoi de message) — câblage API réel vérifié par tests ; démarrer un nouveau fil reste
      staff-only et sans UI dédiée dans cette phase (voir `docs/features/messages.md`)

**Phase 3 est donc fermée** pour le périmètre de sa "Vérification de sortie de phase" — les
écarts encore ouverts (WhatsApp, notifications `quotes`/`patterns`/`create-appointment`/
`cancel-appointment`/`refund-payment`, PDF de facture, boîte de réception staff `messages`)
sont chacun documentés dans leur fiche `docs/features/*.md` respective et n'étaient déjà pas
couverts par cette vérification avant cette session.

## Phase suivante

`docs/phases/phase-4-premium-pattern-studio.md`.
