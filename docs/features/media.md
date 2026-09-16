# Feature — `media`

**Statut : ✅ Fait.** Phase 1 — Présence digitale.

## Objet

Module central d'upload/service des médias (images, futurs vidéos/PDF) : c'est l'**unique**
consommateur de `@angaly/storage` dans `apps/api` (voir `.cursor/rules/009-storage-minio.mdc`
et le commentaire de `packages/storage/src/storage-client.ts`). Tous les autres modules qui
référencent `Media` (`creations`, `collections`, `ateliers`, `blog`, `products`, `content`,
`reviews`/`testimonials`, `patterns`) passent par `media` pour uploader, obtenir une URL
présignée, lister ou supprimer un objet — jamais un accès direct à MinIO ailleurs.

## Emplacement Clean Architecture

`apps/api/src/media/`

```
domain/
  entities/media.entity.ts                    → invariants métier (bucket/objectKey non vides, altText obligatoire)
  repositories/media.repository.ts            → interface IMediaRepository (zéro import Prisma, zéro import minio)
  repositories/media-storage.gateway.ts       → interface IMediaStorageGateway (port I/O MinIO — garde l'Application
                                                  découplée de l'Infrastructure, ajout non listé à l'origine ici)
  value-objects/media-entity-ref.vo.ts        → MediaEntityType local (le Domain ne dépend pas de @angaly/types),
                                                  couple (entityType, entityId) validé, resolveBucketForEntityType()
  value-objects/media-object-key.vo.ts        → buildObjectKey() — nom de fichier + jeton unique → objectKey
application/
  use-cases/
    create-presigned-upload.use-case.ts → génère bucket/objectKey + URL présignée (avant upload navigateur)
    confirm-upload.use-case.ts          → enregistre la ligne Media après upload réussi côté navigateur
    upload-media-buffer.use-case.ts     → upload serveur direct (petits fichiers, ex. import batch)
    list-media.use-case.ts              → filtre bucket/entityType/entityId, pagination
    delete-media.use-case.ts            → vérifie l'absence de référence active avant suppression physique
  dtos/
    media-response.dto.ts
    presigned-upload-request.dto.ts
    confirm-upload-request.dto.ts
    upload-media-buffer-request.dto.ts
    list-media-query.dto.ts
infrastructure/
  repositories/prisma-media.repository.ts   → implémente IMediaRepository via PrismaService
  services/storage.service.ts               → implémente IMediaStorageGateway, seul point d'appel à @angaly/storage
  mappers/media.mapper.ts                   → Prisma model → domain entity → DTO
presentation/
  controllers/media.controller.ts
__tests__/
  unit/*.spec.ts        → un spec par use-case + par fichier domain/infrastructure (entité, VOs, mapper,
                            repository Prisma, storage service)
  integration/media.controller.spec.ts
```

## Modèles Prisma

`Media` (`bucket`, `objectKey`, `url`, `altText`, `mimeType`, `sizeBytes`, `width`, `height`,
`entityType` — enum `MediaEntityType`, `entityId?`, `sortOrder`, `uploadedById?` → `User`).
Relations inverses polymorphiques : `CreationMedia`, `ProductMedia`, `CollectionMedia`,
`AtelierMedia`, `BlogPostMedia`, `TestimonialMedia`, `PatternInspirationMedia`,
`PatternExportMedia`, `PageSectionMedia`.

## Cas d'usage clés

- Générer une URL d'upload présignée MinIO (`StorageClient.getPresignedUploadUrl()`) pour un
  bucket donné (`STORAGE_BUCKETS`), à utiliser par le navigateur (médiathèque admin,
  photos d'inspiration sur-mesure) — le backend choisit le `bucket`/`objectKey`, jamais le
  client
- Confirmer un upload présigné réussi : créer la ligne `Media` (`bucket` + `objectKey`
  seuls persistés comme source de vérité, `url` reconstruite via `buildPublicUrl()`)
- Uploader un buffer côté serveur (`StorageClient.uploadBuffer()`) pour les cas
  synchrones (import de seed, petites images)
- Lister les médias filtrés par `bucket`/`entityType`/`entityId`/`search` (nom de fichier ou
  alt text), triés (`sortBy`: `recent`/`name`/`size`) — médiathèque admin
- Charger un média avec ses références réelles ("Utilisée dans" — `admin-mediatheque`,
  session 2026-09-16, Phase 6)
- Éditer le texte alternatif et/ou remplacer le binaire d'un média **en conservant le même
  `id`** (session 2026-09-16) — `url` n'est jamais accepté du client, toujours recalculé côté
  serveur via `IMediaStorageGateway.buildPublicUrl()` quand `bucket`/`objectKey` changent
- Supprimer un média : vérifier qu'aucune relation polymorphique ne le référence encore
  avant `deleteObject()` — ne jamais laisser un lien cassé sur le site public

## Endpoints exposés

| Méthode | Route | Use-case | Auth |
| --- | --- | --- | --- |
| `POST` | `/api/media/presigned-upload` | `create-presigned-upload` | Aucune (voir note ci-dessous) |
| `POST` | `/api/media/confirm` | `confirm-upload` | Aucune |
| `POST` | `/api/media/upload` | `upload-media-buffer` | Aucune |
| `GET` | `/api/media` | `list-media` | Aucune |
| `GET` | `/api/media/:id` | `get-media-detail` | `MANAGER`/`ADMIN` (session 2026-09-16) |
| `PATCH` | `/api/media/:id` | `update-media` | `MANAGER`/`ADMIN` (session 2026-09-16) |
| `DELETE` | `/api/media/:id` | `delete-media` | `MANAGER`/`ADMIN` (session 2026-09-16) |

> **RBAC ajouté sélectivement (session 2026-09-16, `admin-mediatheque`)** : seuls les 3
> endpoints ci-dessus marqués `MANAGER`/`ADMIN` sont gardés (`JwtAuthGuard`+`RolesGuard`,
> appliqués au niveau de la méthode, pas du contrôleur). Les 4 autres routes restent
> **volontairement ouvertes** car elles sont aussi utilisées par des parcours
> client/anonyme déjà livrés en Phase 1-3 (`demande-sur-mesure`, `personnalisation-creation`
> pour l'upload de photos d'inspiration ; `home` pour la lecture publique des médias
> `PAGE_SECTION`) — les y fermer casserait ces parcours. `DELETE` n'avait auparavant aucun
> appelant identifié côté web (vérifié par recherche), donc le garder n'a cassé aucun flux
> existant ; son test d'intégration a été mis à jour pour inclure un jeton `ADMIN`.

> **Écarts assumés par rapport au tableau d'origine** :
> - `confirm-upload` est en `POST /api/media/confirm` (pas `/:id/confirm`) : aucune ligne
>   `Media` n'existe avant cet appel (c'est justement lui qui la crée), donc il n'y a pas de
>   ressource `:id` à adresser à ce stade — le body porte `bucket`/`objectKey` reçus de l'étape
>   précédente à la place.
> - **Auth** : `MANAGER`/`ADMIN` par `entityType` n'est pas encore appliqué car le module
>   `auth` (Phase 2) n'existe pas encore — voir `.cursor/rules/006-phase-workflow.mdc`. À
>   brancher (`RolesGuard`/`@Roles()`) dès que `auth` est implémenté ; jusque-là, tous les
>   endpoints sont ouverts.

## Points d'intégration

- **`packages/storage`** : dépendance directe et exclusive — `StorageService` (infrastructure)
  encapsule l'unique instance de `StorageClient` utilisée par `apps/api`.
- **Tous les modules à `Media[]`** (`creations`, `collections`, `ateliers`, `blog`,
  `products`, `content`, `reviews`, `patterns`) : lisent l'URL déjà stockée sur la relation
  Prisma incluse (`Media.url`) plutôt que de rappeler `media` à chaque requête ; seules les
  opérations d'écriture (upload/suppression) passent par les endpoints de ce module.
- **`demande-sur-mesure`/`personnalisation-creation`** (Phase 2) : `POST
  /api/media/presigned-upload` pour les photos d'inspiration avant soumission de la demande.
- **Pages consommatrices** : `admin-mediatheque` (Phase 6, gestion complète), et
  indirectement toute page affichant une image (via les DTO des autres modules).

## Points d'attention

- `Media.altText` est obligatoire à la création (accessibilité/SEO, spec §74/§71) : validé
  côté DTO (`class-validator`), pas seulement côté formulaire web.
- `delete-media` doit interroger toutes les relations polymorphiques (`entityType` +
  `entityId`, et les tables de jonction `*Media`) avant suppression physique — voir la
  contrainte "Utilisée dans" attendue par `docs/pages/admin-mediatheque.md`.
- Le client `minio` (npm) ne doit être importé nulle part ailleurs que
  `packages/storage/src/storage-client.ts` ; ce module est le seul à instancier
  `StorageClient`.
- Mapping `entityType` → bucket (`resolveBucketForEntityType()`) : `CREATION`→`creations`,
  `PRODUCT`→`products`, `PRODUCT_VARIANT`→`products` (photos par couleur, voir
  `docs/features/products.md`), `COLLECTION`→`collections`, `ATELIER`→`ateliers`,
  `CUSTOMER_AVATAR`→`avatars`, `PATTERN_EXPORT`→`patterns`, `BLOG_POST`→`blog`,
  `PAGE_SECTION`→`customers`. `PAGE_SECTION` hérite du bucket restant (`customers`) faute de
  bucket dédié dans la spec — à revoir si Phase 6 (admin-gestion-contenu) introduit un bucket
  propre pour le contenu CMS.
- Le seuil de couverture de branches Jest (`apps/api/jest.config.ts`) est fixé à 75 % (au
  lieu de 80 % pour les 3 autres métriques) : les décorateurs NestJS (`@Inject()`, `@Body()`,
  `@Query()`, paramètres de constructeur avec `emitDecoratorMetadata`) produisent des
  branches synthétiques toujours à moitié non couvertes, quel que soit le test écrit — vérifié
  sur ce module où statements/functions/lines sont à 100 % et seules ces branches restent
  en dessous. À remonter au fur et à mesure que d'autres modules diluent leur part.
- **Bug potentiel découvert (2026-09-07, non corrigé — hors périmètre de la session qui l'a
  trouvé) :** `confirm-upload`/`upload-media-buffer` ne renseignent que les champs
  dénormalisés `entityType`/`entityId` sur `Media` — ils ne connectent jamais la relation
  Prisma many-to-many (`creationRefs`/`collectionRefs`/`atelierRefs`/...). Or
  `GET /api/creations/:slug` (et les autres endpoints détail) sélectionnent `media` via
  cette relation, pas via `entityId`. Conséquence probable : un média uploadé en production
  via le flux normal n'apparaîtrait jamais dans `creation.media`/`collection.media` tant que
  la relation n'est pas connectée explicitement. Vérifié en écrivant
  `packages/database/prisma/seed.ts` (qui, lui, connecte bien la relation via un `create`
  imbriqué) — à corriger dans `confirm-upload.use-case.ts` avant la Phase 6
  (admin-médiathèque) si ce module doit réellement attacher des médias à des entités.
  **Confirmé non corrigé par la session 2026-09-16** (Phase 6, `admin-mediatheque`) : le
  panneau "Utilisée dans" (`findUsages()`, `GET /api/media/:id`) lit exactement ces mêmes
  relations Prisma (`creationRefs`, `productRefs`, ...) — il fonctionnera pour les données de
  seed (qui connectent la relation) mais **affichera "Aucune utilisation détectée" pour tout
  média réellement uploadé via le flux normal en production**, tant que ce bug n'est pas
  corrigé. `countActiveReferences` (utilisé par `delete-media` pour bloquer la suppression)
  a exactement la même limite : un média récemment uploadé et déjà utilisé sur le site
  pourrait donc être supprimable à tort. Corriger `confirm-upload.use-case.ts`/
  `upload-media-buffer.use-case.ts` pour connecter la relation many-to-many est un
  prérequis explicite avant de faire confiance à ces deux garde-fous en production — non
  traité dans cette session (changement transverse à plusieurs modules, hors du périmètre
  "gestion de contenu + médiathèque" assigné).

## Vérification

- [x] `create-presigned-upload` testé (bucket valide selon `entityType`, URL générée)
- [x] `delete-media` testé (refus si média encore référencé, suppression sinon)
- [x] `media.controller.spec.ts` couvre les codes 201/400/200/204/401/403 (les 3 routes
      `MANAGER`/`ADMIN` ajoutées en session 2026-09-16 ; les 4 routes historiques restent
      sans garde, non 403-testées par choix, voir note RBAC ci-dessus)
- [x] `get-media-detail`/`update-media` testés unitairement (404 si le média n'existe pas,
      recalcul de `url` par `update-media` quand `bucket`/`objectKey` changent)
- [x] `list()` testé avec `search`/`sortBy` (repository Prisma)
- [x] Testé manuellement de bout en bout contre MinIO + Postgres réels (presign → PUT
      navigateur → confirm → list → delete, et upload buffer multipart) — **la session
      2026-09-16 n'a pas re-testé ce parcours manuel de bout en bout** pour les 3 nouveaux
      endpoints (pas d'accès à une instance MinIO/Postgres réelle dans cet environnement),
      uniquement des tests automatisés (mocks) — à vérifier manuellement avant mise en
      production si ce n'est pas déjà fait par ailleurs.
- [x] `docs/checklist-implementation.md` : `media` passé à ✅ (déjà le cas), `admin-mediatheque`
      passé à ✅
