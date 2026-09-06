# Page — `pret-a-porter-catalogue`

**Statut : ⬜ À faire.** Phase 2 — Conversion.

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

## Checklist d'acceptation

- [ ] Reproduit fidèlement `stitch-prompts/08-pret-a-porter-catalogue.md` (filtres, grille, badges de statut)
- [ ] Les 5 statuts `ProductAvailability` s'affichent avec le bon style dédié
- [ ] Filtres (catégorie, taille, couleur, matière, disponibilité, prix) et tri fonctionnels et combinables
- [ ] Filtres synchronisés avec l'URL (query params partageables)
- [ ] Icône favori fonctionnelle pour un visiteur connecté, invite à se connecter sinon
- [ ] Pagination ou "Voir plus" fonctionnel
- [ ] Tests : `useCatalogueFilters.test.ts`, `useProducts.test.ts`, `PretAPorterCataloguePage.test.tsx`
- [ ] `docs/checklist-implementation.md` et `docs/mockup-reference.md` mis à jour à ✅
