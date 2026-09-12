# Feature — `reviews`

**Statut : ✅ Terminé.** Phase 2 — Conversion.

## Objet

Deux contenus distincts, volontairement non confondus (spec §42 : "le site doit distinguer
clairement les avis vérifiés des témoignages éditoriaux") :

1. **`Review`** — avis client sur un produit (spec §42), soumis par les clients eux-mêmes.
2. **`Testimonial`** — témoignage éditorial curé par l'équipe ANGALY (spec §41, section
   "Elles nous ont fait confiance"), affiché notamment sur `home`. La création/édition des
   témoignages est un besoin ADMIN sans maquette Stitch dédiée à ce jour (même note de scope
   que `creations`) : ce module expose leur lecture publique, pas encore leur CRUD.

## Emplacement Clean Architecture

`apps/api/src/reviews/`

```
domain/
  entities/review.entity.ts               → invariants métier (rating entre 1 et 5)
  entities/testimonial.entity.ts          → invariants (quote non vide)
  repositories/review.repository.ts       → interface IReviewRepository (zéro import Prisma)
  repositories/testimonial.repository.ts  → interface ITestimonialRepository
application/
  use-cases/
    create-review.use-case.ts             → soumission d'un avis (isVerified = false par défaut)
    list-reviews-for-product.use-case.ts  → tous les avis d'un produit, vérifiés et non vérifiés distingués côté DTO
    mark-review-verified.use-case.ts      → staff : bascule isVerified (pas de page dédiée à ce jour)
    list-featured-testimonials.use-case.ts → témoignages publiés, les plus récents en tête
  dtos/
    review-response.dto.ts
    testimonial-response.dto.ts
infrastructure/
  repositories/prisma-review.repository.ts       → implémente IReviewRepository via PrismaService
  repositories/prisma-testimonial.repository.ts  → implémente ITestimonialRepository via PrismaService
  mappers/review.mapper.ts
  mappers/testimonial.mapper.ts
presentation/
  controllers/reviews.controller.ts
  controllers/testimonials.controller.ts
__tests__/
  unit/create-review.use-case.spec.ts
  unit/list-featured-testimonials.use-case.spec.ts
  integration/reviews.controller.spec.ts
  integration/testimonials.controller.spec.ts
```

## Modèles Prisma

`Review` (`customerId`, `productId?`, `rating`, `comment?`, `isVerified`), `Testimonial`
(`customerName`, `creationLabel?`, `quote`, `isVerified`, `isPublished`, `media[]` via
`TestimonialMedia`).

## Cas d'usage clés

- Soumettre un avis sur un produit (`rating` 1-5, `comment` optionnel), `isVerified = false`
  par défaut à la création
- Lister les avis d'un produit, en surfaçant explicitement `isVerified` côté DTO pour que le
  frontend distingue visuellement les avis vérifiés (spec §42) — aucun avis n'est masqué par
  défaut, seul le badge diffère
- Marquer un avis comme vérifié (action staff, ex. après confirmation d'un achat réel) —
  usage interne sans page dédiée à ce jour
- Lister les témoignages mis en avant : `isPublished = true`, triés par `createdAt`
  décroissant, limités (ex. 6 pour le carrousel `home`)

## Endpoints exposés

| Méthode | Route | Use-case | Auth |
| --- | --- | --- | --- |
| `GET` | `/api/products/:productId/reviews` | `list-reviews-for-product` | Public |
| `POST` | `/api/products/:productId/reviews` | `create-review` | `CLIENT` |
| `POST` | `/api/reviews/:id/verify` | `mark-review-verified` | `MANAGER`,`ADMIN` |
| `GET` | `/api/testimonials?featured=true` | `list-featured-testimonials` | Public |

## Points d'intégration

- **`products`** : `Review.productId` référence `Product` en lecture seule ; ce module
  n'écrit jamais dans `Product`.
- **`customers`** : `Review.customerId` obligatoire — soumettre un avis nécessite un compte
  `CLIENT`.
- **`media`** : les photos associées à un `Testimonial` (`TestimonialMedia`) passent par le
  module `media`/`packages/storage`.
- **Pages consommatrices** : `home` (`GET /api/testimonials?featured=true`, voir
  `docs/pages/home.md` — "Témoignages mis en avant"), `fiche-produit` (avis du produit).

## Points d'attention

- Le modèle Prisma `Review` ne porte qu'une relation optionnelle vers `Product`
  (`productId?`) — **aucun champ `creationId`** : contrairement à une lecture rapide du
  périmètre ("avis sur produits/créations"), ce module ne peut pas attacher un avis
  directement à une `Creation` tant que le schéma n'évolue pas. Les avis sur une création
  pièce-unique restent hors périmètre de ce module en l'état actuel de
  `packages/database/prisma/schema.prisma`.
- Le modèle `Testimonial` ne possède pas de champ `isFeatured` : le paramètre `featured=true`
  attendu par `docs/pages/home.md` est donc mappé sur `isPublished = true` (tous les
  témoignages publiés sont éligibles à la mise en avant, la sélection fine — ex. les 6 plus
  pertinents — se fait par tri + limite, pas par un flag dédié). Documenté ici plutôt
  qu'un champ inventé.
- `Testimonial` est un contenu **curé par le staff**, jamais soumis directement par un
  client (contrairement à `Review`) — pas d'endpoint `POST /api/testimonials` public.

## Vérification

- [x] `create-review` testé (rating hors bornes rejeté, `isVerified` toujours `false` à la
      création)
- [x] `list-featured-testimonials` testé (exclusion des témoignages non publiés, tri, limite)
- [x] `reviews.controller.spec.ts`/`testimonials.controller.spec.ts` couvrent les codes
      200/201/400/403
- [x] `docs/checklist-implementation.md` : `reviews` passé à ✅
