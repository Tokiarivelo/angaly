# Page — `journal-liste`

**Statut : ✅ Fait.** Phase 1 — Présence digitale.

## Objet

Page d'index éditoriale du journal de la maison : conseils mariage/mode/costume,
tendances, coulisses d'atelier, entretien des vêtements (spec §43).

## Route(s)

`apps/web/src/app/(public)/journal/page.tsx` → `/journal`

**`'use client'`** — comme toutes les pages Phase 1 à données dynamiques livrées cette
session, `JournalListePage` appelle `useJournalArticles()` (react-query sur
`GET /api/blog-posts`), donc pas de Server Component pur.

## Référence maquette

- Prompt Stitch : `stitch-prompts/22-journal-liste.md`
- Écran Stitch : **ANGALY — Le Journal (Editorial Listing)**
- Section spécification : §43 (`docs/specifications/ANGALY_Specifications_Completes.md`)

## Arborescence de composants (livrée)

```
apps/web/src/features/journal-liste/
  ui/
    JournalListePage.tsx          → orchestre header + pilules + vedette + grille + widgets, JSX + hooks uniquement
    JournalHeader.tsx
    CategoryFilterPills.tsx        → 'use client', 7 pilules réelles
    FeaturedArticleCard.tsx         → article le plus récent (16:9, tag, titre, extrait, byline générique • date)
    ArticleCard.tsx                  → carte standard 3:4, tous les 3 éléments devient une carte « wide » horizontale avec « Lire l'article »
    ArticlesGrid.tsx
    PopularArticlesWidget.tsx         → 3 plus récents après la vedette (pas une vraie métrique de popularité)
    NewsletterSignupCard.tsx           → 'use client', réutilise `useNewsletterForm()` partagé (voir Points d'attention)
    LoadMoreButton.tsx                  → 'use client'
  hooks/
    useJournalArticles.ts                → dérive vedette/populaires/grille filtrée+paginée depuis un seul fetch
    useCategoryFilter.ts                  → état de la pilule active (slug | null)
  api/
    journal-liste.api.ts                   → useJournalArticlesQuery (GET /api/blog-posts?limit=50)
  consts/
    journal-categories.const.ts             → 7 pilules + AUTHOR_DISPLAY_NAME + ARTICLES_PAGE_SIZE
    queryKeys.ts
  utils/
    formatArticleDate.ts                     → date française longue (fonction pure)
  __tests__/
    formatArticleDate.test.ts, useCategoryFilter.test.ts, useJournalArticles.test.ts,
    CategoryFilterPills.test.tsx, FeaturedArticleCard.test.tsx, ArticleCard.test.tsx,
    ArticlesGrid.test.tsx, PopularArticlesWidget.test.tsx, NewsletterSignupCard.test.tsx,
    LoadMoreButton.test.tsx, JournalListePage.test.tsx
  index.ts
```

Toute logique (fetch, filtre catégorie, dérivation vedette/populaires, pagination) vit dans
`hooks/`/`utils/` — les composants `ui/` ne contiennent que du JSX + appels de hooks.

**Newsletter partagée** : `useNewsletterForm()`/`newsletterSchema`/`useNewsletterSubscribeMutation`
ont été déplacés de `features/home/` vers `apps/web/src/components/newsletter/` (logique
partagée, tests colocalisés dans `components/newsletter/__tests__/`) — home garde son propre
`NewsletterForm.tsx` (styling bande navy pleine largeur, bouton blanc en pilule) tandis que
`journal-liste` a son propre `NewsletterSignupCard.tsx` (carte navy latérale, champ souligné
empilé) : même hook, présentation propre à chaque page, exactement la consigne du plan
initial de cette fiche (« ne pas dupliquer la logique de validation/mutation »).

## Endpoints API consommés

| Endpoint | Module | Usage |
| --- | --- | --- |
| `GET /api/blog-posts?limit=50` | `blog` | Tous les articles publiés (triés `publishedAt desc` côté serveur), un seul fetch |

## Modèles Prisma touchés

`BlogPost`, `Category` (`kind = BLOG`), `Media` (via `BlogPostMedia`), `User` (auteur —
email seulement, voir Points d'attention). Le seed a été enrichi de 6 nouvelles catégories
BLOG (`mariage-a-madagascar`, `conseils-costume`, `tendances`, `coulisses-atelier`,
`entretien-vetements`, `haute-couture`) et de 5 vrais articles avec photo, pour que la page
ait du contenu réel à afficher (`GET /api/blog-posts` renvoyait 0 résultat avant ce seed).

## Points d'attention

- **Fidélité vérifiée via `agy`/StitchMCP `get_screen`** (écran réel
  `203057aedfaf46e8a086ba9b0c954c79`), pas seulement `stitch-prompts/22-journal-liste.md`.
- **Filtrage catégorie 100 % client-side** : `GET /api/blog-posts` filtre par `categoryId`
  (pas par `slug`), et aucun endpoint public `GET /api/categories` n'existe pour résoudre un
  slug de pilule vers son id. Plutôt que d'ajouter un endpoint backend hors périmètre
  frontend de cette session, tous les articles publiés sont récupérés en un seul fetch
  (`limit=50`, volume réel encore faible) puis filtrés/paginés côté client — même
  raisonnement déjà documenté pour `useContentTypeFilter` de `la-une`. À revoir si le volume
  d'articles croît significativement ou si `GET /api/categories` est un jour exposé.
- **Écran réel a un 7ᵉ tag « Haute Couture »** absent des 6 pilules de filtre listées par le
  plan initial (issu du seul prompt texte) — ajouté comme une vraie catégorie `Category`
  (donc un vrai tag d'article), mais **sans pilule de filtre dédiée** puisque le spec §43 et
  la maquette ne le listent pas parmi les pilules ; reste visible via « Tout » et sur l'article
  qui le porte.
- **Byline auteur générique** : `BlogPostAuthorDto` ne porte que `{id, email}` (`User` est un
  modèle d'identité/auth, pas un profil éditorial — même constat que
  `docs/pages/journal-article.md`). Afficher l'e-mail brut en byline public n'est pas
  approprié ; `AUTHOR_DISPLAY_NAME = 'La Rédaction ANGALY'` est utilisé à la place plutôt que
  de fabriquer un nom de personne à partir de l'e-mail.
- **Widget « Populaires »** : dérivé (3 articles les plus récents après la vedette), aucune
  métrique de popularité réelle n'existe sur `BlogPost` — peut chevaucher la grille standard
  (comportement normal d'un vrai widget « tendances », pas un bug).
- **Article vedette masqué quand une pilule spécifique est active** (choix UX ajouté par
  cette implémentation, au-delà du rendu statique de la maquette) : la vedette n'appartient
  pas forcément à la catégorie filtrée, l'afficher quand même serait incohérent avec le
  filtre actif.
- Date formatée en minuscules (« 1 mars 2026 ») — orthographe française correcte, pas la
  capitalisation décorative du mockup Stitch (« 12 Octobre 2024 »), même logique que
  l'élision « d'Antananarivo » d'`atelier-detail`.

## Checklist d'acceptation

- [x] Filtre par pilules de catégorie, article vedette, grille 3 colonnes desktop / 1 mobile fidèles à l'écran réel
- [x] Widget « Populaires » + carte newsletter rendus (données dérivées acceptables en Phase 1, voir Points d'attention)
- [x] Chargement progressif (« Voir plus d'articles ») sans rechargement de page
- [x] `<title>`/meta description définis (spec §70)
- [x] Tests : 11 fichiers, 34 tests (100 % de couverture sur la feature)
- [x] `docs/checklist-implementation.md` et `docs/mockup-reference.md` mis à jour à ✅
