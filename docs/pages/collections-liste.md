# Page — `collections-liste`

**Statut : ⬜ À faire.** Phase 1 — Présence digitale.

## Objet

Index éditorial de toutes les collections saisonnières/thématiques de la maison —
l'équivalent d'un catalogue d'expositions d'une maison de couture prestigieuse (spec §10).

## Route(s)

`apps/web/src/app/(public)/collections/page.tsx` → `/collections`

Server Component par défaut (contenu quasi entièrement lecture) ; aucun état interactif
significatif n'est requis par la maquette (pas de filtre), le feature reste donc très
majoritairement Server Components.

## Référence maquette

- Prompt Stitch : `stitch-prompts/06-collections-liste.md`
- Écran Stitch : **ANGALY — Nos Collections (Index Editorial)**
- Section spécification : §10 (`docs/specifications/ANGALY_Specifications_Completes.md`)

## Arborescence de composants attendue

```
apps/web/src/features/collections-liste/
  ui/
    CollectionsListePage.tsx      → orchestre header + bannière « Collection du moment » + grille
    CollectionsHeader.tsx
    FeaturedCollectionBanner.tsx  → photo + titre + histoire courte + stat (« 12 créations ») + CTA
    CollectionCoverCard.tsx        → carte pleine hauteur (cover + overlay dégradé navy + année/titre/description + lien)
    CollectionsGrid.tsx
  hooks/
    useCollectionsList.ts          → react-query sur GET /api/collections
    useFeaturedCollection.ts        → react-query, dérive la « Collection du moment »
  api/
    collections-liste.api.ts        → useCollectionsListQuery, useFeaturedCollectionQuery
  consts/
    queryKeys.ts
  __tests__/
    useCollectionsList.test.ts
    CollectionsListePage.test.tsx
  index.ts
```

Toute logique (fetch, dérivation de la collection du moment) vit dans `hooks/` —
`CollectionsListePage.tsx` et les sections ne contiennent que du JSX + appels de hooks.

## Endpoints API consommés

| Endpoint | Module | Usage |
| --- | --- | --- |
| `GET /api/collections?sort=seasonYear:desc&page=&limit=` | `collections` | Grille de toutes les collections publiées |
| `GET /api/collections?sort=publishedAt:desc&limit=1` | `collections` | « Collection du moment » pour la bannière (voir Points d'attention) |

## Modèles Prisma touchés

`Collection` (`slug`, `name`, `description`, `story`, `seasonYear`, `publishedAt`),
`Creation[]` (compte de créations pour la bannière), `Media` (via `CollectionMedia`).

## Points d'attention

- `Collection` n'a pas de champ `isFeatured` dédié comme `Creation` (pas de
  `featuredFrom`/`featuredUntil`) : contrairement à `docs/pages/la-une.md` qui suppose un
  paramètre `featured=true`, ce module n'a pas de vrai filtre serveur pour désigner la
  « Collection du moment ». En Phase 1, la dériver côté hook comme la collection publiée la
  plus récente (`publishedAt` desc, limite 1) — documenter dans `docs/features/collections.md`
  si une vraie mise en avant manuelle est nécessaire plus tard.
- Le compteur « 12 créations » de la bannière doit venir d'un `_count.creations` exposé par
  le DTO `list-collections`/`get-collection-by-slug`, jamais d'un `include` non scopé qui
  chargerait toute la relation `Creation[]` (règle de vérification de
  `docs/features/collections.md`).
- Vidéo optionnelle de la collection (spec §10) : `Collection` n'a pas de champ `videoUrl`
  — traiter comme contenu statique/`content` (Phase 6) si utilisée en Phase 1, sinon
  omettre la section.
- Cartes de couverture « affiche d'exposition » : coins peu arrondis (4-8px), pas de bordure
  visible, pas de style « shop by category » e-commerce — consigne AVOID du prompt Stitch.
- Une collection dont `publishedAt` est nul ou dans le futur n'apparaît jamais sur cette
  page (règle déjà posée par `docs/features/collections.md`).

## Checklist d'acceptation

- [ ] Grille de cartes de collection + bannière « Collection du moment » fidèles à `stitch-prompts/06-collections-liste.md`
- [ ] Overlay dégradé navy suffisamment contrasté pour la lisibilité du texte (a11y contraste AA)
- [ ] Une collection non publiée (`publishedAt` nul/futur) n'apparaît jamais
- [ ] `<title>`/meta description définis (spec §70)
- [ ] Tests : `useCollectionsList.test.ts`, `CollectionsListePage.test.tsx`
- [ ] `docs/checklist-implementation.md` et `docs/mockup-reference.md` mis à jour à ✅
