# Feature — `blog`

**Statut : ⬜ À faire.** Phase 1 — Présence digitale.

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

- [ ] `list-blog-posts` et `get-blog-post-by-slug` testés unitairement (filtres, non
      publié exclu, cas non trouvé)
- [ ] `list-related-posts` testé (exclusion de l'article courant, limite respectée)
- [ ] `blog-posts.controller.spec.ts` couvre les codes 200/404
- [ ] `docs/checklist-implementation.md` : `blog` passé à ✅
