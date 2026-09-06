# Page — `nos-creations-galerie`

**Statut : ⬜ À faire.** Phase 1 — Présence digitale.

## Objet

Galerie complète et navigable de toutes les créations de la maison, tous types confondus
(mariage, soirée, costume, sur mesure, collections, accessoires) — le catalogue de
découverte principal des réalisations, distinct de la courte sélection de `home` et de la
sélection curatée éditoriale de `la-une` (spec §7).

## Route(s)

`apps/web/src/app/(public)/creations/page.tsx` → `/creations`

Server Component par défaut pour la grille (SEO du catalogue, spec §71) ; la barre de
filtres, le tri, le toggle grille/masonry, la modale d'aperçu rapide et le panneau de
filtre mobile sont des Client Components isolés à l'intérieur du feature.

## Référence maquette

- Prompt Stitch : `stitch-prompts/03-nos-creations-galerie.md`
- Écran Stitch : **ANGALY — Nos Créations (Gallery Portfolio)**
- Section spécification : §7 (`docs/specifications/ANGALY_Specifications_Completes.md`)

## Arborescence de composants attendue

```
apps/web/src/features/nos-creations-galerie/
  ui/
    NosCreationsGaleriePage.tsx   → orchestre header + barre de filtres + grille + pagination
    GalleryHeader.tsx              → titre serif + intro + breadcrumb (Accueil / Nos Créations)
    FilterBar.tsx                  → 'use client' pilules/dropdowns (Genre, Type, Catégorie, Couleur, Style, Événement) + tri + toggle grille/masonry
    ActiveFilterChips.tsx          → 'use client' chips des filtres actifs + « Réinitialiser les filtres »
    ResultsCount.tsx                → « 128 créations »
    CreationCard.tsx                → carte (image, tag catégorie, titre serif, hover overlay aperçu rapide + favori)
    QuickViewModal.tsx              → 'use client' (état vient de useQuickView())
    EmptyState.tsx                  → illustration champagne + message + reset
    LoadMoreButton.tsx              → 'use client' (chargement progressif)
    MobileFilterSheet.tsx           → 'use client' panneau plein écran mobile, bouton sticky « Voir les résultats »
  hooks/
    useCreationsGallery.ts         → react-query, filtres + tri + pagination curseur/offset
    useGalleryFilters.ts           → état des filtres actifs, synchro avec la querystring
    useQuickView.ts                 → état d'ouverture de la modale + création sélectionnée
  api/
    nos-creations-galerie.api.ts   → useCreationsGalleryQuery
  consts/
    gallery-filters.const.ts       → options Genre/Type/Catégorie/Couleur/Style/Événement, options de tri
    queryKeys.ts
  types/
    gallery-filters.types.ts
  __tests__/
    useCreationsGallery.test.ts
    useGalleryFilters.test.ts
    NosCreationsGaleriePage.test.tsx
  index.ts
```

Toute logique (fetch, filtres, pagination, modale) vit dans `hooks/` — `NosCreationsGaleriePage.tsx`
et les sections ne contiennent que du JSX + appels de hooks.

## Endpoints API consommés

| Endpoint | Module | Usage |
| --- | --- | --- |
| `GET /api/creations?categoryId=&collectionId=&isFeatured=&sort=&page=&limit=` | `creations` | Liste paginée des créations, filtrée par catégorie/collection |
| `GET /api/search?types=creations&...` | `search` | (Phase 1, limité) comptage/disponibilité des facettes non modélisées en Prisma — voir Points d'attention |

## Modèles Prisma touchés

`Creation` (`categoryId`, `collectionId`, `availability`, `materials`, `techniques`,
`isFeatured`), `Category` (`kind = CREATION`), `Media` (via `CreationMedia`), `Favorite`
(bouton favori de l'aperçu rapide, dépend de Phase 2/`customers`).

## Points d'attention

- Le schéma Prisma ne modélise pas les filtres Genre/Couleur/Style/Événement du §7.2 comme
  des colonnes dédiées sur `Creation` — seuls `categoryId` (Type/Catégorie), `collectionId`
  et le texte libre `materials`/`techniques` existent. En Phase 1, dériver le filtre
  Catégorie depuis `Category` (kind=CREATION) via `creations`, et traiter Genre/Couleur/
  Style/Événement comme des filtres purement visuels côté client (pas de requête serveur),
  en attendant qu'une vraie taxonomie (ex. `tags`/`attributesJson`) soit ajoutée — à
  documenter dans `docs/features/creations.md` si le besoin se confirme (même limite que
  `docs/pages/la-une.md` pour les types de contenu éditoriaux).
- Le bouton favori de l'aperçu rapide dépend de `customers`/Phase 2 (voir
  `docs/features/creations.md`) — exposer le bouton à l'état non connecté plutôt que de le
  masquer.
- « Voir plus de créations » doit rester du chargement progressif (curseur), jamais une
  pagination lourde — consigne AVOID du prompt Stitch.
- Le panneau de filtre mobile plein écran avec bouton sticky « Voir les résultats » est
  obligatoire (mobile-first, spec §73).

## Checklist d'acceptation

- [ ] Barre de filtres (Genre, Type, Catégorie, Couleur, Style, Événement) + tri + toggle grille/masonry fidèles à `stitch-prompts/03-nos-creations-galerie.md`
- [ ] Chips de filtres actifs + « Réinitialiser les filtres » fonctionnels
- [ ] Modale « Aperçu rapide » accessible (piège de focus, fermeture au clavier Échap)
- [ ] État vide (« Aucune création ne correspond à ces filtres ») avec bouton de réinitialisation
- [ ] Chargement progressif (« Voir plus de créations ») sans rechargement de page
- [ ] Panneau de filtre mobile plein écran avec bouton sticky « Voir les résultats »
- [ ] `<title>`/meta description définis (spec §70/§71)
- [ ] Tests : `useCreationsGallery.test.ts`, `useGalleryFilters.test.ts`, `NosCreationsGaleriePage.test.tsx`
- [ ] `docs/checklist-implementation.md` et `docs/mockup-reference.md` mis à jour à ✅
