# Page — `fiche-produit`

**Statut : ✅ Fait.** Phase 2 — Conversion.

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
    FicheProduitPage.tsx        → layout deux colonnes (galerie + panneau d'achat) ; possède useProductVariantSelection()
    ProductGallery.tsx          → image principale + filmstrip + lightbox zoom ; reçoit `selectedVariant`, bascule sur ses photos si présentes
    PurchasePanel.tsx           → titre, référence, prix, disponibilité, sélecteurs, actions (sticky desktop) ; reçoit `variantSelection` en prop
    SizeSelector.tsx            → chips de taille (état sélectionné rempli navy)
    ColorSelector.tsx           → swatches circulaires (anneau navy fin si sélectionné)
    QuantityStepper.tsx         → +/- minimal
    ProductActionsGroup.tsx     → Ajouter au panier / Réserver pour essayage / Prendre rendez-vous / Favoris / Contacter
    ProductDetailsTabs.tsx      → onglets Description / Matière & entretien / Livraison & retours
    SimilarProductsRow.tsx      → réutilise ProductCard de `pret-a-porter-catalogue`
  hooks/
    useProduct.ts                → charge le produit par `slug` (variantes incluses) via react-query
    useProductVariantSelection.ts→ état taille/couleur sélectionnés → résout le `ProductVariant`/`Inventory` (possédé par `FicheProduitPage`, partagé entre `ProductGallery` et `PurchasePanel`)
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
de disponibilité), `Media` (galerie du produit **et**, depuis cette session, galerie propre à
une variante via la relation many-to-many `ProductVariant.media`/`Media.productVariantRefs` —
voir "Couleurs de variante" ci-dessous), `Favorite`.

## Points d'attention

- **Écran réel vérifié en direct** cette session via `agy`/StitchMCP (`get_screen` + HTML/CSS
  littéral) — écarts constatés avec le prompt memo/cette fiche, tranchés en faveur de l'écran
  réel :
  - **Pas de `ProductStatusBadge` (pill coin, catalogue) sur cette page** : l'écran réel
    affiche un indicateur point + libellé ("En stock" en vert), toujours visible y compris
    pour AVAILABLE — traitement différent, dédié, dans `ProductStatusIndicator.tsx`.
  - **`ProductVariant` n'a pas de champ de statut propre** dans le schéma (seulement
    `quantityAvailable`/`quantityReserved`) : le "Dernière pièce en M mais Épuisé en S"
    décrit plus haut n'est pas littéralement supporté par un enum par variante.
    `PurchasePanel.tsx` calcule un statut effectif honnête à la place
    (`resolveVariantStatus()`, testé) : la variante sélectionnée sans stock réel affiche
    toujours OUT_OF_STOCK, quel que soit `Product.status` ; sinon le statut produit
    s'applique (seule granularité que le schéma offre réellement).
  - **4 actions réelles, pas 5** : "Contacter Angaly" n'apparaît pas sur l'écran capturé —
    seuls Ajouter au panier / Réserver pour essayage / Prendre rendez-vous / Favoris sont
    implémentés.
  - **Icône panier (badge count) dans la nav du header partagé non implémentée** — même
    raisonnement que `pret-a-porter-catalogue` : pas de concept panier partagé site-wide
    tant qu'`orders` (Phase 3) n'existe pas ; seul le bouton "Ajouter au panier" de cette
    page fonctionne (store Zustand local).
- "Réserver pour essayage" chaîne vers `reservation-essayage` avec `productId` et la taille
  sélectionnée en query params (page cible pas encore construite, ⬜ — lien ajouté quand même,
  voir `routes.ts`).
- "Ajouter au panier" désactivé si le statut effectif de la variante sélectionnée est
  `OUT_OF_STOCK`/`RESERVED` — "Réserver pour essayage"/"Prendre rendez-vous" restent les
  alternatives visibles.
- **Panier local uniquement** (`stores/cart.store.ts`, Zustand + `persist` localStorage,
  `{name: 'angaly-cart'}`) : fonctionne pour un visiteur connecté ou non, **aucun appel
  serveur** — `POST /api/cart/items` n'existe pas (`docs/features/products.md` "Points
  d'attention", renvoyé à `orders` Phase 3). Pas de fichier `api/cart.api.ts` en
  conséquence : `useAddToCart.ts` appelle directement le store.
- **Onglets** : `@radix-ui/react-tabs` (nouvelle dépendance, installée cette session) —
  navigation clavier native (flèches + Entrée/Espace), répond à l'exigence d'accessibilité.
  Seul l'onglet Description a un contenu réel capturé sur l'écran ; Matière & entretien /
  Livraison & retours affichent le meilleur contenu disponible (matière de la variante
  sélectionnée + texte de politique générique) faute de champ Prisma dédié.
- **`SimilarProductsRow.tsx` réutilise `ProductCard` de `pret-a-porter-catalogue`** — seul
  import cross-feature sanctionné par cette fiche elle-même ; l'écran réel montre une carte
  plus simple (image + nom + prix, sans badge ni favori), mais `ProductCard` est un
  sur-ensemble qui ne contredit rien de décidé par la maquette.
- **Couleurs de variante** (`ColorSelector.tsx`) : la fiche produit utilise des noms français
  descriptifs ("Bleu Nuit") alors que le catalogue utilise des noms anglais de filtre
  ("Navy") — aucun champ hex n'existe côté Prisma. `@/lib/color-swatches.ts` (partagé avec
  `pret-a-porter-catalogue/ProductCard.tsx`) couvre les deux vocabulaires avec un repli
  neutre pour tout nom non reconnu.
- **La galerie change de photos selon la couleur choisie** (`ProductGallery.tsx`) : le
  sélecteur `ColorSelector`/`useProductVariantSelection` est désormais possédé par
  `FicheProduitPage.tsx` (et non plus `PurchasePanel.tsx`) pour que `ProductGallery`, son
  voisin, reçoive le même `selectedVariant` — `ProductVariantDto.media` remplace
  entièrement `ProductDto.media` quand la variante sélectionnée a ses propres photos, et
  n'affiche la galerie partagée du produit que pour une variante qui n'en a pas (cas par
  défaut aujourd'hui : seul un sous-ensemble des produits seedés a des photos par couleur —
  voir `packages/database/prisma/seed.ts`). `useGalleryLightbox.ts` recale `activeIndex` sur
  0 s'il pointe au-delà du nombre de photos de la nouvelle couleur (ex. on regardait la 4ᵉ
  photo, la nouvelle couleur n'en a que 2).

## Checklist d'acceptation

- [x] Reproduit fidèlement l'écran Stitch réel (galerie avec lightbox, panneau d'achat, onglets, produits similaires) — vérifié en direct
- [x] Sélection taille/couleur résout correctement la variante et son statut de disponibilité effectif (`resolveVariantStatus.test.ts`)
- [x] "Ajouter au panier" fonctionnel pour visiteur connecté et non connecté (panier local Zustand, pas de backend requis)
- [x] "Réserver pour essayage" renvoie vers `reservation-essayage` avec produit/taille pré-remplis (query params)
- [x] "Ajouter aux favoris" fonctionnel pour un visiteur connecté (vrai appel API), invite à se connecter sinon
- [x] Onglets Description / Matière & entretien / Livraison & retours accessibles au clavier (Radix Tabs)
- [x] Tests : `useProduct.test.ts`, `useProductVariantSelection.test.ts`, `useAddToCart.test.ts`
      (+ `resolveVariantStatus.test.ts`, `FicheProduitPage.test.tsx`, `ProductGallery.test.tsx`,
      `useGalleryLightbox.test.ts`)
- [x] Choisir une couleur ayant ses propres photos remplace la galerie ; une couleur sans
      photo dédiée retombe sur la galerie partagée du produit (`ProductGallery.test.tsx`)
- [x] `docs/checklist-implementation.md` et `docs/mockup-reference.md` mis à jour à ✅
- [ ] `docs/checklist-implementation.md` et `docs/mockup-reference.md` mis à jour à ✅
