# Feature — `categories`

**Statut : ✅ Fait.** Phase 1 — Présence digitale.

## Objet

Taxonomie partagée entre `Creation`, `Product` et `BlogPost` (un seul modèle `Category`,
différencié par `kind`). Ce module n'a pas de page dédiée : il sert le premier vrai filtre
« Catégorie » de `nos-creations-galerie` (docs/pages/nos-creations-galerie.md), qui jusqu'ici
n'avait aucun moyen de lister les catégories réelles pour peupler son dropdown.

## Emplacement Clean Architecture

`apps/api/src/categories/`

```
domain/
  entities/category.entity.ts            → invariants métier (slug/name non vides)
  repositories/category.repository.ts    → interface ICategoryRepository (zéro import Prisma)
  value-objects/category-kind.vo.ts      → miroir local de CategoryKind (le Domain ne dépend pas de @angaly/types)
application/
  use-cases/list-categories.use-case.ts  → filtre optionnel par kind, pas de pagination
  dtos/
    category-response.dto.ts
    list-categories-query.dto.ts         → valide `kind` via class-validator (@IsEnum)
infrastructure/
  repositories/prisma-category.repository.ts → implémente ICategoryRepository via PrismaService
  mappers/category.mapper.ts                 → Prisma model → domain entity → DTO
presentation/
  controllers/categories.controller.ts
__tests__/
  unit/category.entity.spec.ts, category-kind.vo.spec.ts, list-categories.use-case.spec.ts,
       category.mapper.spec.ts, prisma-category.repository.spec.ts
  integration/categories.controller.spec.ts
```

## Modèles Prisma

`Category` (`id`, `slug`, `name`, `kind: CategoryKind`) — aucune relation chargée par ce
module (pas de `creations`/`products`/`blogPosts` dans le `select`, ce module ne fait que
lister la taxonomie elle-même).

## Cas d'usage clés

- Lister les catégories, optionnellement filtrées par `kind` (`CREATION`/`PRODUCT`/`BLOG`),
  triées par nom — volume attendu faible (taxonomie fixe), pas de pagination, même
  arbitrage que `ateliers`

## Endpoints exposés

| Méthode | Route | Use-case | Auth |
| --- | --- | --- | --- |
| `GET` | `/api/categories?kind=` | `list-categories` | Public |

## Points d'intégration

- **`creations`** : `nos-creations-galerie` appelle `GET /api/categories?kind=CREATION` pour
  peupler le dropdown « Catégorie » avec de vraies catégories, puis filtre
  `GET /api/creations?categoryId=` (déjà supporté par `creations`, non modifié ici) — voir
  `docs/pages/nos-creations-galerie.md`.
- **`products`/`blog`** (Phase 2 pour `products`, `blog` déjà ✅) : le même endpoint sert déjà
  n'importe quel futur filtre par catégorie sur ces domaines sans module supplémentaire.

## Points d'attention

`CategoryKind` (`@angaly/types`) est généré par Prisma 6 comme une union de littéraux
(`(typeof CategoryKind)[keyof typeof CategoryKind]`), pas un `enum` TypeScript nominal — un
miroir domaine en simple union de chaînes (`category-kind.vo.ts`) est donc directement
assignable dans les deux sens avec le type généré par Prisma, sans caster, contrairement à ce
qu'un `enum` TS classique aurait exigé.

Seul le filtre « Catégorie » de `nos-creations-galerie` est concerné par ce module — Genre,
Type, Couleur et Style restent décoratifs : aucun champ Prisma ne les modélise sur `Creation`
(voir `docs/pages/nos-creations-galerie.md` "Points d'attention"), ce module n'y change rien.

## Vérification

- [x] `list-categories` testé unitairement (avec/sans filtre `kind`)
- [x] `categories.controller.spec.ts` couvre les codes 200 (sans/avec `kind`) et 400 (`kind`
      invalide, rejeté par `class-validator`)
- [x] Testé manuellement de bout en bout contre Postgres réel : `GET /api/categories` et
      `GET /api/categories?kind=CREATION` retournent les vraies catégories seedées, triées
      par nom
- [x] `docs/checklist-implementation.md` : `categories` passé à ✅
