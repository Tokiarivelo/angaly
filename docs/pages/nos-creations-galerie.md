# Page — `nos-creations-galerie`

**Statut : 🟡 Partiel.** Phase 1 — Présence digitale. Cœur de la page (header, tri, vue
grille/liste, grille masonry sur données réelles, chargement progressif) livré et testé ;
aperçu rapide, panneau de filtre mobile, chips de filtres actifs et filtres Genre/Couleur/
Style fonctionnels restent à faire — voir "Points d'attention".

## Objet

Galerie complète et navigable de toutes les créations de la maison, tous types confondus
(mariage, soirée, costume, sur mesure, collections, accessoires) — le catalogue de
découverte principal des réalisations, distinct de la courte sélection de `home` et de la
sélection curatée éditoriale de `la-une` (spec §7).

## Route(s)

`apps/web/src/app/(public)/creations/page.tsx` → `/creations`

`NosCreationsGaleriePage` est un Client Component (appelle react-query directement) — même
arbitrage assumé que `home`/`la-une`, voir leurs fiches respectives "Notes d'implémentation".

## Référence maquette

- Prompt Stitch : `stitch-prompts/03-nos-creations-galerie.md`
- Écran Stitch : **ANGALY — Nos Créations (Gallery Portfolio)**
- Section spécification : §7 (`docs/specifications/ANGALY_Specifications_Completes.md`)

## Arborescence de composants (livrée)

```
apps/web/src/features/nos-creations-galerie/
  ui/
    NosCreationsGaleriePage.tsx   → orchestre header + barre de filtres + grille + load-more
    GalleryHeader.tsx              → titre serif + intro + breadcrumb (Accueil / Nos Créations)
    FilterBar.tsx                  → 'use client' — Genre/Type/Catégorie/Couleur/Style (décoratifs,
                                      voir Points d'attention) + tri réel + toggle vue grille/liste
    ResultsCount.tsx                → « N créations » (total réel, pas statique)
    CreationCard.tsx                → carte (image, pill catégorie, titre serif, matériau,
                                      favori local — pas de persistance, Phase 2/customers)
    GalleryGrid.tsx                 → colonnes CSS masonry (grid) ou liste empilée (list)
    EmptyState.tsx
    LoadMoreButton.tsx              → 'use client' (chargement progressif, jamais de pagination lourde)
  hooks/
    useCreationsGallery.ts         → react-query, pagination page/limit accumulée, reset au tri
    useGalleryFilters.ts           → état tri + vue (grille/liste)
  api/
    nos-creations-galerie.api.ts   → useCreationsPageQuery
  consts/
    gallery-filters.const.ts       → libellés décoratifs + options de tri réelles
  types/
    gallery.types.ts
  __tests__/
    useCreationsGallery.test.ts
    useGalleryFilters.test.ts
    NosCreationsGaleriePage.test.tsx
  index.ts
```

**Non livré dans cette passe** (voir "Points d'attention") : `QuickViewModal`/`useQuickView`
(aperçu rapide), `MobileFilterSheet` (panneau plein écran mobile), `ActiveFilterChips`, et le
filtrage réel par Catégorie (dropdown rendu mais inerte, comme Genre/Couleur/Style).

Toute logique (fetch, tri, pagination) vit dans `hooks/` — `NosCreationsGaleriePage.tsx`
et les sections ne contiennent que du JSX + appels de hooks.

## Endpoints API consommés

| Endpoint | Module | Usage |
| --- | --- | --- |
| `GET /api/creations?page=&limit=&sort=` | `creations` | Liste paginée des créations (tri newest/featured), accumulée progressivement |

## Modèles Prisma touchés

`Creation` (`categoryId`, `collectionId`, `availability`, `materials`, `techniques`,
`isFeatured`), `Category` (`kind = CREATION`), `Media` (via `CreationMedia`), `Favorite`
(bouton favori de l'aperçu rapide, dépend de Phase 2/`customers`).

## Points d'attention

- **Fidélité vérifiée via `agy`/StitchMCP `get_screen`** (écran réel
  `c6cdd1c7965b4ac29619a0fcb6e0ba1a`), pas seulement `stitch-prompts/03-nos-creations-
  galerie.md` : la barre de filtres réelle n'a que 5 dropdowns (GENRE, TYPE, CATÉGORIE,
  COULEUR, STYLE) — pas de 6ᵉ filtre « Événement ». La grille réelle est un masonry CSS
  (`column-count` responsive 1/2/3), pas une CSS grid à spans explicites ; les cartes ont
  des ratios d'image variés (portrait majoritaire + un item large occasionnel), reproduits
  ici par un cycle fixe de ratios (`CreationCard.tsx`) faute de vraies photos.
- Le schéma Prisma ne modélise pas les filtres Genre/Couleur/Style comme des colonnes
  dédiées sur `Creation` — seuls `categoryId`, `collectionId` et le texte libre
  `materials`/`techniques` existent. Les 5 dropdowns du filtre sont donc **tous rendus de
  façon décorative** pour cette passe (y compris Catégorie, faute d'un endpoint listant les
  catégories) — voir `gallery-filters.const.ts`. Même limite documentée que
  `docs/pages/la-une.md` pour les filtres sans taxonomie réelle.
- **Reporté à une session ultérieure** (pas invalidé par la maquette, simplement hors
  périmètre de cette passe) : `QuickViewModal`/`useQuickView`, `MobileFilterSheet`,
  `ActiveFilterChips`, et le filtrage serveur réel par Catégorie (nécessiterait soit un
  endpoint de liste de catégories, soit une dérivation client depuis un premier fetch large).
- Le bouton favori est local uniquement (`useState` dans `CreationCard.tsx`, pas de
  persistance) — dépend de `customers`/Phase 2 pour un vrai état ; exposé à l'état non
  connecté plutôt que masqué, conformément à la consigne.
- « Voir plus de créations » reste du chargement progressif (page/limit accumulés côté
  client), jamais une pagination lourde ni un rechargement de page.

## Checklist d'acceptation

- [x] Tri (Plus récent / Mis en avant) + toggle vue grille/liste fonctionnels, fidèles à l'écran Stitch réel
- [x] Grille masonry sur données réelles (`GET /api/creations`), ratios d'image variés
- [x] État vide (« Aucune création ne correspond à ces filtres pour le moment »)
- [x] Chargement progressif (« Voir plus de créations ») sans rechargement de page
- [x] `<title>`/meta description définis (spec §70/§71)
- [x] Tests : `useCreationsGallery.test.ts`, `useGalleryFilters.test.ts`, `NosCreationsGaleriePage.test.tsx` — 10 tests, 100%/97%+/91%+/100% de couverture sur `nos-creations-galerie/ui`
- [ ] Barre de filtres Genre/Type/Catégorie/Couleur/Style réellement fonctionnelle (reporté — pas de taxonomie backend)
- [ ] Chips de filtres actifs + « Réinitialiser les filtres » (reporté avec le filtrage réel)
- [ ] Modale « Aperçu rapide » accessible (reporté)
- [ ] Panneau de filtre mobile plein écran (reporté)
- [x] `docs/checklist-implementation.md` et `docs/mockup-reference.md` mis à jour à 🟡
