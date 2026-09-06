# Feature — `customers`

**Statut : ⬜ À faire.** Phase 2 — Conversion.

## Objet

Profil client (`Customer`, 1:1 avec `User`) créé à l'inscription (voir `auth`), et gestion
des favoris (`Favorite` — créations, produits, collections, spec §47) : "les favoris peuvent
aider à préparer un rendez-vous".

## Emplacement Clean Architecture

`apps/api/src/customers/`

```
domain/
  entities/customer.entity.ts             → invariants métier (prénom/nom non vides)
  entities/favorite.entity.ts             → invariants (entityType/entityId cohérents)
  repositories/customer.repository.ts     → interface ICustomerRepository (zéro import Prisma)
  repositories/favorite.repository.ts     → interface IFavoriteRepository
application/
  use-cases/
    create-customer-profile.use-case.ts   → appelé par `auth`.register-user, jamais exposé en écriture publique directe
    get-customer-profile.use-case.ts      → profil du client connecté
    update-customer-profile.use-case.ts   → prénom/nom/téléphone
    add-favorite.use-case.ts              → idempotent (unique customerId+entityType+entityId)
    remove-favorite.use-case.ts
    list-favorites.use-case.ts            → groupés par entityType, hydrate Creation/Product/Collection
  dtos/
    customer-response.dto.ts
    favorite-response.dto.ts
infrastructure/
  repositories/prisma-customer.repository.ts → implémente ICustomerRepository via PrismaService
  repositories/prisma-favorite.repository.ts → implémente IFavoriteRepository via PrismaService
  mappers/customer.mapper.ts
  mappers/favorite.mapper.ts
presentation/
  controllers/customers.controller.ts
  controllers/favorites.controller.ts
__tests__/
  unit/add-favorite.use-case.spec.ts
  unit/list-favorites.use-case.spec.ts
  integration/favorites.controller.spec.ts
```

## Modèles Prisma

`Customer` (`userId` unique, `firstName`, `lastName`, `phone?`), `Favorite` (`customerId`,
`entityType` — enum `FavoriteEntityType` (`CREATION`/`PRODUCT`/`COLLECTION`), `entityId`,
`@@unique([customerId, entityType, entityId])`).

## Cas d'usage clés

- Créer le profil `Customer` à l'inscription (`create-customer-profile`) — orchestré par
  `auth`.`register-user`, jamais appelé directement par un endpoint public d'écriture (pas
  de "créer un profil client sans compte")
- Consulter/mettre à jour le profil du client connecté (`firstName`, `lastName`, `phone`)
- Ajouter un favori (création, produit ou collection) : opération idempotente, ne doit
  jamais échouer si le favori existe déjà (contrainte unique gérée en `upsert`, pas en
  erreur 409 bloquante côté UI)
- Retirer un favori
- Lister les favoris du client, groupés par `entityType`, chaque entrée hydratée avec les
  champs d'affichage (nom/slug/image) de l'entité référencée

## Endpoints exposés

| Méthode | Route | Use-case | Auth |
| --- | --- | --- | --- |
| `GET` | `/api/customers/me` | `get-customer-profile` | `CLIENT` (propriétaire) |
| `PATCH` | `/api/customers/me` | `update-customer-profile` | `CLIENT` (propriétaire) |
| `GET` | `/api/favorites` | `list-favorites` | `CLIENT` (propriétaire) |
| `POST` | `/api/favorites` | `add-favorite` | `CLIENT` (propriétaire) |
| `DELETE` | `/api/favorites/:id` | `remove-favorite` | `CLIENT` (propriétaire) |

## Points d'intégration

- **`auth`** : `Customer` n'existe jamais sans `User` — `create-customer-profile` est
  appelé exclusivement depuis la transaction d'inscription de `auth`.`register-user` (voir
  `docs/features/auth.md`).
- **`creations`/`products`** : `list-favorites` lit directement `Creation`/`Product` (via
  `entityId`) pour hydrater chaque favori ; ce module ne duplique pas leurs DTO de
  liste/détail, il en réutilise un sous-ensemble minimal (nom, slug, image de couverture).
- **`appointments`** (Phase 2) : les favoris peuvent pré-remplir le formulaire de prise de
  rendez-vous (spec §47) — lecture seule côté `appointments`, ce module n'écrit jamais dans
  `Appointment`.
- **Pages consommatrices** : `pret-a-porter-catalogue`, `fiche-produit`, `creation-detail`
  (état favori une fois `customers` livré, voir la note dans `creations.md`),
  `mes-favoris`.

## Points d'attention

Le modèle Prisma `Favorite` déclare `entityType: COLLECTION` dans l'enum
`FavoriteEntityType`, mais **ne porte pas de relation Prisma typée vers `Collection`**
(seules `creation`/`product` ont une relation explicite via `map: "favorites_creation_fkey"`
/`"favorites_product_fkey"`) — contrairement à `Creation`/`Product`, un favori de type
`COLLECTION` doit être hydraté par une requête `findUnique` manuelle sur `entityId` dans
`list-favorites`, sans `include` Prisma direct, et sans contrainte de clé étrangère
appliquée par la base pour ce cas précis (à garder à l'esprit pour la validation applicative
— vérifier que la `Collection` référencée existe encore avant de l'afficher).

## Vérification

- [ ] `add-favorite`/`remove-favorite` testés (idempotence, contrainte unique)
- [ ] `list-favorites` testé pour les trois `entityType`, y compris le cas `COLLECTION` sans
      relation Prisma typée
- [ ] `favorites.controller.spec.ts` couvre les codes 200/401/404
- [ ] `docs/checklist-implementation.md` : `customers` passé à ✅
