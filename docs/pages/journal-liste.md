# Page — `journal-liste`

**Statut : ⬜ À faire.** Phase 1 — Présence digitale.

## Objet

Page d'index éditoriale du journal de la maison : conseils mariage/mode/costume,
tendances, coulisses d'atelier, entretien des vêtements (spec §43).

## Route(s)

`apps/web/src/app/(public)/journal/page.tsx` → `/journal`

Server Component par défaut pour la grille d'articles (SEO éditorial) ; le filtre par
pilules de catégorie, le chargement progressif et la carte newsletter sont des Client
Components isolés.

## Référence maquette

- Prompt Stitch : `stitch-prompts/22-journal-liste.md`
- Écran Stitch : **ANGALY — Le Journal (Editorial Listing)**
- Section spécification : §43 (`docs/specifications/ANGALY_Specifications_Completes.md`)

## Arborescence de composants attendue

```
apps/web/src/features/journal-liste/
  ui/
    JournalListePage.tsx          → orchestre header + filtre catégories + article vedette + grille + widgets
    JournalHeader.tsx
    CategoryFilterPills.tsx        → 'use client' (Tout, Mariage à Madagascar, Conseils mode, ...)
    FeaturedArticleCard.tsx         → grand article vedette
    ArticleCard.tsx                  → carte standard (cover, catégorie, titre, extrait, auteur, date)
    ArticlesGrid.tsx
    PopularArticlesWidget.tsx         → mini-liste « Populaires »
    NewsletterSignupCard.tsx           → 'use client' (état vient de useNewsletterForm(), réutilisé de `home`)
    LoadMoreButton.tsx                  → 'use client'
  hooks/
    useJournalArticles.ts                → react-query sur GET /api/blog-posts, filtre categoryId, pagination
    useCategoryFilter.ts                  → état de la pilule catégorie active
  api/
    journal-liste.api.ts                   → useJournalArticlesQuery
  consts/
    journal-categories.const.ts             → pilules (Mariage à Madagascar, Conseils mode, Conseils costume, Tendances, Coulisses de l'atelier, Entretien des vêtements)
    queryKeys.ts
  __tests__/
    useJournalArticles.test.ts
    JournalListePage.test.tsx
  index.ts
```

Toute logique (fetch, filtre catégorie, pagination) vit dans `hooks/` —
`JournalListePage.tsx` et les sections ne contiennent que du JSX + appels de hooks.

## Endpoints API consommés

| Endpoint | Module | Usage |
| --- | --- | --- |
| `GET /api/blog-posts?categoryId=&page=&limit=` | `blog` | Liste des articles publiés, filtrable par catégorie |
| `GET /api/blog-posts?sort=publishedAt:desc&limit=1` | `blog` | Article vedette (le plus récent, faute de champ dédié — voir Points d'attention) |

## Modèles Prisma touchés

`BlogPost` (`title`, `excerpt`, `categoryId`, `authorId`, `publishedAt`), `Category`
(`kind = BLOG`), `Media` (via `BlogPostMedia`), `User` (auteur — avatar/nom).

## Points d'attention

- `BlogPost` n'a pas de champ `isFeatured` (contrairement à `Creation`) : en Phase 1,
  désigner l'article vedette comme le plus récent publié (`publishedAt` desc, limite 1),
  exclu ensuite de la grille standard — documenter ce choix dans `docs/features/blog.md`
  si une vraie mise en avant manuelle devient nécessaire.
- Les catégories du filtre (spec §43) sont portées par `Category` (`kind = BLOG`) —
  vérifier que le seed Phase 1 crée bien les 6-7 catégories listées dans la maquette ; seule
  la pilule « Tout » est un état front, pas une catégorie Prisma.
- Widget « Populaires » (optionnel dans la maquette) : aucun compteur de vues/popularité
  n'existe sur `BlogPost` — en Phase 1, trier par `publishedAt` desc en l'absence de
  métrique réelle ; prévoir un futur champ `viewCount` si l'analytics (spec §86) doit
  alimenter ce widget.
- La carte newsletter réutilise le composant/hook `useNewsletterForm` déjà spécifié dans
  `docs/pages/home.md` — ne pas dupliquer la logique de validation/mutation.
- `BlogPost.authorId` est une FK obligatoire vers `User` alors que `auth`/`users`
  n'existent qu'à partir de Phase 2/6 : les auteurs sont seedés directement en base (même
  remarque que `docs/features/blog.md`).

## Checklist d'acceptation

- [ ] Filtre par pilules de catégorie, article vedette, grille 3 colonnes desktop / 1 mobile fidèles à `stitch-prompts/22-journal-liste.md`
- [ ] Widget « Populaires » + carte newsletter rendus (données dérivées acceptables en Phase 1, voir Points d'attention)
- [ ] Chargement progressif (« Voir plus d'articles ») sans rechargement de page
- [ ] `<title>`/meta description définis (spec §70)
- [ ] Tests : `useJournalArticles.test.ts`, `JournalListePage.test.tsx`
- [ ] `docs/checklist-implementation.md` et `docs/mockup-reference.md` mis à jour à ✅
