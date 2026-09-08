# Page — `nos-creations-galerie`

**Statut : 🟡 Partiel.** Phase 1 — Présence digitale. Cœur de la page (header, tri, vue
grille/liste, grille masonry sur données réelles, chargement progressif), aperçu rapide
(Quick View) et panneau de filtre mobile livrés et testés ; chips de filtres actifs et
filtres Genre/Type/Catégorie/Couleur/Style réellement fonctionnels restent à faire — les deux
sont couplés au même prérequis (une taxonomie backend), voir "Points d'attention".

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
                                      favori local — pas de persistance, Phase 2/customers ;
                                      déclencheur « Aperçu rapide » centré au survol)
    GalleryGrid.tsx                 → colonnes CSS masonry (grid) ou liste empilée (list)
    QuickViewModal.tsx               → 'use client', Radix Dialog (focus-trap + Échap gratuits,
                                       même pattern que components/navigation/MobileDrawer.tsx) :
                                       image + titre + badge collection/catégorie + description +
                                       « Voir la création » (lien) + « Ajouter aux favoris »
    MobileFilterSheet.tsx             → 'use client', Radix Dialog plein écran (panneau ivoire,
                                       les 5 libellés décoratifs empilés + CTA sticky
                                       « Voir les résultats »)
    EmptyState.tsx
    LoadMoreButton.tsx              → 'use client' (chargement progressif, jamais de pagination lourde)
  hooks/
    useCreationsGallery.ts         → react-query, pagination page/limit accumulée, reset au tri
    useGalleryFilters.ts           → état tri + vue (grille/liste)
    useQuickView.ts                 → creation active du modal Aperçu rapide (ou null)
    useMobileFilterSheet.ts          → ouverture/fermeture du panneau mobile (state local, pas
                                       de store — contrairement à navigation-mobile, rien d'autre
                                       n'a besoin de lire cet état)
  api/
    nos-creations-galerie.api.ts   → useCreationsPageQuery
  consts/
    gallery-filters.const.ts       → libellés décoratifs + options de tri réelles
  types/
    gallery.types.ts
  __tests__/
    useCreationsGallery.test.ts
    useGalleryFilters.test.ts
    useQuickView.test.ts, useMobileFilterSheet.test.ts
    QuickViewModal.test.tsx, MobileFilterSheet.test.tsx
    NosCreationsGaleriePage.test.tsx
  index.ts
```

**Reporté** (voir "Points d'attention") : `ActiveFilterChips` et le filtrage réel par
Catégorie/Genre/Type/Couleur/Style (dropdowns toujours rendus mais inertes) — les deux sont
couplés au même prérequis backend (taxonomie/endpoint de catégories), volontairement traités
ensemble dans une session ultérieure plutôt que la moitié maintenant.

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
  toggle grille/liste qui l'est (`hidden md:flex`) — reproduit à l'identique : seules les 5
  dropdowns décoratives basculent derrière le bouton « Filtrer », `Trier par` reste visible sur
  mobile en dehors du panneau.
- **Reporté à une session ultérieure** (pas invalidé par la maquette, simplement hors
  périmètre de cette passe) : `ActiveFilterChips` et le filtrage serveur réel par
  Catégorie/Genre/Type/Couleur/Style (nécessiterait soit un endpoint de liste de catégories,
  soit une dérivation client depuis un premier fetch large) — les deux restent groupés
  ensemble car des chips actives n'auraient de sens que pour un filtre qui affecte
  réellement les résultats ; en ajouter pour des filtres purement décoratifs (sélection locale
  sans effet sur la requête) aurait été trompeur pour l'utilisateur plutôt qu'un vrai gain.
- Le bouton favori (carte ET modale Aperçu rapide) est local uniquement (`useState`, pas de
  persistance) — dépend de `customers`/Phase 2 pour un vrai état ; exposé à l'état non
  connecté plutôt que masqué, conformément à la consigne. La modale a son propre état favori
  local, indépendant de celui de la carte (les deux sont non-persistants de toute façon, pas
  jugé utile de les synchroniser pour un état de démonstration).
- « Voir plus de créations » reste du chargement progressif (page/limit accumulés côté
  client), jamais une pagination lourde ni un rechargement de page.

## Checklist d'acceptation

- [x] Tri (Plus récent / Mis en avant) + toggle vue grille/liste fonctionnels, fidèles à l'écran Stitch réel
- [x] Grille masonry sur données réelles (`GET /api/creations`), ratios d'image variés
- [x] État vide (« Aucune création ne correspond à ces filtres pour le moment »)
- [x] Chargement progressif (« Voir plus de créations ») sans rechargement de page
- [x] `<title>`/meta description définis (spec §70/§71)
- [x] Modale « Aperçu rapide » accessible (image, titre, badge, description, « Voir la création », « Ajouter aux favoris », focus-trap + Échap via Radix Dialog)
- [x] Panneau de filtre mobile plein écran (« Filtrer » → panneau ivoire, 5 filtres empilés, CTA sticky « Voir les résultats »)
- [x] Tests : `useCreationsGallery.test.ts`, `useGalleryFilters.test.ts`, `useQuickView.test.ts`, `useMobileFilterSheet.test.ts`, `QuickViewModal.test.tsx`, `MobileFilterSheet.test.tsx`, `NosCreationsGaleriePage.test.tsx` — 25 tests, 98.12%/96.2%/96.66%/98.12% de couverture (stmts/branches/fonctions/lignes) sur `nos-creations-galerie/`
- [ ] Barre de filtres Genre/Type/Catégorie/Couleur/Style réellement fonctionnelle (reporté — pas de taxonomie backend)
- [ ] Chips de filtres actifs + « Réinitialiser les filtres » (reporté avec le filtrage réel, même prérequis)
- [x] `docs/checklist-implementation.md` et `docs/mockup-reference.md` mis à jour (reste 🟡 — 2 items sur 4 livrés cette passe)
