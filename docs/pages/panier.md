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

Le panier (ajout/retrait d'articles avant commande) reste un état frontend volatile (Zustand), comme spécifié dans `docs/features/orders.md`. 
Aucun endpoint n'est consommé directement sur cette page avant le checkout.

## Modèles Prisma touchés

Aucun côté serveur pour cette page (le panier n'est pas persisté en base). La page interagit avec le store Zustand `useCartStore`.

## Points d'attention

- **Hypothèse clarifiée** : Conformément à `docs/features/orders.md`, le panier vit entièrement côté client (store Zustand + `localStorage`, clé dédiée) pour tous les utilisateurs (connectés ou non). Il n'est matérialisé en `Order` (`PENDING`) qu'au moment du checkout (via un POST `/api/orders`). Il n'y a donc pas de "fusion" serveur à faire.
- Le badge "Dernière pièce — stock limité" réutilise la logique de disponibilité de
  `pret-a-porter-catalogue`/`fiche-produit` (`ProductStatusBadge`) — ne pas dupliquer les règles
  de couleur.
- Le total affiché sur cette page reste **indicatif** : le total définitif (avec frais de
  livraison réels) n'est calculé qu'à l'étape Livraison du `checkout`.
- Mobile : icône panier flottante sticky (déjà prévue sur `pret-a-porter-catalogue`), résumé de
  commande transformé en barre sticky basse avec total et CTA "Passer la commande" toujours
  visibles.

## Checklist d'acceptation

- [ ] Reproduit fidèlement `stitch-prompts/10-*.md` Écran C (liste, résumé sticky, warning stock, code promo)
- [ ] Ajout/retrait/mise à jour de quantité fonctionnel pour tous via le store Zustand
- [ ] Code promo appliqué, résumé recalculé
- [ ] "Passer la commande" renvoie vers `checkout` (étape Expédition)
- [ ] État vide ("Continuer mes achats") conforme
- [ ] Tests : `PanierPage.test.tsx`
- [ ] `docs/checklist-implementation.md` et `docs/mockup-reference.md` mis à jour à ✅
