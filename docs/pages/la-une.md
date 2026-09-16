# Page — `la-une`

**Statut : ✅ Fait.** Phase 1 — Présence digitale.

## Objet

Page éditoriale dédiée aux créations les plus exceptionnelles et actuelles de la maison —
l'équivalent numérique d'une « Une » de magazine de mode, distincte de la courte sélection
affichée sur `home` (spec §5.2). Doit être visuellement la page la plus forte du site.

## Route(s)

`apps/web/src/app/(public)/la-une/page.tsx` → `/la-une`

Server Component (contenu quasi entièrement lecture de créations vedettes) ; seule la barre
de filtre par pilules (état de la pilule active) reste un Client Component isolé.

## Référence maquette

- Prompt Stitch : `stitch-prompts/02-la-une.md`
- Écran Stitch : **ANGALY — La Une (Editorial Showcase)**
- Section spécification : §6 (`docs/specifications/ANGALY_Specifications_Completes.md`)

## Arborescence de composants attendue

```
apps/web/src/features/la-une/
  ui/
    LaUnePage.tsx              → orchestre header + filtre + hero + grille + CTA, JSX + hooks uniquement
    LaUneHeader.tsx             → eyebrow « Éditorial » + titre serif + sous-titre italique, contenu réel (`content` prop)
    FeaturedHeroItem.tsx        → item dominant plein cadre 70vh/85vh (Création du mois / Collection du moment)
    EditorialGrid.tsx           → grille masonry 12-col (rythme large 7col / small 5col décalé / full 12col)
    EditorialGridItem.tsx       → carte item, légende SOUS l'image (photo, catégorie, titre, description, date, lien)
    ContentTypeFilterBar.tsx    → 'use client' (pilules Tout/Création du mois/Collection du moment/Sur Mesure/Coulisses)
    ClosingCtaBand.tsx          → bande de fermeture bg navy-blue, 2 CTA
  hooks/
    useLaUneItems.ts            → react-query sur les créations `isFeatured=true`, tri par featuredFrom
    useContentTypeFilter.ts     → état de la pilule active (filtrage client, pas de refetch serveur)
    useLaUneContent.ts          → texte de l'en-tête (`page="la-une"`, `sectionKey="header"`) lu depuis `PageSection`
                                   (session 2026-09-16, suite — voir docs/features/content.md), repli sur les
                                   littéraux codés en dur si la section n'existe pas/n'est pas publiée
  api/
    la-une.api.ts                → useFeaturedCreationsQuery / useFeaturedCollectionQuery / useLaUneSectionsContentQuery
  consts/
    content-type-filters.const.ts → pilules réelles (Tout, Création du mois, Collection du moment, Sur Mesure, Coulisses)
  utils/
    buildLaUneItems.ts            → dérive hero + grille depuis créations/collection (pure, testé)
  types/
    la-une-item.types.ts
  __tests__/
    buildLaUneItems.test.ts
    useContentTypeFilter.test.ts
    useLaUneItems.test.ts
    useLaUneContent.test.ts
    ContentTypeFilterBar.test.tsx
    LaUnePage.test.tsx
  index.ts
```

Toute logique (fetch, filtrage) vit dans `hooks/` — `LaUnePage.tsx` et les sections ne
contiennent que du JSX + appels de hooks.

## Endpoints API consommés

| Endpoint | Module | Usage |
| --- | --- | --- |
| `GET /api/creations?isFeatured=true&sort=featuredFrom:desc` | `creations` | Créations à la une, triées par date de mise en avant |
| `GET /api/collections?featured=true&limit=1` | `collections` | Collection du moment éventuelle pour l'item héros |
| `GET /api/content/public/la-une` | `content` | Texte de l'en-tête (eyebrow/titre/sous-titre), `PUBLISHED`-only, sans auth (session 2026-09-16, suite) |

## Modèles Prisma touchés

`Creation` (`isFeatured`, `featuredFrom`, `featuredUntil`, + `Category`, `Collection?`,
`Media[]`), `Collection` (item héros « Collection du moment »), `Media`.

## Points d'attention

- Le schéma Prisma ne modélise pas de « types de contenu » éditoriaux comme un champ dédié
  sur `Creation` — les 5 pilules de l'écran Stitch réel (Tout, Création du mois, Collection du
  moment, Sur Mesure, Coulisses) sont alimentées par les catégories/disponibilités dédiées
  dans `seed.ts` et dérivées par `buildLaUneItems.ts` :
  - **Tout** (`all`) : l'ensemble des créations vedettes.
  - **Création du mois** (`creation-du-mois`) : créations de la catégorie dédiée (`Symphonie Champagne`, etc.).
  - **Collection du moment** (`collection-du-moment`) : créations rattachées à une collection (`Diadème Impérial`, `Nuit d'Opéra`, etc.).
  - **Sur Mesure** (`sur-mesure`) : créations sur mesure / `SUR_DEMANDE` (`Signature Artisan`, `Tailleur Sur Mesure`, `Smoking Grand Soir`, etc.).
  - **Coulisses** (`coulisses`) : pièces documentant le travail d'atelier (`L'Art du Perlage à la Main`, `L'Entoilage Traditionnel`).
  Toutes disposent d'images réelles hébergées sur MinIO. La sélection d'une pilule met à jour
  l'URL (`/la-une?type=...`) avec historique de navigation et prise en charge du deep linking.
- **Pas de composant « story » 2 colonnes** : l'écran réel ne montre aucune carte de ce type
  (contrairement à ce que `stitch-prompts/02-la-une.md` seul suggérait) — la grille masonry
  réelle est un rythme fixe (grand item 7 colonnes, petit item 5 colonnes décalé, item pleine
  largeur 21:9), reproduit par `EditorialGrid.tsx`/`EditorialGridItem.tsx` avec une légende
  toujours sous l'image, jamais en surimpression.
- Garder un `limit` bas côté API (8 à 10 items) : la Une doit rester curatée, jamais une
  liste paginée infinie.
- Image de l'item héros en LCP : `next/image` avec `priority` sera branché quand la vraie
  photographie existera (Phase 6/contenu) — un dégradé de substitution tient sa place pour
  l'instant, comme sur `home`.
- Contenu de l'en-tête (« Éditorial », titre, sous-titre) lu depuis `PageSection`
  (`page="la-une"`, `sectionKey="header"`) via `GET /content/public/la-une` depuis la session
  2026-09-16 (suite) — troisième page migrée après `home`/`a-propos`, voir
  `docs/features/content.md` et `docs/phases/phase-6-admin-cms.md` (item 4). Repli sur les
  littéraux codés en dur (`useLaUneContent.ts`) si la section est absente ou encore `DRAFT`.
- Le bandeau CTA de fermeture réel (`ClosingCtaBand.tsx`) porte les boutons « Prendre
  rendez-vous » et « Découvrir l'E-boutique » (pas « Voir toutes nos créations », qui vient
  du prompt texte seul) — le second pointe vers `/pret-a-porter`, route boutique la plus
  proche existante en attendant une éventuelle route e-boutique dédiée.

## Checklist d'acceptation

- [x] Item héros + grille masonry asymétrique fidèles à l'écran Stitch réel (pas de grille e-commerce uniforme)
- [x] Barre de filtre par pilules fonctionnelle (filtrage client, pilule active soulignée champagne)
- [x] Bande CTA de fermeture avec les deux boutons (Prendre rendez-vous / Découvrir l'E-boutique)
- [x] `<title>`/meta description définis (spec §70)
- [x] Tests : `buildLaUneItems.test.ts`, `useContentTypeFilter.test.ts`, `useLaUneItems.test.ts`,
      `useLaUneContent.test.ts`, `ContentTypeFilterBar.test.tsx`, `LaUnePage.test.tsx` — 25 tests
      sur `la-une/`, tous verts (session 2026-09-16, suite)
- [x] `docs/checklist-implementation.md` et `docs/mockup-reference.md` mis à jour à ✅
