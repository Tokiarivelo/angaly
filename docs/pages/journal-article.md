# Page — `journal-article`

**Statut : ⬜ À faire.** Phase 1 — Présence digitale.

## Objet

Page de lecture d'un article de journal, structurée pour le SEO, avec contenu similaire
suggéré et CTA de conversion (spec §44).

## Route(s)

`apps/web/src/app/(public)/journal/[slug]/page.tsx` → `/journal/:slug`

Server Component par défaut (corps d'article, SEO éditorial) ; la barre de partage social
et l'interaction de partage sont des Client Components isolés.

## Référence maquette

- Prompt Stitch : `stitch-prompts/23-journal-article.md`
- Écran Stitch : **ANGALY — Article : Choisir sa robe de mariée**
- Section spécification : §44 (`docs/specifications/ANGALY_Specifications_Completes.md`)

## Arborescence de composants attendue

```
apps/web/src/features/journal-article/
  ui/
    JournalArticlePage.tsx        → orchestre header + corps + partage + auteur + articles liés + CTA
    ArticleHeader.tsx               → cover, tag catégorie, titre serif, ligne auteur/date/temps de lecture
    ArticleBody.tsx                   → colonne centrale ~680px, sous-titres serif, citations, images inline
    SocialShareBar.tsx                  → 'use client' (Facebook, copier le lien, WhatsApp) — sticky desktop
    AuthorBox.tsx                         → photo, nom, bio courte, lien « Voir tous ses articles »
    RelatedArticlesRow.tsx                 → réutilise `ArticleCard` de `journal-liste`
    AppointmentCtaBand.tsx
  hooks/
    useJournalArticle.ts                    → react-query sur GET /api/blog-posts/:slug
    useRelatedArticles.ts                     → react-query sur GET /api/blog-posts/:slug/related
    useReadingTime.ts                          → calcul du temps de lecture estimé (fonction pure sur le contenu)
    useShareArticle.ts                          → 'use client' logique de partage (Web Share API / fallback copie de lien)
  api/
    journal-article.api.ts                       → useJournalArticleQuery, useRelatedArticlesQuery
  utils/
    reading-time.util.ts                          → fonction pure (mots/minute), testée isolément
  types/
    journal-article.types.ts
  __tests__/
    useJournalArticle.test.ts
    reading-time.test.ts
    JournalArticlePage.test.tsx
  index.ts
```

Toute logique (fetch, temps de lecture, partage) vit dans `hooks/`/`utils/` —
`JournalArticlePage.tsx` et les sections ne contiennent que du JSX + appels de hooks.

## Endpoints API consommés

| Endpoint | Module | Usage |
| --- | --- | --- |
| `GET /api/blog-posts/:slug` | `blog` | Article complet (auteur, catégorie, médias, contenu) |
| `GET /api/blog-posts/:slug/related` | `blog` | Articles similaires (« À lire aussi ») |

## Modèles Prisma touchés

`BlogPost` (`title`, `content`, `excerpt`, `publishedAt`), `Category`, `User` (auteur),
`Media` (via `BlogPostMedia` — cover + images inline).

## Points d'attention

- `User` ne porte pas de champ `bio`/photo publique dédiés pour l'auteur (c'est un modèle
  d'identité/auth, pas un profil éditorial) — en Phase 1, si l'`AuthorBox` doit afficher
  une bio courte, l'ajouter comme donnée de seed hors modèle (texte en dur par auteur)
  plutôt que de détourner `User` ; documenter le besoin d'un futur champ (`authorBio`/table
  dédiée) dans `docs/features/blog.md` si le besoin est confirmé.
- `BlogPost.content` est un `String` unique : les citations (pull-quotes), sous-titres et
  images inline du prompt Stitch sont donc à interpréter comme du contenu riche
  (Markdown/HTML éditorial saisi en un bloc), pas des champs structurés séparés — prévoir
  un rendu Markdown sécurisé (jamais `dangerouslySetInnerHTML` sur du HTML non sanitizé).
- Temps de lecture estimé : calcul pur côté front (`reading-time.util.ts`) à partir de
  `content`, pas un champ Prisma à ajouter pour un besoin aussi simple.
- Colonne de lecture centrée ~680px, ligne d'appui confortable — respecter la contrainte
  « AVOID: cramped line-length » du prompt Stitch.
- Barre de partage sociale : purement côté client (`'use client'`), aucun appel API
  nécessaire (compteurs de partage hors périmètre Phase 1).

## Checklist d'acceptation

- [ ] En-tête article (cover, tag catégorie, titre, ligne auteur/date/temps de lecture) fidèle à `stitch-prompts/23-journal-article.md`
- [ ] Corps d'article lisible (mesure ~680px, citations avec bordure champagne, images inline légendées)
- [ ] Bloc auteur + articles liés (« À lire aussi ») + bande CTA rendez-vous rendus
- [ ] Partage social fonctionnel (Facebook, copier le lien, WhatsApp), barre sticky en bas sur mobile
- [ ] `<title>`/meta description + données structurées Article (spec §70/§71) définis
- [ ] Tests : `useJournalArticle.test.ts`, `reading-time.test.ts`, `JournalArticlePage.test.tsx`
- [ ] `docs/checklist-implementation.md` et `docs/mockup-reference.md` mis à jour à ✅
