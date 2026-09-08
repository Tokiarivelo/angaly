# Feature — `blog`

**Statut : ✅ Fait.** Phase 1 — Présence digitale.

## Objet

Journal de la maison (articles conseils, coulisses, tendances — spec §43-44). Lecture seule
côté public en Phase 1 ; l'édition passe par `docs/features/content.md`/l'admin CMS en
Phase 6, la création/suppression d'articles restant un besoin ADMIN non couvert par une
maquette Stitch dédiée à ce jour (même note de scope que `creations`).

## Emplacement Clean Architecture

`apps/api/src/blog/`

```
domain/
  entities/blog-post.entity.ts          → invariants métier (slug non vide, publication dérivée de publishedAt)
  repositories/blog-post.repository.ts  → interface IBlogPostRepository (zéro import Prisma)
application/
  use-cases/
    list-blog-posts.use-case.ts         → filtre categoryId, pagination, publiés uniquement
    get-blog-post-by-slug.use-case.ts   → article complet + auteur + médias
    list-related-posts.use-case.ts      → articles similaires (spec §44), même catégorie, exclut l'article courant, limité (ex. 3)
  dtos/blog-post-response.dto.ts
infrastructure/
  repositories/prisma-blog-post.repository.ts → implémente IBlogPostRepository via PrismaService
  mappers/blog-post.mapper.ts                 → Prisma model → domain entity → DTO
presentation/
  controllers/blog-posts.controller.ts
__tests__/
  unit/list-blog-posts.use-case.spec.ts
  unit/list-related-posts.use-case.spec.ts
  integration/blog-posts.controller.spec.ts
```

## Modèles Prisma

`BlogPost` (relations : `Category`, `User` — auteur, `Media[]` via `BlogPostMedia`).

## Cas d'usage clés

- Lister les articles publiés (`publishedAt` non nul et passé), filtrables par `categoryId`,
  pagination offset/curseur
- Récupérer un article par `slug` avec son auteur, sa catégorie et ses médias
- Suggérer des articles similaires (même `categoryId`, article courant exclu) pour le CTA
  "articles similaires" de la page article (spec §44)

## Endpoints exposés

| Méthode | Route | Use-case | Auth |
| --- | --- | --- | --- |
| `GET` | `/api/blog-posts` | `list-blog-posts` | Public |
| `GET` | `/api/blog-posts/:slug` | `get-blog-post-by-slug` | Public |
| `GET` | `/api/blog-posts/:slug/related` | `list-related-posts` | Public |

## Points d'intégration

- **`media`** : couverture + images inline via `packages/storage`'s `buildPublicUrl()`.
- **Catégories** : `BlogPost.categoryId` référence `Category` avec `kind = BLOG` (modèle
  partagé avec `creations`/`products`, pas de duplication de la table des catégories).
- **Pages consommatrices** : `journal-liste`, `journal-article`, `home` (mise en avant
  éventuelle).

## Points d'attention

`BlogPost.authorId` est une FK obligatoire vers `User`, alors que les modules `auth`/`users`
n'existent qu'à partir de Phase 2/Phase 6 — en Phase 1, les auteurs sont créés directement en
base via `db.seed` (pas d'API d'inscription utilisable pour ce rôle éditorial à ce stade),
comme pour toute donnée saisie hors back-office avant Phase 6 (voir
`docs/phases/phase-1-digital-presence.md`, section "Hors scope").

## Vérification

- [x] `list-blog-posts` et `get-blog-post-by-slug` testés unitairement (filtres, non
      publié exclu, cas non trouvé)
- [x] `list-related-posts` testé (exclusion de l'article courant, limite respectée/défaut 3)
- [x] `blog-posts.controller.spec.ts` couvre les codes 200/400/404
- [x] Testé manuellement de bout en bout contre Postgres réel : 2 articles publiés + 1 non
      publié insérés, seuls les publiés apparaissent sur la liste (sans `content`), le détail
      expose le corps complet, le non publié renvoie 404, `related` exclut l'article courant
- [x] `docs/checklist-implementation.md` : `blog` passé à ✅

`packages/database/prisma/seed.ts` seed désormais 6 catégories `BLOG` (dont `haute-couture`,
absente des pilules de filtre de `journal-liste` — voir docs/pages/journal-liste.md "Points
d'attention") et 5 `BlogPost` réels avec photo, pour que `journal-liste`/`journal-article`
aient du contenu réel — la base de test manuelle mentionnée ci-dessus (2+1 articles) avait
été insérée puis retirée, la DB de dev était à 0 article avant ce seed.

## Note d'implémentation

- Comme `collections`, la liste (`GET /api/blog-posts`) et les articles similaires
  (`GET /api/blog-posts/:slug/related`) n'exposent jamais `content` (corps complet) —
  seul le détail (`GET /api/blog-posts/:slug`) le charge, via un second `select` Prisma
  dédié (`BLOG_POST_DETAIL_SELECT`) plutôt qu'un `include` non scopé.
- `BlogPostAuthorDto` n'expose que `{ id, email }` : `User` est un modèle
  d'identité/auth, pas un profil éditorial (pas de nom affiché/bio/avatar) — voir
  `docs/pages/journal-article.md`, qui documente déjà cette limite et reporte tout besoin de
  bio d'auteur à un futur champ dédié plutôt que de détourner `User`. En attendant, le
  frontend résout `{id, email}` vers un profil éditorial via
  `apps/web/src/lib/author-profiles.ts` (texte en dur par e-mail, partagé par
  `journal-liste`/`journal-article`) — si ce besoin est confirmé durable, prévoir un vrai
  champ/table dédié plutôt que ce lookup front.
- `list-related-posts` résout d'abord l'article courant (`findPublishedBySlug`) pour obtenir
  son `categoryId`, puis appelle `listRelated` — réutilise la même logique "publié
  uniquement" que le reste du module au lieu de la dupliquer.
