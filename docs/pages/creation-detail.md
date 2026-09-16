# Page — `creation-detail`

**Statut : ✅ Fait.** Phase 1 — Présence digitale. Galerie (avec lightbox/zoom plein écran),
panneau info, actions, savoir-faire, sections liées et bande de rendez-vous livrés et testés
— voir "Points d'attention" pour la décision documentée sur la barre d'actions sticky mobile.

## Objet

Page dédiée à une création unique (ex. une robe de mariée ou un costume), présentant sa
galerie complète, son savoir-faire et ses actions de conversion (rendez-vous,
personnalisation, favoris) — spec §8.

## Route(s)

`apps/web/src/app/(public)/creations/[slug]/page.tsx` → `/creations/:slug`

`generateMetadata` reste côté serveur (fetch direct via `apiClient`, titre/description
dynamiques par création) ; `CreationDetailPage` est un Client Component (react-query direct),
même arbitrage que `home`/`la-une`/`nos-creations-galerie`.

## Référence maquette

- Prompt Stitch : `stitch-prompts/04-creation-detail.md`
- Écran Stitch : **ANGALY — Robe Éternelle (Detail Page)**
- Section spécification : §8 (`docs/specifications/ANGALY_Specifications_Completes.md`)

## Arborescence de composants (livrée)

```
apps/web/src/features/creation-detail/
  ui/
    CreationDetailPage.tsx        → orchestre breadcrumb + galerie + panneau info + sections éditoriales
    CreationGallery.tsx            → 'use client' — image principale (next/image) + vignettes,
                                      switch d'image actif + ouverture du lightbox (useGalleryLightbox())
    GalleryLightbox.tsx             → 'use client', Radix Dialog plein écran (focus-trap + Échap gratuits,
                                      même pattern que components/navigation/MobileDrawer.tsx) : image agrandie
                                      (next/image object-contain), flèches précédent/suivant (masquées si 1 seul
                                      média), compteur « N / M », navigation clavier ←/→
    CreationInfoPanel.tsx          → sticky desktop : pill catégorie/collection, titre, description, specs, actions
    CreationActions.tsx             → 'use client' (Prendre RDV, Créer version personnalisée,
                                      favoris local, partage Web Share API + fallback presse-papiers)
    CraftsmanshipStory.tsx          → bande ivoire, texte générique maison réel (`content` prop, pas de
                                      récit par création, voir Points d'attention)
    RelatedCollectionRow.tsx        → scroll horizontal des créations de la même collection (masqué si aucune collection)
    RelatedCreationsGrid.tsx        → « Vous aimerez aussi » (même catégorie)
    AppointmentCtaBand.tsx
  hooks/
    useCreationDetail.ts            → react-query sur GET /api/creations/:slug
    useRelatedCreations.ts           → react-query (même collection / même catégorie, exclut la création courante)
    useGalleryLightbox.ts            → index de vignette actif uniquement
    useCreationDetailContent.ts      → texte du bandeau savoir-faire (`page="creation-detail"`,
                                        `sectionKey="savoir-faire"`) lu depuis `PageSection` (session
                                        2026-09-16, suite — voir docs/features/content.md), repli sur les
                                        littéraux codés en dur si la section n'existe pas/n'est pas publiée
  api/
    creation-detail.api.ts           → useCreationDetailQuery, useCollectionCreationsQuery,
                                        useCategoryCreationsQuery, useCreationDetailSectionsContentQuery
  consts/
    availability-labels.const.ts     → libellés FR de `CreationAvailability`
  __tests__/
    useCreationDetail.test.ts
    useCreationDetailContent.test.ts
    CreationDetailPage.test.tsx
  index.ts
```

**Non livré** (voir "Points d'attention") : persistance des favoris (`useCreationActions`/`POST
/api/favorites`, dépend de `customers` Phase 2). La barre d'actions sticky mobile a été
évaluée et volontairement non dupliquée — voir "Points d'attention".

Toute logique (fetch, galerie, actions) vit dans `hooks/` — `CreationDetailPage.tsx`
et les sections ne contiennent que du JSX + appels de hooks.

## Endpoints API consommés

| Endpoint | Module | Usage |
| --- | --- | --- |
| `GET /api/creations/:slug` | `creations` | Fiche complète (médias ordonnés, specs) — aussi appelé côté serveur dans `generateMetadata` |
| `GET /api/creations?collectionId=&limit=5` | `creations` | Créations de la même collection, création courante filtrée côté hook |
| `GET /api/creations?categoryId=&limit=5` | `creations` | Créations similaires « Vous aimerez aussi », création courante filtrée côté hook |
| `POST /api/favorites` (`entityType=CREATION`) | `customers` (Phase 2) | Non câblé — favori local uniquement, voir Points d'attention |
| `GET /api/content/public/creation-detail` | `content` | Texte du bandeau savoir-faire, `PUBLISHED`-only, sans auth (session 2026-09-16, suite) |

## Modèles Prisma touchés

`Creation` (tous champs), `Category`, `Collection?`, `Media` (via `CreationMedia`, ordonnés
`sortOrder`), `Favorite` (Phase 2).

## Points d'attention

- **Fidélité vérifiée via `agy`/StitchMCP `get_screen`** (écran réel
  `54a67878b9fe467390cd93a1b825797c`, "Robe Éternelle (Detail Page)"), pas seulement
  `stitch-prompts/04-creation-detail.md`. Écarts réels trouvés : la spec réelle n'a que 3
  lignes (Matière / Techniques / Confection), pas 5 ; « Confection » y décrit un récit figé
  ("120 heures de travail") sans champ Prisma porteur — remplacé par une ligne
  « Disponibilité » réelle (`availability`) à la place, même arbitrage que les filtres
  décoratifs de `docs/pages/nos-creations-galerie.md`.
- Le modèle `Media` ne porte pas de champ dédié « type de vue » (vue de face, vue arrière,
  détail, coulisses) : uniquement `sortOrder` et `altText` libres. La galerie affiche les
  vignettes dans l'ordre reçu ; aucune convention de nommage n'est imposée pour l'instant.
- « Créer une version personnalisée » pointe vers `/creations/:slug/personnaliser`
  (`personnalisation-creation`, Phase 2) même si la route n'existe pas encore — jamais de
  lien mort/masqué, même convention que `docs/pages/home.md`.
- Le bouton favori (`CreationActions.tsx`) est local uniquement (`useState`, pas de
  persistance) — dépend de `customers`/Phase 2 pour un vrai état.
- La section « Le savoir-faire derrière cette création » utilise le texte général de la
  maison (pas de récit spécifique à la création) : aucun champ Prisma ne porte une
  narration par création, et le récit du texte réel Stitch ("nos brodeuses...") est
  spécifique à Robe Éternelle, donc non généralisable sans invention de contenu. Ce texte
  générique est lu depuis `PageSection` (`page="creation-detail"`, `sectionKey="savoir-
  faire"`) via `GET /content/public/creation-detail` depuis la session 2026-09-16 (suite) —
  cinquième page migrée après `home`/`a-propos`/`la-une`/`nos-creations-galerie`, voir
  `docs/features/content.md` et `docs/phases/phase-6-admin-cms.md` (item 4). Repli sur le
  littéral codé en dur (`useCreationDetailContent.ts`) si la section est absente ou encore
  `DRAFT`.
- Aucune donnée de prix n'est affichée (`Creation` ne porte pas de champ `price`,
  contrairement à `Product`) — jamais présentée comme une fiche produit e-commerce.
- **Lightbox/zoom plein écran ajouté dans une passe ultérieure**, fidélité revérifiée sur le
  HTML réel de l'écran Stitch (téléchargé directement, pas de capture d'écran) : seul le
  bouton « Zoom » (icône `zoom_in`, `bottom-4 right-4`, `bg-white/80 backdrop-blur`,
  `opacity-0 group-hover:opacity-100`) existe sur la capture statique desktop — aucun état de
  lightbox ouvert n'est capturé (la maquette Stitch n'a qu'un écran DESKTOP, 2560px, pas
  d'écran mobile dédié). Le comportement d'ouverture/navigation du lightbox lui-même suit donc
  le texte du prompt (`stitch-prompts/04-creation-detail.md`, "Support a lightbox/zoom state
  on click… swipeable image carousel with dot indicators" côté mobile) plutôt qu'un écran
  Stitch state-par-state, avec un compteur « N / M » textuel à la place des dots. L'icône zoom
  est reproduite `opacity-0`/`group-hover` seulement à partir de `md:` (le hover n'existe pas
  au tactile) — toujours visible en dessous de `md:`, vérifié par un test Playwright dédié en
  viewport mobile (opacity `1` sans interaction).
- **Barre d'actions sticky mobile — décision : non dupliquée.** Le prompt Stitch d'origine
  (rédigé avant `navigation-mobile`) demandait une barre basse sticky propre à cette page
  (« Prendre rendez-vous » + cœur favoris). Depuis, `docs/pages/navigation-mobile.md` a livré
  une barre basse globale (`MobileBottomBar.tsx`, montée sur toutes les pages publiques via
  `(public)/layout.tsx`) qui affiche déjà un CTA « Prendre rendez-vous » proéminent (bouton
  surélevé central) ainsi que Favoris/Compte. Empiler une seconde barre sticky spécifique à
  cette page juste au-dessus de la barre globale aurait dupliqué la même action et encombré
  l'écran sans plus-value réelle (aucun écran Stitch ne montre les deux ensemble). Décision :
  la barre globale couvre ce besoin, aucune barre supplémentaire n'est ajoutée sur
  `creation-detail` — item du prompt initial volontairement superseded, pas oublié.
- Persistance des favoris reste hors périmètre (dépend de `customers`/Phase 2).

## Checklist d'acceptation

- [x] Galerie (image principale `next/image` + vignettes cliquables) fidèle à l'écran Stitch réel
- [x] Panneau d'informations sticky desktop avec specs réelles (Matière, Techniques, Disponibilité)
- [x] Bande « Le savoir-faire » + « Fait partie de la collection » (masquée si pas de collection) + « Vous aimerez aussi » sur données réelles
- [x] Bande de rendez-vous de fermeture
- [x] `<title>`/meta description dynamiques par création (`generateMetadata` côté serveur)
- [x] Zoom/lightbox plein écran (image agrandie, flèches précédent/suivant, compteur, Échap, clic sur l'image) fidèle au bouton « Zoom » réel de l'écran Stitch
- [x] Zoom accessible au tactile (icône toujours visible en dessous de `md:`, pas seulement au survol) — vérifié en direct en viewport mobile
- [x] Barre d'actions sticky mobile : décision documentée (superseded par la barre basse globale de `navigation-mobile`, pas dupliquée)
- [x] Tests : `useCreationDetail.test.ts`, `useGalleryLightbox.test.ts`, `useCreationDetailContent.test.ts`, `GalleryLightbox.test.tsx`, `CreationDetailPage.test.tsx` — 27 tests, tous verts (session 2026-09-16, suite)
- [ ] Persistance des favoris (reportée, Phase 2/`customers`)
- [x] `docs/checklist-implementation.md` et `docs/mockup-reference.md` mis à jour à ✅
