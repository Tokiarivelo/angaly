# Feature — `customers`

**Statut : ✅ Fait.** Phase 2 — Conversion.

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
  de "créer un profil client sans compte") — **`create-customer-profile.use-case.ts` n'a
  finalement pas été implémenté dans ce module** : `auth`.`register-user` continue de créer
  la ligne `Customer` directement via `IUserRepository.createWithCustomer()` (option
  explicitement laissée ouverte par `docs/features/auth.md` "Points d'attention" — la vraie
  atomicité User+Customer exigerait de faire circuler un client de transaction Prisma à
  travers une frontière de module, infrastructure que ce projet n'a pas). Un use-case ici
  n'aurait aucun appelant : `ICustomerRepository` n'expose donc pas de méthode `create`.
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
- **`creations`/`collections`/`products`** : `list-favorites` lit directement `Creation`/
  `Collection`/`Product` (via `entityId`) pour hydrater chaque favori ; ce module ne duplique
  pas leurs DTO de liste/détail, il en réutilise un sous-ensemble minimal (nom, slug, image
  de couverture). Ni `ICreationRepository`, `ICollectionRepository`, ni `IProductRepository`
  n'exposaient de `findById` (seulement `findBySlug`/`findPublishedBySlug`, car
  `Favorite.entityId` est toujours l'id réel, jamais le slug) — méthode ajoutée à chacun
  spécifiquement pour ce besoin (`CreationsModule`/`CollectionsModule`/`ProductsModule`
  exportent tous leur token de repository). `products` a depuis été livré (✅,
  `docs/features/products.md`) : un favori `PRODUCT` est maintenant hydraté comme les deux
  autres types — plus de `display: null` systématique pour ce type.
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
— vérifier que la `Collection` référencée existe encore avant de l'afficher). Implémenté tel
quel : `ICollectionRepository.findById()` (comme `ICreationRepository.findById()`) retourne
`null` si la ligne a disparu, et `list-favorites.use-case.ts` traduit ce `null` en
`display: null` plutôt que de faire échouer tout l'appel — un favori dont l'entité a été
supprimée reste donc listé (avec `display: null`), jamais masqué silencieusement ni en erreur.
- **`remove-favorite`** vérifie que le favori appartient bien au client courant
  (`favorite.customerId === customer.id`) avant suppression — sans ce contrôle, un client
  pourrait supprimer le favori d'un autre en devinant un id (`ForbiddenException`, 403).
- **`ICustomerRepository` n'a pas de méthode `create`** — voir "Cas d'usage clés" pour le
  raisonnement complet (auth continue de créer la ligne `Customer`).
- **`list-favorites` "groupé par `entityType`"** est implémenté comme un tri stable
  (`CREATION` → `PRODUCT` → `COLLECTION`, puis `createdAt` décroissant au sein d'un même
  type) sur une liste plate (`FavoriteDto[]`), pas comme une réponse imbriquée par type — le
  frontend peut regrouper côté client si l'affichage l'exige (pages `mes-favoris`, encore ⬜).

## Vérification

- [x] `add-favorite`/`remove-favorite` testés (idempotence, contrainte unique, propriété du
      favori) — `add-favorite.use-case.spec.ts`, `remove-favorite.use-case.spec.ts`
- [x] `list-favorites` testé pour les trois `entityType` (tous hydratés, `products` livré),
      y compris le cas `COLLECTION` sans relation Prisma typée et le cas d'une entité
      supprimée — `list-favorites.use-case.spec.ts`
- [x] `favorites.controller.spec.ts` couvre 200/201/204/400/401/403/404 ;
      `customers.controller.spec.ts` couvre 200/400/401/404
- [x] `docs/checklist-implementation.md` : `customers` passé à ✅
- [x] `pnpm --filter @angaly/api typecheck`, `lint`, `test` (366 tests) tous verts, y compris
      les 4 fichiers de tests `creations`/`collections` mis à jour pour le nouveau
      `findById()` ajouté à leurs interfaces de repository
