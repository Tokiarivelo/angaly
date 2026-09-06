# Feature — `media`

**Statut : ⬜ À faire.** Phase 1 — Présence digitale.

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
  entities/media.entity.ts              → invariants métier (bucket/objectKey non vides, altText obligatoire)
  repositories/media.repository.ts      → interface IMediaRepository (zéro import Prisma, zéro import minio)
  value-objects/media-entity-ref.vo.ts  → couple (entityType, entityId) validé contre MediaEntityType
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
infrastructure/
  repositories/prisma-media.repository.ts   → implémente IMediaRepository via PrismaService
  services/storage.service.ts               → seul point d'appel à @angaly/storage (StorageClient)
  mappers/media.mapper.ts                   → Prisma model → domain entity → DTO
presentation/
  controllers/media.controller.ts
__tests__/
  unit/create-presigned-upload.use-case.spec.ts
  unit/delete-media.use-case.spec.ts
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
- Lister les médias filtrés par `bucket`/`entityType`/`entityId` (médiathèque admin)
- Supprimer un média : vérifier qu'aucune relation polymorphique ne le référence encore
  avant `deleteObject()` — ne jamais laisser un lien cassé sur le site public

## Endpoints exposés

| Méthode | Route | Use-case | Auth |
| --- | --- | --- | --- |
| `POST` | `/api/media/presigned-upload` | `create-presigned-upload` | Public (formulaires sur-mesure) / `MANAGER`,`ADMIN` (médiathèque) selon `entityType` |
| `POST` | `/api/media/:id/confirm` | `confirm-upload` | Idem, cohérent avec la demande présignée d'origine |
| `POST` | `/api/media/upload` | `upload-media-buffer` | `MANAGER`,`ADMIN` |
| `GET` | `/api/media` | `list-media` | `MANAGER`,`ADMIN` |
| `DELETE` | `/api/media/:id` | `delete-media` | `MANAGER`,`ADMIN` |

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

## Vérification

- [ ] `create-presigned-upload` testé (bucket valide selon `entityType`, URL générée)
- [ ] `delete-media` testé (refus si média encore référencé, suppression sinon)
- [ ] `media.controller.spec.ts` couvre les codes 200/403/404
- [ ] `docs/checklist-implementation.md` : `media` passé à ✅
