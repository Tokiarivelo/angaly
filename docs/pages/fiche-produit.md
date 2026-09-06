# Page — `fiche-produit`

**Statut : ⬜ À faire.** Phase 2 — Conversion.

## Objet

Page détail d'un produit prêt-à-porter (spec §12) : galerie, prix, tailles, couleur, matière,
description, disponibilité, produits similaires, avec les actions Ajouter au panier, Réserver
pour essayage, Prendre rendez-vous, Ajouter aux favoris, Contacter Angaly.

## Route(s)

`apps/web/src/app/(public)/pret-a-porter/[slug]/page.tsx` → `/pret-a-porter/:slug`

Page **publique**, comme `pret-a-porter-catalogue` (voir note de routage de
`docs/mockup-reference.md`). Server Component pour le contenu produit (SEO), galerie et
panneau d'achat hydratés côté client pour l'interactivité (sélection taille/couleur,
quantité).

## Référence maquette

- Prompt Stitch : `stitch-prompts/09-fiche-produit.md`
- Écran Stitch : **ANGALY — Robe Solène (Product Page)**
- Section spécification : §12 (`docs/specifications/ANGALY_Specifications_Completes.md`)

## Arborescence de composants attendue

```
apps/web/src/features/fiche-produit/
  ui/
    FicheProduitPage.tsx        → layout deux colonnes (galerie + panneau d'achat)
    ProductGallery.tsx          → image principale + filmstrip + lightbox zoom
    PurchasePanel.tsx           → titre, référence, prix, disponibilité, sélecteurs, actions (sticky desktop)
    SizeSelector.tsx            → chips de taille (état sélectionné rempli navy)
    ColorSelector.tsx           → swatches circulaires (anneau navy fin si sélectionné)
    QuantityStepper.tsx         → +/- minimal
    ProductActionsGroup.tsx     → Ajouter au panier / Réserver pour essayage / Prendre rendez-vous / Favoris / Contacter
    ProductDetailsTabs.tsx      → onglets Description / Matière & entretien / Livraison & retours
    SimilarProductsRow.tsx      → réutilise ProductCard de `pret-a-porter-catalogue`
  hooks/
    useProduct.ts                → charge le produit par `slug` (variantes incluses) via react-query
    useProductVariantSelection.ts→ état taille/couleur sélectionnés → résout le `ProductVariant`/`Inventory`
    useAddToCart.ts               → mutation d'ajout au panier (Zustand + sync serveur si connecté)
    useToggleFavorite.ts          → ajoute/retire des favoris
    useSimilarProducts.ts         → produits similaires (même catégorie)
  api/
    products.api.ts               → useProductQuery, useSimilarProductsQuery
    cart.api.ts                   → useAddToCartMutation
    favorites.api.ts              → useToggleFavoriteMutation
  consts/
    queryKeys.ts
  __tests__/
    useProduct.test.ts
    useProductVariantSelection.test.ts
    useAddToCart.test.ts
  index.ts
```

Toute logique (résolution de variante, panier, favoris) vit dans `hooks/` ; `PurchasePanel.tsx`
et les autres composants `ui/` ne contiennent que du JSX + appels de hooks.

## Endpoints API consommés

| Endpoint | Module | Usage |
| --- | --- | --- |
| `GET /api/products/:slug` | `products` | Détail produit + variantes + médias |
| `GET /api/products?category=&exclude=&limit=4` | `products` | Produits similaires |
| `POST /api/cart/items` | `products` (panier, ou module `orders` selon découpage retenu à l'implémentation) | Ajout au panier |
| `POST /api/favorites` / `DELETE /api/favorites/:id` | `customers` (modèle `Favorite`) | Ajout/retrait des favoris |

## Modèles Prisma touchés

`Product` (description, prix, statut), `ProductVariant` (taille, couleur, matière,
`priceOverride`), `Inventory` (`quantityAvailable`/`quantityReserved` sous-jacents au badge
de disponibilité), `Media` (galerie), `Favorite`.

## Points d'attention

- Le badge de disponibilité (`ProductStatusBadge`, partagé avec `pret-a-porter-catalogue`)
  doit refléter le statut de la **variante sélectionnée**, pas uniquement `Product.status` —
  une robe peut être "Dernière pièce" en taille M mais "Épuisé" en taille S.
- "Réserver pour essayage" doit chaîner vers `reservation-essayage` avec le produit et la
  taille déjà sélectionnés pré-remplis (ne pas faire ressaisir le contexte).
- "Ajouter au panier" désactivé si la variante sélectionnée est `OUT_OF_STOCK`/`RESERVED` —
  proposer alors "Réserver pour essayage" ou "Prendre rendez-vous" comme alternative visible.
- Page **publique** : l'ajout au panier doit fonctionner pour un visiteur non connecté
  (panier en session/localStorage via Zustand), la synchronisation serveur n'intervenant qu'à
  la connexion/au checkout.
- Mobile : galerie en carrousel plein écran en haut, panneau d'achat non sticky en dessous,
  barre d'action sticky en bas avec "Ajouter au panier" (primaire) + icône "Réserver pour
  essayage" (secondaire).

## Checklist d'acceptation

- [ ] Reproduit fidèlement `stitch-prompts/09-fiche-produit.md` (galerie avec lightbox, panneau d'achat, onglets, produits similaires)
- [ ] Sélection taille/couleur résout correctement la variante et son statut de disponibilité
- [ ] "Ajouter au panier" fonctionnel pour visiteur connecté et non connecté
- [ ] "Réserver pour essayage" renvoie vers `reservation-essayage` avec produit/taille pré-remplis
- [ ] "Ajouter aux favoris" fonctionnel pour un visiteur connecté, invite à se connecter sinon
- [ ] Onglets Description / Matière & entretien / Livraison & retours accessibles au clavier
- [ ] Tests : `useProduct.test.ts`, `useProductVariantSelection.test.ts`, `useAddToCart.test.ts`
- [ ] `docs/checklist-implementation.md` et `docs/mockup-reference.md` mis à jour à ✅
