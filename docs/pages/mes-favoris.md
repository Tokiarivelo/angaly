# Page — `mes-favoris`

**Statut : ⬜ À faire.** Phase 2 — Conversion.

## Objet

Espace où le client retrouve les créations, produits et collections qu'il a sauvegardés
(spec §47), avec filtre par type et un CTA permettant de préparer un rendez-vous à partir de
ses favoris.

## Route(s)

`apps/web/src/app/(client)/mes-favoris/page.tsx` → `/mes-favoris`

Server Component pour le rendu initial de la grille, filtres et action de retrait hydratés
côté client après hydratation — même approche que `pret-a-porter-catalogue`.

## Référence maquette

- Prompt Stitch : `stitch-prompts/28-espace-client-favoris-messages.md` (Écran A — Mes favoris)
- Écran Stitch : **ANGALY — Mes favoris**
- Section spécification : §47 (`docs/specifications/ANGALY_Specifications_Completes.md`)

## Arborescence de composants attendue

```
apps/web/src/features/mes-favoris/
  ui/
    MesFavorisPage.tsx           → orchestre filtre + grille + CTA + état vide
    FavoriteTypeFilterTabs.tsx   → Toutes / Créations / Produits / Collections
    FavoritesGrid.tsx
    FavoriteCard.tsx              → réutilise le style des cartes création/produit + cœur de
                                     retrait + tag de type
    PrepareAppointmentCTA.tsx     → "Préparer un rendez-vous avec mes favoris"
    EmptyFavoritesState.tsx
  hooks/
    useFavorites.ts               → liste des favoris (filtrable par type) via react-query
    useToggleFavorite.ts          → retrait d'un favori (mutation optimiste)
    usePrepareAppointmentFromFavorites.ts → construit le contexte transmis à `prendre-rendez-vous`
  api/
    favorites.api.ts              → useFavoritesQuery, useRemoveFavoriteMutation
  consts/
    queryKeys.ts
  types/
    favorite-item.types.ts        → union résumé Création/Produit/Collection
  __tests__/
    useFavorites.test.ts
    useToggleFavorite.test.ts
    MesFavorisPage.test.tsx
  index.ts
```

Toute logique (chargement, filtre, retrait, préparation du rendez-vous) vit dans `hooks/` ; les
composants `ui/` restent purement présentationnels.

## Endpoints API consommés

| Endpoint | Module | Usage |
| --- | --- | --- |
| `GET /api/favorites?type=` | `customers` (modèle `Favorite`) | Liste des favoris du client connecté, entités résolues |
| `DELETE /api/favorites/:id` | `customers` (modèle `Favorite`) | Retrait d'un favori |

## Modèles Prisma touchés

`Favorite` (`customerId`, `entityType` — enum `FavoriteEntityType`, `entityId`), `Creation`,
`Product` (résolution polymorphe selon `entityType`), `Collection` (voir point d'attention),
`Customer`.

## Points d'attention

- **Écart de schéma sur `FavoriteEntityType.COLLECTION`** : `Favorite` déclare des relations
  Prisma explicites vers `Creation` (`favorites_creation_fkey`) et `Product`
  (`favorites_product_fkey`), mais **aucune relation équivalente vers `Collection`** — ni sur
  `Favorite`, ni en retour sur `Collection`. Le backend (`customers`) devra donc résoudre un
  favori `COLLECTION` par une requête manuelle sur `entityId` (pas de `include` Prisma
  possible), ou une migration ajoutant cette relation doit être envisagée — à trancher avec le
  module `customers` avant l'implémentation, ne pas présumer d'une jointure automatique.
- "Préparer un rendez-vous avec mes favoris" doit chaîner vers `prendre-rendez-vous` avec le
  contexte des favoris sélectionnés pré-rempli (query param ou état partagé) — même esprit que
  le CTA équivalent de `personnalisation-creation`/`demande-sur-mesure`.
- Le retrait d'un favori doit être **optimiste** (le cœur se vide instantanément) avec rollback
  silencieux en cas d'échec réseau, pour rester fluide sur une grille potentiellement large.
- Le filtre Toutes/Créations/Produits/Collections doit être synchronisé avec un query param
  (`?type=`) pour permettre le partage de lien et la navigation retour/avant, comme
  `pret-a-porter-catalogue`.
- Mobile : grille 2 colonnes, cohérent avec les autres grilles ANGALY (galerie, catalogue).

## Checklist d'acceptation

- [ ] Reproduit fidèlement `stitch-prompts/28-*.md` Écran A (filtre, grille, cœur de retrait, CTA, état vide)
- [ ] Filtres Toutes/Créations/Produits/Collections fonctionnels et synchronisés à l'URL
- [ ] Retrait d'un favori fonctionnel avec mise à jour optimiste
- [ ] "Préparer un rendez-vous avec mes favoris" renvoie vers `prendre-rendez-vous` avec le contexte pré-rempli
- [ ] État vide conforme (icône, message, CTA "Découvrir nos créations")
- [ ] Résolution correcte des favoris de type `COLLECTION` malgré l'absence de relation Prisma directe
- [ ] Tests : `useFavorites.test.ts`, `useToggleFavorite.test.ts`, `MesFavorisPage.test.tsx`
- [ ] `docs/checklist-implementation.md` et `docs/mockup-reference.md` mis à jour à ✅
