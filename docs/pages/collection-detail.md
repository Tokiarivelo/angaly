# Page — `collection-detail`

**Statut : ⬜ À faire.** Phase 1 — Présence digitale.

## Objet

Page éditoriale dédiée à une collection, racontant son histoire et présentant toutes les
créations associées — équivalent d'une page de catalogue d'exposition dédiée (spec §10).

## Route(s)

`apps/web/src/app/(public)/collections/[slug]/page.tsx` → `/collections/:slug`

Server Component par défaut (contenu quasi entièrement lecture) ; seule la vignette vidéo
optionnelle (lecture en overlay) reste un Client Component isolé si elle est activée.

## Référence maquette

- Prompt Stitch : `stitch-prompts/07-collection-detail.md`
- Écran Stitch : **ANGALY — Collection Éternelle (Detail Page)**
- Section spécification : §10 (`docs/specifications/ANGALY_Specifications_Completes.md`)

## Arborescence de composants attendue

```
apps/web/src/features/collection-detail/
  ui/
    CollectionDetailPage.tsx      → orchestre cover cinématique + histoire + galerie + CTA
    CollectionCover.tsx            → cover plein écran, dégradé navy en bas, label saison + titre + tagline italique
    CollectionStory.tsx             → deux colonnes photo + récit, vignette vidéo optionnelle
    CollectionCreationsGrid.tsx      → réutilise le style de carte de `nos-creations-galerie`
    ClosingCtaBand.tsx
  hooks/
    useCollectionDetail.ts          → react-query sur GET /api/collections/:slug (créations + médias inclus)
  api/
    collection-detail.api.ts         → useCollectionDetailQuery
  types/
    collection-detail.types.ts
  __tests__/
    useCollectionDetail.test.ts
    CollectionDetailPage.test.tsx
  index.ts
```

Toute logique (fetch) vit dans `hooks/` — `CollectionDetailPage.tsx` et les sections ne
contiennent que du JSX + appels de hooks.

## Endpoints API consommés

| Endpoint | Module | Usage |
| --- | --- | --- |
| `GET /api/collections/:slug` | `collections` | Histoire, médias et créations associées de la collection |

`get-collection-by-slug` renvoie déjà les `Creation[]` associées (voir
`docs/features/collections.md`) : pas d'appel séparé au module `creations` nécessaire pour
la Section 3.

## Modèles Prisma touchés

`Collection` (`description`, `story`, `seasonYear`), `Creation` (via la relation, réutilise
`category`/médias pour les cartes), `Media` (via `CollectionMedia` — cover + photo mood).

## Points d'attention

- `Collection.story` est un champ texte unique (`String?`) — les 2-3 paragraphes de la
  Section 2 sont donc saisis comme un seul bloc de texte riche (retours à la ligne), pas
  plusieurs champs distincts. Si une mise en forme (gras, listes) est nécessaire, envisager
  du Markdown stocké dans `story` plutôt qu'un champ HTML brut non sanitizé (risque XSS).
- Vidéo de la collection (spec §10) : pas de champ Prisma dédié — même remarque que
  `docs/pages/collections-liste.md`, traiter comme contenu statique en Phase 1.
- La galerie de créations (Section 3) réutilise directement le composant `CreationCard` de
  `docs/pages/nos-creations-galerie.md` — ne pas dupliquer un second style de carte création.
- Une collection dont `publishedAt` est nul ou dans le futur retourne un 404 côté page
  publique (même règle que `collections-liste`).

## Checklist d'acceptation

- [ ] Cover cinématique + section histoire + galerie masonry fidèles à `stitch-prompts/07-collection-detail.md`
- [ ] Bande CTA de fermeture avec les deux boutons (Prendre rendez-vous / Voir toutes les collections)
- [ ] Comportement mobile : cover plein écran conservée, histoire empilée, galerie 1 colonne, CTA RDV sticky bas
- [ ] `<title>`/meta description définis (spec §70)
- [ ] Tests : `useCollectionDetail.test.ts`, `CollectionDetailPage.test.tsx`
- [ ] `docs/checklist-implementation.md` et `docs/mockup-reference.md` mis à jour à ✅
