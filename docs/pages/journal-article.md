# Page — `journal-article`

**Statut : ✅ Fait.** Phase 1 — Présence digitale.

## Objet

Page de lecture d'un article de journal, structurée pour le SEO, avec contenu similaire
suggéré et CTA de conversion (spec §44).

## Route(s)

`apps/web/src/app/(public)/journal/[slug]/page.tsx` → `/journal/:slug`

**`'use client'`** — comme toutes les pages Phase 1 à données dynamiques livrées cette
session, `JournalArticlePage` appelle `useJournalArticle(slug)`/`useRelatedArticles(slug)`
(react-query), donc pas de Server Component pur pour le corps de la page.
`generateMetadata` reste côté Server Component de la route (même pattern que
`creations/[slug]`/`ateliers/[slug]`) : un fetch direct via `apiClient` avant le rendu.

## Référence maquette

- Prompt Stitch : `stitch-prompts/23-journal-article.md`
- Écran Stitch : **ANGALY — Article : Choisir sa robe de mariée**
- Section spécification : §44 (`docs/specifications/ANGALY_Specifications_Completes.md`)

## Arborescence de composants (livrée)

```
apps/web/src/features/journal-article/
  ui/
    JournalArticlePage.tsx        → orchestre fil d'Ariane + header + corps/partage + articles liés + CTA
    ArticleHeader.tsx               → cover 70vh, tag catégorie, titre, ligne auteur/date/temps de lecture
    ArticleBody.tsx                   → colonne ~680px, paragraphes simples (voir Points d'attention)
    SocialShareBar.tsx                  → 'use client', sticky desktop (Facebook/WhatsApp/copier le lien)
    AuthorBox.tsx                         → photo, nom, rôle, bio, lien « Voir tous ses articles »
    RelatedArticlesRow.tsx                 → réutilise `ArticleCard` de `journal-liste` (import cross-feature délibéré, voir Points d'attention)
    AppointmentCtaBand.tsx                  → bande CTA de fermeture, contenu réel (voir hooks/useJournalArticleContent.ts)
  hooks/
    useJournalArticle.ts                    → react-query sur GET /api/blog-posts/:slug
    useRelatedArticles.ts                     → react-query sur GET /api/blog-posts/:slug/related
    useShareArticle.ts                         → 'use client', Facebook/WhatsApp/copier le lien (≠ Web Share API générique de creation-detail)
    useJournalArticleContent.ts                 → bande CTA (headline + corps + libellé), GET /content/public/journal-article, repli codé en dur
  api/
    journal-article.api.ts                       → useJournalArticleQuery, useRelatedArticlesQuery, useJournalArticleSectionsContentQuery
  utils/
    reading-time.util.ts                          → fonction pure (mots/minute), testée isolément
    formatArticleDate.ts                           → copie feature-locale (même implémentation que journal-liste, voir Points d'attention)
  __tests__/
    reading-time.test.ts, formatArticleDate.test.ts, useJournalArticle.test.ts,
    useRelatedArticles.test.ts, useShareArticle.test.ts, useJournalArticleContent.test.ts,
    ArticleHeader.test.tsx, ArticleBody.test.tsx, AuthorBox.test.tsx, SocialShareBar.test.tsx,
    RelatedArticlesRow.test.tsx, AppointmentCtaBand.test.tsx, JournalArticlePage.test.tsx
  index.ts
```

Pas de `useReadingTime.ts` hook séparé : `estimateReadingTime()` est une fonction pure sans
état, appelée directement dans `ArticleHeader.tsx` plutôt que d'ajouter une couche hook
inutile. Pas de `types/journal-article.types.ts` : `BlogPostDetailDto`/`BlogPostDto`
suffisent, même choix que `creation-detail`/`collection-detail`/`atelier-detail`.

## Endpoints API consommés

| Endpoint | Module | Usage |
| --- | --- | --- |
| `GET /api/blog-posts/:slug` | `blog` | Article complet (auteur, catégorie, médias, contenu) |
| `GET /api/blog-posts/:slug/related` | `blog` | Articles similaires, même catégorie, article courant exclu côté serveur |
| `GET /api/content/public/journal-article` | `content` | Headline + corps + libellé CTA de la bande de fermeture, `PUBLISHED`-only |

## Modèles Prisma touchés

`BlogPost` (`title`, `content`, `excerpt`, `publishedAt`), `Category`, `User` (auteur),
`Media` (via `BlogPostMedia`), `PageSection` (`page="journal-article"`,
`sectionKey="closing-cta"` — headline + corps + libellé du bouton).

## Points d'attention

- **Bande CTA de fermeture (headline + corps + libellé du bouton) migrée vers
  `PageSection` CMS** (session 2026-09-16, suite — douzième tranche de
  `docs/phases/phase-6-admin-cms.md` item 4, après `home`/`a-propos`/`la-une`/
  `nos-creations-galerie`/`creation-detail`/`contact`/`collections-liste`/
  `collection-detail`/`nos-ateliers-liste`/`atelier-detail`/`journal-liste`) :
  `AppointmentCtaBand` lit `GET /content/public/journal-article` via
  `useJournalArticleContent`, repli sur les littéraux codés en dur si la section
  `closing-cta` est absente/`DRAFT` — voir `docs/features/content.md`. Le reste de la
  page (header, corps, bloc auteur, articles liés) reste dérivé de `BlogPost` réel ou du
  lookup `author-profiles.ts`, hors périmètre de cette tranche.
- **Fidélité vérifiée via `agy`/StitchMCP `get_screen`** (écran réel
  `f09fd43e402e4112a0e8dd7092298faa`), pas seulement `stitch-prompts/23-journal-article.md`.
- **Byline auteur réel, pas générique** : contrairement à la première implémentation de
  `journal-liste` (byline générique « La Rédaction ANGALY »), l'écran réel de CETTE page
  montre un profil éditorial complet et nommé (« Mme. Fanja, Maître Tailleur » — photo, rôle,
  bio de 3 phrases). `BlogPostAuthorDto` ne porte toujours que `{id, email}` (`User` = modèle
  d'identité, pas un profil éditorial), donc un lookup partagé
  `apps/web/src/lib/author-profiles.ts` (`getAuthorProfile(email)`) a été créé — texte de
  bio/rôle en dur par e-mail, exactement la donnée "hors modèle" que cette fiche anticipait
  déjà. `journal-liste`'s `FeaturedArticleCard` a été rétro-adapté pour utiliser le même
  lookup (cohérence du site : le même auteur réel doit s'appeler pareil partout), avec un
  repli générique conservé pour tout e-mail auteur non présent dans le lookup.
  **Aucune photo réelle sourcée pour Mme. Fanja** (recherche Unsplash interrompue par une
  limite de session) — `photoUrl: null` dans le lookup ; `ArticleHeader`/`AuthorBox` gèrent
  déjà proprement l'absence de photo (pas d'avatar affiché plutôt qu'une image cassée). À
  compléter dans une session future.
- **`RelatedArticlesRow` réutilise `ArticleCard` de `journal-liste` par un import
  cross-feature direct** (`@/features/journal-liste`) — la seule fois cette session qu'un
  composant est réellement partagé entre deux features (pas dupliqué) : la fiche de cette
  page demande explicitement cette réutilisation, `ArticleCard` n'a aucun couplage à l'état
  interne de `journal-liste` (juste `article`/`isWide` en props), et les deux features
  consomment exactement le même DTO (`BlogPostDto`). Exporté depuis
  `journal-liste/index.ts`. Toute autre petite fonction pure partagée entre pages cette
  session (`buildDirectionsUrl`, `formatArticleDate`) reste dupliquée par feature — ce cas
  est l'exception délibérée, pas un changement de convention.
- **Corps d'article en paragraphes simples, pas de rendu riche** : `BlogPost.content` est un
  `String` unique. L'écran réel montre des sous-titres H2, une pull-quote et une image
  breakout intercalés dans le texte — les reproduire fidèlement demanderait soit un pipeline
  markdown sécurisé, soit des champs Prisma structurés, ni l'un ni l'autre n'existant
  aujourd'hui. Le contenu (`content.split(/\n{2,}/)`) est donc rendu en paragraphes React
  simples (jamais `dangerouslySetInnerHTML`), sûr mais visuellement plus sobre que la
  maquette pour cette section précise — à revoir si un vrai besoin de contenu riche par
  article est confirmé (voir aussi `docs/features/blog.md`).
- Partage social : 3 canaux explicites (Facebook/WhatsApp/copier le lien), pas le bouton
  Web-Share-API générique de `creation-detail` — l'écran réel liste ces 3 boutons
  spécifiquement. lucide-react n'a pas d'icône WhatsApp ; le tracé SVG exact de la maquette
  est inliné dans `SocialShareBar.tsx`.
- « Voir tous ses articles » (AuthorBox) pointe vers `href="#"` — aucune page de filtre par
  auteur n'existe (hors périmètre Phase 1), décoratif plutôt qu'un lien construit vers une
  route qui n'existe pas, même traitement que les dropdowns décoratifs de
  `nos-creations-galerie`.

## Checklist d'acceptation

- [x] En-tête article (cover, tag catégorie, titre, ligne auteur/date/temps de lecture) fidèle à l'écran réel
- [x] Corps d'article lisible (mesure ~680px) — paragraphes simples, pas de pull-quote/sous-titres/image breakout (voir Points d'attention)
- [x] Bloc auteur (nommé, avec bio réelle) + articles liés (« À lire aussi ») + bande CTA rendez-vous rendus
- [x] Partage social fonctionnel (Facebook, copier le lien, WhatsApp), barre sticky desktop
- [x] `<title>`/meta description définis via `generateMetadata` (spec §70/§71)
- [x] Tests : 13 fichiers, 72 tests au total avec `journal-liste` (100 % de couverture sur les deux features)
- [x] `docs/checklist-implementation.md` et `docs/mockup-reference.md` mis à jour à ✅
