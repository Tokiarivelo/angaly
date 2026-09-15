# Phase 3 — Production

**Statut : 🟡 En cours.** Dépend de : Phase 2 (`auth`, `customers`, `products`, `appointments`,
`quotes`). Modules backend `orders`/`payments`/`notifications` : ✅ (`notifications` livré
session 2026-09-15, voir `docs/features/notifications.md`). Les 6 pages listées ci-dessous
restent 🟡 (UI/store créés, non câblées aux API) — reste l'étape 4 de l'"Ordre suggéré".

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

`orders`, `payments`, `notifications`.

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
4. ⬜ `espace-client-dashboard`, `mes-rendez-vous` (complète Phase 2's `prendre-rendez-vous`
   avec une vue liste/gestion), `suivi-commande` (timeline spec §54-55),
   `messages-factures-notifications` — et câbler `panier`/`checkout` aux API `orders`/`payments`

## Points d'attention

- `checkout` doit rester calme et sobre (voir `stitch-prompts/10-*.md` : "avoid aggressive
  discount banners, neon urgency messaging") — pas de patterns e-commerce agressifs.
- Le statut de commande (`OrderStatus`) et le statut de suivi sur-mesure (timeline de
  `suivi-commande`) ne sont pas le même modèle : une commande prêt-à-porter suit
  `OrderStatus`, une création sur-mesure suit son propre pipeline (spec §54-55) — clarifier
  lequel s'applique à quelle carte dans `docs/pages/suivi-commande.md` avant de coder.

## Vérification de sortie de phase

- Un client peut acheter un article prêt-à-porter de bout en bout (panier → paiement →
  confirmation) et suivre sa commande depuis son espace client (e2e Playwright)
- `docs/checklist-implementation.md` : les 6 pages + 3 modules passés à ✅
- Notifications déclenchées sur au moins : rendez-vous confirmé, commande créée, statut de
  commande changé

## Phase suivante

`docs/phases/phase-4-premium-pattern-studio.md`.
