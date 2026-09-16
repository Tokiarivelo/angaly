# Page — `collections-liste`

**Statut : ✅ Fait.** Phase 1 — Présence digitale.

## Objet

Index éditorial de toutes les collections saisonnières/thématiques de la maison —
l'équivalent d'un catalogue d'expositions d'une maison de couture prestigieuse (spec §10).

## Route(s)

`apps/web/src/app/(public)/collections/page.tsx` → `/collections`

`CollectionsListePage` est un Client Component (react-query direct) — même arbitrage que
`home`/`la-une`/`nos-creations-galerie`/`creation-detail`, voir leurs fiches "Notes
d'implémentation" respectives. Aucun état interactif complexe n'est requis par la maquette
(pas de filtre) au-delà de ça.

## Référence maquette

- Prompt Stitch : `stitch-prompts/06-collections-liste.md`
- Écran Stitch : **ANGALY — Nos Collections (Index Editorial)**
- Section spécification : §10 (`docs/specifications/ANGALY_Specifications_Completes.md`)

## Arborescence de composants (livrée)

```
apps/web/src/features/collections-liste/
  ui/
    CollectionsListePage.tsx      → orchestre header + bannière « Collection du moment » + grille
    CollectionsHeader.tsx          → titre/sous-titre réels (contenu — voir hooks/useCollectionsContent.ts)
    FeaturedCollectionBanner.tsx  → photo + titre + histoire courte + stat (« 12 créations ») + CTA
    CollectionCoverCard.tsx        → carte pleine hauteur (cover + overlay dégradé navy + année/titre/description + lien)
    CollectionsGrid.tsx
  hooks/
    useCollectionsList.ts          → react-query sur GET /api/collections
    useFeaturedCollection.ts        → react-query, dérive la « Collection du moment »
    useCollectionsContent.ts        → header réel, GET /content/public/collections-liste, repli codé en dur
  api/
    collections-liste.api.ts        → useCollectionsListQuery, useFeaturedCollectionQuery, useCollectionsSectionsContentQuery
  consts/
    queryKeys.ts
  __tests__/
    useCollectionsList.test.ts
    useCollectionsContent.test.ts
    CollectionsListePage.test.tsx
  index.ts
```

Toute logique (fetch, dérivation de la collection du moment) vit dans `hooks/` —
`CollectionsListePage.tsx` et les sections ne contiennent que du JSX + appels de hooks.

## Endpoints API consommés

| Endpoint                                                 | Module        | Usage                                                               |
| -------------------------------------------------------- | ------------- | ------------------------------------------------------------------- |
| `GET /api/collections?sort=seasonYear:desc&page=&limit=` | `collections` | Grille de toutes les collections publiées                           |
| `GET /api/collections?sort=publishedAt:desc&limit=1`     | `collections` | « Collection du moment » pour la bannière (voir Points d'attention) |
| `GET /api/content/public/collections-liste`               | `content`     | Texte du header (titre/sous-titre), `PUBLISHED`-only                |

## Modèles Prisma touchés

`Collection` (`slug`, `name`, `description`, `story`, `seasonYear`, `publishedAt`),
`Creation[]` (compte de créations pour la bannière), `Media` (via `CollectionMedia`),
`PageSection` (`page="collections-liste"`, `sectionKey="header"` — texte du header).

## Points d'attention

- **Header (titre + sous-titre) migré vers `PageSection` CMS** (session 2026-09-16, suite —
  septième tranche de `docs/phases/phase-6-admin-cms.md` item 4, après `home`/`a-propos`/
  `la-une`/`nos-creations-galerie`/`creation-detail`/`contact`) : `CollectionsHeader` lit
  `GET /content/public/collections-liste` via `useCollectionsContent`, repli sur le littéral
  codé en dur si la section `header` est absente/`DRAFT` — voir `docs/features/content.md`.
  Le fil d'Ariane reste codé en dur — navigation structurelle, pas du contenu éditorial.
- **Fidélité vérifiée via `agy`/StitchMCP `get_screen`** (écran réel
  `f7e85096ba6f4dd8afb29fb1290363c0`), pas seulement `stitch-prompts/06-collections-liste.md`.
  La grille réelle est strictement 2 colonnes (`md:grid-cols-2`, jamais 3/4 même en très
  large écran), et la collection mise en avant dans la bannière ne se répète jamais dans la
  grille en dessous — exclue côté client dans `useCollectionsList.ts`.
- `Collection` n'a pas de champ `isFeatured` dédié comme `Creation` : la « Collection du
  moment » est dérivée côté hook comme la collection publiée la plus récente
  (`publishedAt` desc, limite 1), même limite documentée pour `docs/pages/la-une.md`.
- Le compteur de créations de la bannière vient du vrai `creationsCount` (`_count.creations`)
  déjà exposé par `CollectionDto` — jamais d'`include` non scopé.
- L'étiquette de chaque carte de la grille est `seasonYear` quand il existe, sinon
  « Archives » (dérivation réelle observée sur l'écran Stitch pour une collection sans
  saison) — pas de vidéo optionnelle ajoutée (`Collection` n'a pas de champ `videoUrl`,
  hors périmètre).
- Une collection dont `publishedAt` est nul ou dans le futur n'apparaît jamais sur cette
  page (règle déjà posée par `docs/features/collections.md`) — le backend ne renvoie que
  les collections publiées.
- Vérification live-navigateur limitée à l'état vide/statique cette session : le port 3003
  habituel de `apps/api` était occupé par un projet sans rapport de l'utilisateur (son
  propre terminal, `trafing-bot/frontend`) — non touché par prudence. Le rendu avec données
  réelles (bannière + grille + photo de couverture) est couvert par les tests RTL/MSW
  (`CollectionsListePage.test.tsx`) mais reste à reconfirmer visuellement une fois le port
  libre.

## Checklist d'acceptation

- [x] Grille de cartes de collection (2 colonnes) + bannière « Collection du moment » fidèles à l'écran Stitch réel
- [x] Overlay dégradé navy suffisamment contrasté pour la lisibilité du texte
- [x] Une collection non publiée n'apparaît jamais (filtrage déjà côté backend)
- [x] `<title>`/meta description définis (spec §70)
- [x] Tests : `useCollectionsList.test.ts`, `CollectionsListePage.test.tsx` — 6 tests,
      98%+/91%+/99%+/98%+ de couverture (stmts/branches/fonctions/lignes) sur `apps/web`
- [x] `docs/checklist-implementation.md` et `docs/mockup-reference.md` mis à jour à ✅
