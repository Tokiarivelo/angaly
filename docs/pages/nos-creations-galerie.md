# Page — `nos-creations-galerie`

**Statut : ✅ Fait.** Phase 1 — Présence digitale. Header, tri, vue grille/liste, grille
masonry sur données réelles, chargement progressif, aperçu rapide (Quick View), panneau de
filtre mobile, filtre Catégorie réellement fonctionnel (nouveau module `categories`) et chips
de filtres actifs livrés et testés. Genre/Type/Couleur/Style restent décoratifs en
permanence — voir "Points d'attention" pour pourquoi ce n'est pas un report temporaire.

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
    NosCreationsGaleriePage.tsx   → orchestre header + barre de filtres + chips + grille + load-more
    GalleryHeader.tsx              → titre serif + intro + breadcrumb (Accueil / Nos Créations),
                                      titre/intro réels (`content` prop) — breadcrumb reste codé en dur
    FilterBar.tsx                  → 'use client' — Genre/Type/Couleur/Style décoratifs + Catégorie
                                      réelle (`<select>` peuplé par `GET /api/categories`) + tri réel
                                      + toggle vue grille/liste
    ActiveFilterChips.tsx           → 'use client' — chip retirable pour Catégorie (seul filtre réel)
                                      + lien « Réinitialiser les filtres »
    ResultsCount.tsx                → « N créations » (total réel, pas statique)
    CreationCard.tsx                → carte (image, pill catégorie, titre serif, matériau,
                                      favori local — pas de persistance, Phase 2/customers ;
                                      déclencheur « Aperçu rapide » centré au survol)
    GalleryGrid.tsx                 → colonnes CSS masonry (grid) ou liste empilée (list)
    QuickViewModal.tsx               → 'use client', Radix Dialog (focus-trap + Échap gratuits,
                                       même pattern que components/navigation/MobileDrawer.tsx) :
                                       image + titre + badge collection/catégorie + description +
                                       « Voir la création » (lien) + « Ajouter aux favoris »
    MobileFilterSheet.tsx             → 'use client', Radix Dialog plein écran (panneau ivoire,
                                       Genre/Type/Couleur/Style décoratifs + Catégorie réelle
                                       (même liste que le desktop) + CTA sticky « Voir les résultats »)
    EmptyState.tsx                     → message + bouton « Réinitialiser les filtres » réel
    LoadMoreButton.tsx              → 'use client' (chargement progressif, jamais de pagination lourde)
  hooks/
    useCreationsGallery.ts         → react-query, pagination page/limit accumulée, reset au tri ET au categoryId
    useGalleryFilters.ts           → état tri + vue (grille/liste) + categoryId + resetFilters()
    useQuickView.ts                 → creation active du modal Aperçu rapide (ou null)
    useMobileFilterSheet.ts          → ouverture/fermeture du panneau mobile (state local, pas
                                       de store — contrairement à navigation-mobile, rien d'autre
                                       n'a besoin de lire cet état)
    useCategoryFilter.ts             → liste des vraies catégories CREATION (GET /api/categories?kind=CREATION)
    useGalleryContent.ts             → texte de l'en-tête (`page="nos-creations-galerie"`,
                                        `sectionKey="header"`) lu depuis `PageSection` (session
                                        2026-09-16, suite — voir docs/features/content.md), repli sur les
                                        littéraux codés en dur si la section n'existe pas/n'est pas publiée
  api/
    nos-creations-galerie.api.ts   → useCreationsPageQuery(page, sort, categoryId), useCategoriesQuery,
                                      useGallerySectionsContentQuery
  consts/
    gallery-filters.const.ts       → libellés décoratifs (Genre/Type/Couleur/Style) + options de tri réelles
  types/
    gallery.types.ts
  __tests__/
    useCreationsGallery.test.ts, useGalleryFilters.test.ts, useCategoryFilter.test.ts
    useQuickView.test.ts, useMobileFilterSheet.test.ts, useGalleryContent.test.ts
    QuickViewModal.test.tsx, MobileFilterSheet.test.tsx, ActiveFilterChips.test.tsx, EmptyState.test.tsx
    NosCreationsGaleriePage.test.tsx
  index.ts
apps/web/src/lib/msw/handlers/categories.handlers.ts  → défaut GET /categories (2 catégories CREATION)
                                                          pour tous les tests, voir docs/testing.md
apps/web/src/lib/msw/handlers/nos-creations-galerie.handlers.ts → défaut GET /content/public/
                                                          nos-creations-galerie (session 2026-09-16, suite)
```

Toute logique (fetch, tri, pagination, filtre) vit dans `hooks/` — `NosCreationsGaleriePage.tsx`
et les sections ne contiennent que du JSX + appels de hooks.

## Endpoints API consommés

| Endpoint | Module | Usage |
| --- | --- | --- |
| `GET /api/creations?page=&limit=&sort=&categoryId=` | `creations` | Liste paginée des créations (tri newest/featured, filtre Catégorie), accumulée progressivement |
| `GET /api/categories?kind=CREATION` | `categories` (nouveau — `docs/features/categories.md`) | Peuple le `<select>` « Catégorie » avec de vraies catégories |
| `GET /api/content/public/nos-creations-galerie` | `content` | Texte de l'en-tête (titre/intro), `PUBLISHED`-only, sans auth (session 2026-09-16, suite) |

## Modèles Prisma touchés

`Creation` (`categoryId`, `collectionId`, `availability`, `materials`, `techniques`,
`isFeatured`), `Category` (`kind = CREATION`, désormais listée via le nouveau module
`categories`), `Media` (via `CreationMedia`), `Favorite` (bouton favori de l'aperçu rapide,
dépend de Phase 2/`customers`).

## Points d'attention

- **Fidélité vérifiée via `agy`/StitchMCP `get_screen`** (écran réel
  `c6cdd1c7965b4ac29619a0fcb6e0ba1a`), pas seulement `stitch-prompts/03-nos-creations-
  galerie.md` : la barre de filtres réelle n'a que 5 dropdowns (GENRE, TYPE, CATÉGORIE,
  COULEUR, STYLE) — pas de 6ᵉ filtre « Événement ». La grille réelle est un masonry CSS
  (`column-count` responsive 1/2/3), pas une CSS grid à spans explicites ; les cartes ont
  des ratios d'image variés (portrait majoritaire + un item large occasionnel), reproduits
  ici par un cycle fixe de ratios (`CreationCard.tsx`) faute de vraies photos.
- **Filtre Catégorie rendu réellement fonctionnel** (nouveau module backend `categories`,
  `docs/features/categories.md`) : `Creation.categoryId` existait déjà côté Prisma et
  `GET /api/creations?categoryId=` était déjà supporté — il manquait uniquement un endpoint
  pour LISTER les catégories réelles et peupler le `<select>`. Résolu en Clean Architecture
  complète (`apps/api/src/categories/`), pas un raccourci ad hoc dans le module `creations`.
  Le schéma Prisma ne modélise en revanche **aucune colonne dédiée** pour Genre/Type/Couleur/
  Style sur `Creation` — seuls `categoryId`, `collectionId` et le texte libre
  `materials`/`techniques` existent. Ces 4 dropdowns restent donc **décoratifs de façon
  permanente**, pas en attente d'un futur endpoint (il n'y a rien à lister, aucune colonne
  n'existe) — voir `gallery-filters.const.ts`. Même limite documentée que `docs/pages/la-
  une.md` pour les filtres sans taxonomie réelle.
- **Chips de filtres actifs livrées** (`ActiveFilterChips.tsx`) : un seul chip possible pour
  l'instant (Catégorie, le seul filtre réel) — cliquer le chip ou « Réinitialiser les
  filtres » réinitialise `categoryId`. Volontairement pas de chip pour Genre/Type/Couleur/
  Style : afficher un chip « actif » pour une sélection qui n'affecte jamais les résultats
  aurait été trompeur (décision déjà actée à la passe précédente, confirmée ici).
- Le bouton « Réinitialiser les filtres » de `EmptyState.tsx` (real Stitch EMPTY STATE
  section) partage la même fonction `resetFilters()` que `ActiveFilterChips` — testé
  séparément (`EmptyState.test.tsx`) et en intégration (une création filtrée à zéro résultat,
  clic sur le bouton, la liste réapparaît).
- **Aperçu rapide (Quick View) ajouté dans une passe ultérieure**, fidélité revérifiée sur le
  HTML réel de l'écran Stitch (téléchargé directement, pas de capture d'écran) : le bouton
  « Aperçu rapide » n'existe dans **aucun** état capturé de l'écran réel (seul le cœur favori
  y figure, en overlay top-right) — confirmé en téléchargeant le HTML et en cherchant
  `aperçu`/`quick`/`modal` dedans, rien trouvé. Le déclencheur et la modale suivent donc le
  texte du prompt (`stitch-prompts/03-nos-creations-galerie.md`, section "QUICK VIEW MODAL")
  plutôt qu'un état d'écran Stitch. Le bouton est positionné centré sur l'image au survol (pas
  de position réelle à reproduire), en tant que sibling du `Link` de la carte (pas imbriqué
  dedans, même stratégie que le cœur favori déjà en place — évite un `<a><button>` invalide).
  Le use-case liste (`GET /api/creations`) renvoie déjà le `CreationDto` complet (description,
  matières, techniques…), identique au use-case détail — la modale ne fait donc aucun appel
  réseau supplémentaire.
- **Panneau de filtre mobile ajouté dans une passe ultérieure**, comportement suivant le texte
  du prompt ("MOBILE BEHAVIOR" : les filtres se replient dans un unique bouton « Filtrer »
  ouvrant un panneau plein écran ivoire, options empilées, CTA sticky « Voir les résultats »)
  — aucun état mobile capturé sur l'écran Stitch réel (desktop uniquement, 2560×4560) pour
  vérifier la fidélité au-delà du texte. Fidélité confirmée en revanche pour `Trier par` :
  visible à **tous** les breakpoints dans le HTML réel (pas de `hidden md:`), contrairement au
  toggle grille/liste qui l'est (`hidden md:flex`) — reproduit à l'identique : le cluster de
  filtres (4 décoratifs + 1 réel) bascule derrière le bouton « Filtrer », `Trier par` reste
  visible sur mobile en dehors du panneau.
- Le bouton favori (carte ET modale Aperçu rapide) est local uniquement (`useState`, pas de
  persistance) — dépend de `customers`/Phase 2 pour un vrai état ; exposé à l'état non
  connecté plutôt que masqué, conformément à la consigne. La modale a son propre état favori
  local, indépendant de celui de la carte (les deux sont non-persistants de toute façon, pas
  jugé utile de les synchroniser pour un état de démonstration).
- « Voir plus de créations » reste du chargement progressif (page/limit accumulés côté
  client), jamais une pagination lourde ni un rechargement de page.
- Titre/intro de l'en-tête (`GalleryHeader.tsx`) lus depuis `PageSection`
  (`page="nos-creations-galerie"`, `sectionKey="header"`) via `GET /content/public/nos-
  creations-galerie` depuis la session 2026-09-16 (suite) — quatrième page migrée après
  `home`/`a-propos`/`la-une`, voir `docs/features/content.md` et
  `docs/phases/phase-6-admin-cms.md` (item 4). Le fil d'Ariane (breadcrumb) reste codé en
  dur : navigation structurelle, pas du contenu éditorial. Repli sur les littéraux codés en
  dur (`useGalleryContent.ts`) si la section est absente ou encore `DRAFT`.

## Checklist d'acceptation

- [x] Tri (Plus récent / Mis en avant) + toggle vue grille/liste fonctionnels, fidèles à l'écran Stitch réel
- [x] Grille masonry sur données réelles (`GET /api/creations`), ratios d'image variés
- [x] État vide (« Aucune création ne correspond à ces filtres pour le moment »)
- [x] Chargement progressif (« Voir plus de créations ») sans rechargement de page
- [x] `<title>`/meta description définis (spec §70/§71)
- [x] Modale « Aperçu rapide » accessible (image, titre, badge, description, « Voir la création », « Ajouter aux favoris », focus-trap + Échap via Radix Dialog)
- [x] Panneau de filtre mobile plein écran (« Filtrer » → panneau ivoire, filtres empilés, CTA sticky « Voir les résultats »)
- [x] Filtre Catégorie réellement fonctionnel (nouveau module `categories`, `GET /api/categories?kind=CREATION` + `GET /api/creations?categoryId=`), sur desktop ET mobile
- [x] Chips de filtres actifs (Catégorie) + « Réinitialiser les filtres » (chip, lien, et bouton de l'état vide — les 3 partagent `resetFilters()`)
- [x] Vérifié en direct via Playwright contre l'API/Postgres/MinIO réels : 19 créations réelles couvrant 6 catégories (`Robes de mariée`, `Costumes homme`, `Robes de soirée`, `Sur Mesure`, `Coulisses`, `Création du mois`), pagination progressive (12 initiales → 19 au clic sur « Voir plus de créations »), filtrage dynamique par catégorie avec chip actif et reset, ouverture de la modale « Aperçu rapide », bascule vue grille/liste, et panneau mobile plein écran
- [x] Tests : `useCreationsGallery.test.ts`, `useGalleryFilters.test.ts`, `useCategoryFilter.test.ts`, `useQuickView.test.ts`, `useMobileFilterSheet.test.ts`, `useGalleryContent.test.ts`, `QuickViewModal.test.tsx`, `MobileFilterSheet.test.tsx`, `ActiveFilterChips.test.tsx`, `EmptyState.test.tsx`, `NosCreationsGaleriePage.test.tsx` (44 tests unitaires, tous verts) + `apps/web/e2e/creations/nos-creations-galerie.spec.ts` (parcours critique Playwright e2e)
- [x] `docs/checklist-implementation.md` et `docs/mockup-reference.md` mis à jour à ✅
