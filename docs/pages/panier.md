# Page — `panier`

**Statut : ⬜ À faire.** Phase 3 — Production.

## Objet

Panier d'achat prêt-à-porter (spec §14) : liste des articles ajoutés, gestion des quantités,
avertissement de stock limité, code promo, et résumé de commande avant passage au `checkout`.

## Route(s)

`apps/web/src/app/(public)/panier/page.tsx` → `/panier`

Page **publique**, comme `pret-a-porter-catalogue`/`fiche-produit` — le panier doit être
consultable et modifiable sans compte (voir point d'attention sur le guest checkout). Server
Component pour le rendu initial, liste et résumé hydratés côté client pour l'interactivité
(quantités, code promo).

## Référence maquette

- Prompt Stitch : `stitch-prompts/10-essayage-panier-checkout.md` (Écran C — Panier)
- Écran Stitch : **ANGALY — Votre Panier**
- Section spécification : §14 (`docs/specifications/ANGALY_Specifications_Completes.md`)

## Arborescence de composants attendue

```
apps/web/src/features/panier/
  ui/
    PanierPage.tsx           → layout deux colonnes (liste + résumé)
    CartLineItemRow.tsx       → vignette, nom, taille/couleur, stepper quantité, prix unitaire,
                                 total ligne, icône suppression
    StockWarningTag.tsx       → "Dernière pièce — stock limité" (ton warning)
    CartSummaryCard.tsx       → sous-total, livraison estimée, total, champ code promo, CTA
    PromoCodeInput.tsx
    ContinueShoppingLink.tsx  → bouton secondaire "Continuer mes achats"
    EmptyCartState.tsx
  hooks/
    useCart.ts                → état du panier (store Zustand persistant en `localStorage`),
                                 source de vérité pour un visiteur non connecté
    useCartSync.ts             → fusionne le panier local avec l'`Order PENDING` serveur à la
                                 connexion, pour un client déjà authentifié
    useUpdateCartItemQuantity.ts, useRemoveCartItem.ts
    useApplyPromoCode.ts
    useCartTotals.ts           → calcule sous-total/livraison estimée/total (affichage indicatif)
  api/
    cart.api.ts                → useOrderPendingQuery, useUpdateOrderItemMutation,
                                 useRemoveOrderItemMutation, useApplyPromoCodeMutation
  consts/
    queryKeys.ts, cart-storage-key.const.ts → clé `localStorage` du store Zustand
  types/
    cart-item.types.ts
  __tests__/
    useCart.test.ts
    useCartSync.test.ts
    PanierPage.test.tsx
  index.ts
```

Toute logique (état du panier, fusion à la connexion, quantités, code promo) vit dans `hooks/` ;
`PanierPage.tsx` et les composants `ui/` ne contiennent que du JSX + appels de hooks.

## Endpoints API consommés

| Endpoint | Module | Usage |
| --- | --- | --- |
| `GET /api/orders/pending` | `orders` | Panier serveur (`Order` statut `PENDING`) d'un client connecté, avec ses `OrderItem` |
| `POST /api/orders/pending/items` / `PATCH .../items/:id` / `DELETE .../items/:id` | `orders` | Ajout/mise à jour de quantité/retrait — client connecté uniquement |
| `POST /api/orders/pending/promo-code` | `orders` | Application d'un code promo |

> Pour un visiteur non connecté, aucun de ces endpoints n'est appelé tant que le checkout n'a
> pas démarré — voir le point d'attention ci-dessous sur la contrainte de schéma.

## Modèles Prisma touchés

`Order` (statut `PENDING`, `subtotal`, `shippingCost`, `total`, `currency`, `customerId` — voir
point d'attention), `OrderItem` (`productVariantId`, `quantity`, `unitPrice`),
`ProductVariant` + `Inventory` (résolution du statut/stock pour l'avertissement "Dernière
pièce"), `Customer`.

## Points d'attention

- **Hypothèse explicite (le spec §14 ne tranche pas ce point, "Prévoir éventuellement")** :
  `Order.customerId` est **non-nullable** dans `packages/database/prisma/schema.prisma` — un
  panier de visiteur non connecté ne peut donc **pas** être persisté comme un `Order` réel.
  Décision retenue ici : le panier vit entièrement côté client (store Zustand + `localStorage`,
  clé dédiée) pour un visiteur non connecté, et n'est matérialisé en `Order` (`PENDING`) qu'au
  moment où l'étape "Expédition" de `checkout` crée ou rattache un `Customer` (compte existant,
  connexion, ou création d'un compte minimal — voir `docs/pages/checkout.md`). Pour un client
  déjà connecté, le panier peut être une véritable `Order PENDING` mise à jour en direct à
  chaque changement. Cette hypothèse est à valider avec le module `orders` avant
  l'implémentation.
- Le badge "Dernière pièce — stock limité" réutilise la logique de disponibilité de
  `pret-a-porter-catalogue`/`fiche-produit` (`ProductStatusBadge`) — ne pas dupliquer les règles
  de couleur.
- Le total affiché sur cette page reste **indicatif** : le total définitif (avec frais de
  livraison réels) n'est calculé qu'à l'étape Livraison du `checkout`.
- Fusion à la connexion : si un visiteur avec un panier local se connecte pendant sa session,
  fusionner les lignes locales avec l'`Order PENDING` existant côté serveur (ou en créer un)
  sans perte d'article, avec une résolution de conflit simple (addition des quantités).
- Mobile : icône panier flottante sticky (déjà prévue sur `pret-a-porter-catalogue`), résumé de
  commande transformé en barre sticky basse avec total et CTA "Passer la commande" toujours
  visibles.

## Checklist d'acceptation

- [ ] Reproduit fidèlement `stitch-prompts/10-*.md` Écran C (liste, résumé sticky, warning stock, code promo)
- [ ] Ajout/retrait/mise à jour de quantité fonctionnel pour visiteur connecté et non connecté (persistance `localStorage` pour ce dernier)
- [ ] Fusion du panier local avec l'`Order` serveur à la connexion sans perte d'article
- [ ] Code promo appliqué, résumé recalculé
- [ ] "Passer la commande" renvoie vers `checkout` (étape Expédition)
- [ ] État vide ("Continuer mes achats") conforme
- [ ] Tests : `useCart.test.ts`, `useCartSync.test.ts`, `PanierPage.test.tsx`
- [ ] `docs/checklist-implementation.md` et `docs/mockup-reference.md` mis à jour à ✅
