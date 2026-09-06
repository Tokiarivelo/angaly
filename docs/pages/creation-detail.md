# Page — `creation-detail`

**Statut : ⬜ À faire.** Phase 1 — Présence digitale.

## Objet

Page dédiée à une création unique (ex. une robe de mariée ou un costume), présentant sa
galerie complète, son savoir-faire et ses actions de conversion (rendez-vous,
personnalisation, favoris) — spec §8.

## Route(s)

`apps/web/src/app/(public)/creations/[slug]/page.tsx` → `/creations/:slug`

Server Component par défaut (contenu majoritairement lecture) ; la galerie/lightbox, le
carousel mobile, les actions (favoris, partage) et la barre d'actions sticky mobile sont
des Client Components isolés.

## Référence maquette

- Prompt Stitch : `stitch-prompts/04-creation-detail.md`
- Écran Stitch : **ANGALY — Robe Éternelle (Detail Page)**
- Section spécification : §8 (`docs/specifications/ANGALY_Specifications_Completes.md`)

## Arborescence de composants attendue

```
apps/web/src/features/creation-detail/
  ui/
    CreationDetailPage.tsx        → orchestre galerie + panneau info + sections éditoriales
    CreationGallery.tsx            → viewer principal + filmstrip vignettes ; 'use client' pour le lightbox/zoom (état vient de useGalleryLightbox())
    CreationInfoPanel.tsx          → sticky desktop : tag catégorie/collection, titre, description, specs, actions
    CreationSpecList.tsx           → Type, Matière, Techniques, Disponibilité, Reproduction/personnalisation
    CreationActions.tsx             → 'use client' (Prendre RDV, Créer version personnalisée, favoris, partager) — état vient de useCreationActions()
    CraftsmanshipStory.tsx          → bande ivoire « Le savoir-faire derrière cette création » + photos coulisses
    RelatedCollectionRow.tsx        → scroll horizontal des créations de la même collection
    RelatedCreationsGrid.tsx        → « Vous aimerez aussi » (même catégorie)
    AppointmentCtaBand.tsx
    MobileStickyActionBar.tsx        → 'use client' (RDV + favoris, sticky bas d'écran mobile)
  hooks/
    useCreationDetail.ts            → react-query sur GET /api/creations/:slug
    useRelatedCreations.ts           → react-query (même collection / même catégorie, exclut la création courante)
    useGalleryLightbox.ts            → index actif, ouverture/fermeture zoom
    useCreationActions.ts            → favoris (mutation), partage (Web Share API / fallback copie de lien)
  api/
    creation-detail.api.ts           → useCreationDetailQuery, useRelatedCreationsQuery, useToggleFavoriteMutation
  types/
    creation-detail.types.ts
  __tests__/
    useCreationDetail.test.ts
    useCreationActions.test.ts
    CreationDetailPage.test.tsx
  index.ts
```

Toute logique (fetch, lightbox, favoris, partage) vit dans `hooks/` — `CreationDetailPage.tsx`
et les sections ne contiennent que du JSX + appels de hooks.

## Endpoints API consommés

| Endpoint | Module | Usage |
| --- | --- | --- |
| `GET /api/creations/:slug` | `creations` | Fiche complète (médias ordonnés, specs) |
| `GET /api/creations?collectionId=&limit=4` | `creations` | Créations de la même collection (Section 4), création courante filtrée côté hook |
| `GET /api/creations?categoryId=&limit=4` | `creations` | Créations similaires « Vous aimerez aussi » (Section 5), création courante filtrée côté hook |
| `POST /api/favorites` (`entityType=CREATION`) | `customers` (Phase 2) | Ajout/retrait des favoris — non câblé en Phase 1, voir Points d'attention |

## Modèles Prisma touchés

`Creation` (tous champs), `Category`, `Collection?`, `Media` (via `CreationMedia`, ordonnés
`sortOrder`), `Favorite` (Phase 2).

## Points d'attention

- Le modèle `Media` ne porte pas de champ dédié « type de vue » (vue de face, vue arrière,
  détail, photo portée, coulisses — spec §8.1) : uniquement `sortOrder` et `altText` libres.
  En Phase 1, convenir d'une convention d'ordre/`altText` pour reconstituer les onglets du
  filmstrip côté front — à documenter dans `docs/features/creations.md` si une vraie
  taxonomie de médias devient nécessaire (même limite que `docs/pages/la-une.md` pour les
  types de contenu éditoriaux).
- « Créer une version personnalisée » pointe vers `personnalisation-creation`
  (`/creations/:slug/personnaliser`, Phase 2, groupe de route `(client)`) — lien câblé dès
  Phase 1 même si la route/le compte client n'existe pas encore (lien désactivé avec
  tooltip ou feature flag, ne pas laisser un lien mort en prod, même remarque que
  `docs/pages/home.md`).
- « Ajouter aux favoris » dépend de `customers`/Phase 2 (voir `docs/features/creations.md`)
  — en Phase 1, afficher le bouton à l'état non connecté (redirection vers connexion)
  plutôt que de le masquer.
- Aucune donnée de prix n'est affichée (`Creation` ne porte pas de champ `price`,
  contrairement à `Product`) : respecter la consigne du prompt Stitch de ne jamais
  présenter la page comme une fiche produit e-commerce classique.
- Galerie desktop en deux colonnes avec panneau info sticky / mobile en carousel plein
  écran avec barre d'actions sticky en bas ; les cartes des Sections 4/5 réutilisent le
  style `CreationCard` de `docs/pages/nos-creations-galerie.md` (pas de second style de
  carte création).

## Checklist d'acceptation

- [ ] Galerie desktop (viewer + filmstrip + lightbox) et mobile (carousel swipeable + points) fidèles à `stitch-prompts/04-creation-detail.md`
- [ ] Panneau d'informations sticky desktop avec la liste de specs complète (Type, Matière, Techniques, Disponibilité, Reproduction/personnalisation)
- [ ] Bande « Le savoir-faire » + Section « Fait partie de la collection » + « Vous aimerez aussi » rendues, dégradation propre si la collection est absente
- [ ] Barre d'actions sticky mobile (Prendre rendez-vous en priorité + favoris)
- [ ] `<title>`/meta description dynamiques par création (spec §71 SEO des réalisations)
- [ ] Tests : `useCreationDetail.test.ts`, `useCreationActions.test.ts`, `CreationDetailPage.test.tsx`
- [ ] `docs/checklist-implementation.md` et `docs/mockup-reference.md` mis à jour à ✅
