# Page — `la-une`

**Statut : ⬜ À faire.** Phase 1 — Présence digitale.

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
    LaUnePage.tsx              → orchestre header éditorial + grille + CTA, JSX + hooks uniquement
    LaUneHeader.tsx             → eyebrow « ÉDITORIAL » + titre serif + sous-titre italique
    FeaturedHeroItem.tsx        → item dominant plein cadre (Création du mois / Collection du moment)
    EditorialGrid.tsx           → grille masonry asymétrique (6 à 10 items, ratios mixtes)
    EditorialGridItem.tsx       → carte item (photo, catégorie, titre, description, date, lien)
    StorySnippetCard.tsx        → variante « story » 2 colonnes (photo + récit) pour 1-2 items
    ContentTypeFilterBar.tsx    → 'use client' (pilules Tout/Création du mois/.../Coulisses)
    ClosingCtaBand.tsx
  hooks/
    useLaUneItems.ts            → react-query sur les créations `isFeatured=true`, tri par featuredFrom
    useContentTypeFilter.ts     → état de la pilule active (filtrage client, pas de refetch serveur)
  api/
    la-une.api.ts                → useLaUneItemsQuery
  consts/
    content-type-filters.const.ts → pilules (Tout, Création du mois, Collection du moment, Coup de cœur, Mariage, Costume, Événement, Coulisses)
  types/
    la-une-item.types.ts
  __tests__/
    useLaUneItems.test.ts
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

## Modèles Prisma touchés

`Creation` (`isFeatured`, `featuredFrom`, `featuredUntil`, + `Category`, `Collection?`,
`Media[]`), `Collection` (item héros « Collection du moment »), `Media`.

## Points d'attention

- Le schéma Prisma ne modélise pas les « types de contenu » éditoriaux du §6.3 (Création du
  mois, Collection du moment, Coup de cœur, Mariage, Costume, Événement, Coulisses) comme un
  champ dédié sur `Creation` — seuls `isFeatured` + la fenêtre `featuredFrom`/`featuredUntil`
  existent. En Phase 1, dériver l'étiquette affichée depuis `category`/`collection` quand
  c'est pertinent (Mariage, Costume) et traiter les autres libellés comme des filtres
  purement visuels/client, non branchés à un vrai filtre serveur. Si la maison a besoin d'une
  taxonomie éditoriale complète, prévoir un champ dédié (ex. `featuredTag`) dans une
  migration ultérieure, à documenter dans `docs/features/creations.md`.
- Garder un `limit` bas côté API (8 à 10 items) : la Une doit rester curatée, jamais une
  liste paginée infinie.
- Image de l'item héros en LCP : `next/image` avec `priority`, pas de lazy-loading dessus.
- Contenu de l'en-tête (« ÉDITORIAL », titre, sous-titre) suit le même sort que `home` :
  valeurs par défaut codées en dur dans `useLaUneItems.ts`/consts en attendant `content`
  (Phase 6), TODO explicite pointant vers cette fiche.

## Checklist d'acceptation

- [ ] Item héros + grille masonry asymétrique fidèles à `stitch-prompts/02-la-une.md` (pas de grille e-commerce uniforme)
- [ ] Barre de filtre par pilules fonctionnelle (filtrage client, pilule active soulignée champagne)
- [ ] Au moins une carte « story » 2 colonnes rendue quand une création la fournit
- [ ] Bande CTA de fermeture avec les deux boutons (Prendre rendez-vous / Voir toutes nos créations)
- [ ] `<title>`/meta description définis (spec §70)
- [ ] Tests : `useLaUneItems.test.ts`, `LaUnePage.test.tsx`
- [ ] `docs/checklist-implementation.md` et `docs/mockup-reference.md` mis à jour à ✅
