# Page — `collection-detail`

**Statut : ✅ Fait.** Phase 1 — Présence digitale.

## Objet

Page éditoriale dédiée à une collection, racontant son histoire et présentant toutes les
créations associées — équivalent d'une page de catalogue d'exposition dédiée (spec §10).

## Route(s)

`apps/web/src/app/(public)/collections/[slug]/page.tsx` → `/collections/:slug`

`generateMetadata` reste côté serveur (fetch direct via `apiClient`, titre/description
dynamiques par collection) ; `CollectionDetailPage` est un Client Component (react-query
direct), même arbitrage que `home`/`la-une`/`nos-creations-galerie`/`creation-detail`/
`collections-liste`.

## Référence maquette

- Prompt Stitch : `stitch-prompts/07-collection-detail.md`
- Écran Stitch : **ANGALY — Collection Éternelle (Detail Page)**
- Section spécification : §10 (`docs/specifications/ANGALY_Specifications_Completes.md`)

## Arborescence de composants (livrée)

```
apps/web/src/features/collection-detail/
  ui/
    CollectionDetailPage.tsx      → orchestre cover cinématique + histoire + galerie + CTA
    CollectionCover.tsx            → cover plein écran (next/image), dégradé navy en bas, label saison + titre + tagline italique
    CollectionStory.tsx             → deux colonnes photo (cadre décoratif) + récit
    CollectionCreationsGrid.tsx      → carte dédiée (pas de réutilisation directe de `CreationCard` — voir Points d'attention)
    ClosingCtaBand.tsx                → headline + 2 CTA réels (contenu — voir hooks/useCollectionDetailContent.ts)
  hooks/
    useCollectionDetail.ts          → react-query sur GET /api/collections/:slug (créations + médias inclus)
    useCollectionDetailContent.ts    → bande CTA réelle, GET /content/public/collection-detail, repli codé en dur
  api/
    collection-detail.api.ts         → useCollectionDetailQuery, useCollectionDetailSectionsContentQuery
  utils/
    splitStory.ts                    → dérive les paragraphes depuis le champ texte unique `story`
  __tests__/
    useCollectionDetail.test.ts
    useCollectionDetailContent.test.ts
    splitStory.test.ts
    CollectionDetailPage.test.tsx
  index.ts
```

Toute logique (fetch) vit dans `hooks/` — `CollectionDetailPage.tsx` et les sections ne
contiennent que du JSX + appels de hooks. Pas de vidéo optionnelle (voir Points d'attention).

## Endpoints API consommés

| Endpoint | Module | Usage |
| --- | --- | --- |
| `GET /api/collections/:slug` | `collections` | Histoire, médias et créations associées de la collection |
| `GET /api/content/public/collection-detail` | `content` | Headline + libellés des 2 CTA de la bande de fermeture, `PUBLISHED`-only |

`get-collection-by-slug` renvoie déjà les `Creation[]` associées (voir
`docs/features/collections.md`) : pas d'appel séparé au module `creations` nécessaire pour
la Section 3.

## Modèles Prisma touchés

`Collection` (`description`, `story`, `seasonYear`), `Creation` (via la relation, réutilise
`category`/médias pour les cartes), `Media` (via `CollectionMedia` — cover + photo mood),
`PageSection` (`page="collection-detail"`, `sectionKey="closing-cta"` — headline + libellés
des 2 CTA de la bande de fermeture).

## Points d'attention

- **Bande CTA de fermeture migrée vers `PageSection` CMS** (session 2026-09-16, suite —
  huitième tranche de `docs/phases/phase-6-admin-cms.md` item 4, après `home`/`a-propos`/
  `la-une`/`nos-creations-galerie`/`creation-detail`/`contact`/`collections-liste`) :
  `ClosingCtaBand` lit `GET /content/public/collection-detail` via
  `useCollectionDetailContent` (headline + `ctaPrimaryLabel`/`ctaSecondaryLabel`), repli sur
  les littéraux codés en dur si la section `closing-cta` est absente/`DRAFT` — voir
  `docs/features/content.md`. Le reste de la page (cover, histoire, galerie) reste
  entièrement dérivé de `Collection` réelle — pas de littéral éditorial statique à migrer
  là, seule la bande de fermeture en avait un.
- **Fidélité vérifiée via `agy`/StitchMCP `get_screen`** (écran réel
  `1e8767e997ed4e80996410630db2981c`), pas seulement `stitch-prompts/07-collection-detail.md`.
- `Collection.story` est un champ texte unique (`String?`) — les 2 paragraphes réels sont
  reconstruits en le découpant sur les lignes vides (`utils/splitStory.ts`), avec repli sur
  `description` si `story` est vide.
- Vidéo de la collection (spec §10) : pas de champ Prisma dédié — omise plutôt que simulée
  (même limite que `docs/pages/collections-liste.md`).
- **`GET /api/collections/:slug` renvoie `creations: CollectionCreationDto[]`** (id, slug,
  name, coverImageUrl uniquement) — une forme plus légère que `CreationDto`, donc
  `CollectionCreationsGrid.tsx` ne réutilise **pas** directement le `CreationCard` de
  `docs/pages/nos-creations-galerie.md` comme le plan initial le supposait (écrit avant de
  connaître cette forme réelle) : pas de pill catégorie ni de matériaux affichés, faute de
  données sur ce DTO.
- Une collection dont `publishedAt` est nul ou dans le futur retourne un 404 côté page
  publique (même règle que `collections-liste`).

## Checklist d'acceptation

- [x] Cover cinématique + section histoire + galerie fidèles à l'écran Stitch réel
- [x] Bande CTA de fermeture avec les deux boutons (Prendre rendez-vous / Voir toutes les collections)
- [x] `<title>`/meta description dynamiques par collection (`generateMetadata` côté serveur)
- [x] Tests : `useCollectionDetail.test.ts`, `useCollectionDetailContent.test.ts`, `splitStory.test.ts`, `CollectionDetailPage.test.tsx` — 13 tests
- [x] `docs/checklist-implementation.md` et `docs/mockup-reference.md` mis à jour à ✅
