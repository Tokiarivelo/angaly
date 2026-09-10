# Page — `pret-a-porter-catalogue`

**Statut : ✅ Fait.** Phase 2 — Conversion.

## Objet

Catalogue des vêtements prêt-à-porter disponibles immédiatement (spec §11), distinct des
créations pièce-unique (`creations`) : filtres (catégorie, taille, couleur, matière,
disponibilité, prix), tri, et grille de fiches produit avec badges de statut. Doit rester
perçu comme un corner boutique d'une maison de couture, pas un site e-commerce générique.

## Route(s)

`apps/web/src/app/(public)/pret-a-porter/page.tsx` → `/pret-a-porter`

Page **publique** — accessible sans compte, contrairement au reste du périmètre Phase 2 (voir
la note de routage de `docs/mockup-reference.md`). Server Component pour le rendu initial de
la grille (SEO produit), filtres et tri gérés côté client après hydratation.

## Référence maquette

- Prompt Stitch : `stitch-prompts/08-pret-a-porter-catalogue.md`
- Écran Stitch : **ANGALY — Prêt-à-porter Catalogue**
- Section spécification : §11 (`docs/specifications/ANGALY_Specifications_Completes.md`)

## Arborescence de composants attendue

```
apps/web/src/features/pret-a-porter-catalogue/
  ui/
    PretAPorterCataloguePage.tsx → orchestre header + filtres + grille + pagination
    CatalogueFilterBar.tsx        → catégorie, taille, couleur, matière, disponibilité, prix, tri
    ProductCard.tsx                → photo, badge statut, nom, référence, prix, swatches, favori
    ProductStatusBadge.tsx         → pill stylée par `ProductAvailability`
    ProductGrid.tsx                → grille responsive 3-4 colonnes desktop / 2 mobile
    MobileFilterSheet.tsx          → 'use client' panneau plein écran (mobile), état vient de useCatalogueFilters()
  hooks/
    useCatalogueFilters.ts         → état des filtres/tri, synchronisé avec les query params URL
    useProducts.ts                 → liste paginée des produits (react-query, dépend des filtres)
    useToggleFavorite.ts            → ajoute/retire un produit des favoris (icône cœur de la carte)
  api/
    products.api.ts                → useProductsQuery
    favorites.api.ts                → useToggleFavoriteMutation
  schemas/
    catalogue-filters.schema.ts     → Zod, validation des query params (prix min/max, enum disponibilité...)
  consts/
    queryKeys.ts
  __tests__/
    useCatalogueFilters.test.ts
    useProducts.test.ts
    PretAPorterCataloguePage.test.tsx
  index.ts
```

Toute logique (état des filtres, pagination, favoris) vit dans `hooks/` ; les composants
`ui/` restent purement présentationnels, conformément à `apps/web/src/features/README.md`.

## Endpoints API consommés

| Endpoint | Module | Usage |
| --- | --- | --- |
| `GET /api/products?category=&size=&color=&material=&status=&priceMin=&priceMax=&sort=&page=` | `products` | Liste filtrée/paginée des produits |
| `POST /api/favorites` / `DELETE /api/favorites/:id` | `customers` (modèle `Favorite`) | Ajout/retrait d'un produit aux favoris (uniquement si connecté) |

## Modèles Prisma touchés

`Product` (+ `ProductVariant` pour tailles/couleurs, `Inventory` pour la disponibilité réelle
sous-jacente au `status`), `Category` (filtre catégorie, `kind = PRODUCT`), `Media` (photos
produit), `Favorite` (état favori si l'utilisateur est connecté).

## Points d'attention

- Page **publique** placée dans `(public)`, pas `(client)` : l'achat en boutique classique et
  la simple consultation du catalogue ne requièrent pas de compte — seul le bouton favori
  déclenche une invite à se connecter si le visiteur n'est pas authentifié.
- Les 5 statuts (`Disponible`, `Dernière pièce`, `Épuisé`, `Sur commande`, `Réservé`) ont
  chacun un style dédié précis (voir prompt Stitch : pas de badge pour Disponible, pill
  warning pour Dernière pièce, image désaturée + pill grise pour Épuisé, pill soft-navy avec
  délai pour Sur commande, pill slate pour Réservé) — factoriser dans
  `ProductStatusBadge.tsx`, ne pas dupliquer la logique de couleur ailleurs.
- Les filtres doivent rester synchronisés avec l'URL (query params) pour permettre le
  partage d'un lien filtré et la navigation retour/avant du navigateur.
- Le prix doit toujours afficher la devise (`Product.currency`, `MGA` par défaut).
- Mobile : les filtres se replient dans un panneau plein écran ("Filtrer"), grille 2 colonnes,
  icône panier flottante sticky en bas à droite.
- Rester dans le registre boutique haut de gamme : pas de bannière de réduction ni de badge
  néon, même si le catalogue affiche prix et disponibilité (voir AVOID du prompt Stitch).
- **Écran réel vérifié en direct** cette session via `agy`/StitchMCP (`get_screen` + HTML/CSS
  littéral) — écarts constatés avec le prompt memo, tranchés en faveur de l'écran réel :
  - **Filtres en sidebar gauche (`w-64`, sticky), pas en barre horizontale** comme le
    prompt memo le décrivait — layout `CatalogueFilterBar.tsx` corrigé en conséquence.
  - **Seuls Catégorie/Taille/Couleur sont visuellement conçus** dans l'écran capturé
    (checkboxes avec compteurs décoratifs, grille de boutons tailles FR 34–44, swatches
    ronds). Matière/Disponibilité/Prix (requis par cette fiche et supportés par
    `products`) ont été ajoutés dans le même langage visuel, sous les 3 groupes réels —
    aucun élément de l'écran ne s'y oppose.
  - **Catégorie implémentée en sélection unique** (une checkbox cochée à la fois) : le
    filtre backend `categoryId` est une valeur unique, pas un tableau — l'UI en
    checkboxes visuelle de l'écran réel est conservée, mais son comportement est
    radio-like plutôt que multi-sélection.
  - **Tri réel : seulement 3 options** (Nouveautés, Prix croissant, Prix décroissant) —
    pas de "Populaires" comme le memo le suggérait ; correspond exactement aux 3 valeurs
    supportées par `GET /api/products?sort=`.
  - **Pagination numérotée (chevrons + "n / total")**, pas "Voir plus" — reproduit
    exactement l'écran réel.
  - **Prix affichés en €** dans l'export Stitch (données de démo générées par l'IA) —
    non repris : `ProductCard.tsx` utilise `formatPriceAriary()` (déjà utilisé ailleurs
    dans le projet) sur `Product.price.currency` réel (`MGA`).
  - **Icône panier (badge "2" dans la nav) et FAB panier flottant mobile non
    implémentés** : le panier est explicitement hors périmètre de `products`
    (`docs/features/products.md` "Points d'attention", renvoyé à `orders` Phase 3) — rien
    n'affiche de panier tant que ce module n'existe pas, plutôt que d'afficher un badge
    non fonctionnel.
- **Favoris : première intégration frontend réelle de `customers`** (jusqu'ici
  `nos-creations-galerie`'s bouton favori était local-only, faute de backend) — bascule
  auth-gated via `useSession()` (NextAuth) : un visiteur non connecté est redirigé vers
  `/connexion?redirectTo=...` plutôt que d'appeler l'API, un visiteur connecté appelle
  vraiment `POST`/`DELETE /api/favorites`.

## Checklist d'acceptation

- [x] Reproduit fidèlement l'écran Stitch réel (sidebar de filtres, grille, badges de statut) — vérifié en direct
- [x] Les 5 statuts `ProductAvailability` s'affichent avec le bon style dédié (`ProductStatusBadge.tsx`)
- [x] Filtres (catégorie, taille, couleur, matière, disponibilité, prix) et tri fonctionnels et combinables
- [x] Filtres synchronisés avec l'URL (query params partageables, back/forward navigables)
- [x] Icône favori fonctionnelle pour un visiteur connecté (vrai appel API), invite à se connecter sinon
- [x] Pagination fonctionnelle (chevrons + "n / total", reproduit l'écran réel)
- [x] Tests : `useCatalogueFilters.test.ts`, `useProducts.test.ts`, `PretAPorterCataloguePage.test.tsx`
      (+ `catalogue-filters.schema.test.ts`, `ProductStatusBadge.test.tsx`)
- [x] `docs/checklist-implementation.md` et `docs/mockup-reference.md` mis à jour à ✅
