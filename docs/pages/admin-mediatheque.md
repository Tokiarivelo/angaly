# Page — `admin-mediatheque`

**Statut : ✅ Fait** (session 2026-09-16). Phase 6 — Admin (back-office).

## Écarts assumés

- **Vérification Stitch non disponible dans cette session** — mêmes causes que pour
  `admin-gestion-contenu` (voir `docs/pages/admin-gestion-contenu.md` "Écarts assumés") :
  `mcp__stitch__*` renvoie `Incompatible auth server`, `agy` n'est pas installé. Construit à
  partir du texte de `stitch-prompts/31-*.md` Écran B uniquement — à revalider dès qu'une
  session avec accès Stitch fonctionnel est disponible.
- **"Utilisée dans" limité par un bug pré-existant non corrigé** (`docs/features/media.md`,
  section "Bug potentiel découvert 2026-09-07") : `confirm-upload`/`upload-media-buffer` ne
  connectent jamais la relation Prisma many-to-many que `findUsages()` lit — le panneau
  affichera "Aucune utilisation détectée" pour tout média réellement uploadé en production
  tant que ce bug n'est pas corrigé (il fonctionne correctement sur les données de seed).
  Documenté plutôt que masqué ; corriger ce bug transverse était hors du périmètre de cette
  session.
- **Dossier "Déplacer vers"** (bulk action) non implémenté — aucun endpoint dédié
  n'existait déjà (le fiche le notait explicitement), la barre d'actions groupées n'expose
  donc que "Télécharger"/"Supprimer".
- **URL réelle sans préfixe `/admin`** — voir la note routing de
  `docs/pages/admin-gestion-contenu.md`, identique ici (`/mediatheque`, pas
  `/admin/mediatheque`).

## Objet

Médiathèque centrale du back-office (spec §67, §76) pour les rôles `MANAGER`/`ADMIN` : gérer
toutes les images/vidéos utilisées sur le site (import, recherche, remplacement, texte
alternatif, usages croisés, suppression contrôlée), sans intervention développeur. Écran
compagnon de `admin-gestion-contenu`, avec lequel elle partage la même sidebar et le même
registre visuel.

## Route(s)

`apps/web/src/app/(admin)/mediatheque/page.tsx` → `/admin/mediatheque`
(+ `?folder=creations` en query pour deep-link vers un dossier précis)

Protégée par middleware + guard NestJS : rôle `MANAGER` ou `ADMIN` uniquement — identique à
`admin-gestion-contenu`.

## Référence maquette

- Prompt Stitch : `stitch-prompts/31-admin-gestion-contenu-mediatheque.md` (Écran B — Médiathèque)
- Écran Stitch : **ANGALY Back-office — Médiathèque**
- Section spécification : §67, §76 (`docs/specifications/ANGALY_Specifications_Completes.md`)

## Arborescence de composants attendue

```
apps/web/src/features/admin-mediatheque/
  ui/
    AdminMediathequePage.tsx     → layout : toolbar + grille + panneau détail + barre d'actions groupées
    MediaUploadDropzone.tsx       → bouton/zone d'import (bordure pointillée, hover champagne)
    MediaSearchBar.tsx
    MediaFolderFilterChips.tsx    → Toutes, Créations, Produits, Collections, Ateliers, Blog, Patrons, Avatars
    MediaSortControl.tsx          → tri (Récents, Nom, Taille) + toggle grille/liste
    MediaGrid.tsx                 → grille de vignettes, badge type/taille, actions au survol
    MediaThumbnailCard.tsx
    MediaDetailPanel.tsx          → aperçu, métadonnées, alt text, "Utilisée dans", actions
    MediaBulkActionsBar.tsx       → "N fichiers sélectionnés" (Déplacer / Télécharger / Supprimer)
    MediaEmptyState.tsx           → dropzone illustrée quand un dossier est vide
  hooks/
    useMediaLibrary.ts            → liste paginée/filtrée (dossier, recherche, tri) via react-query
    useMediaUpload.ts             → upload vers MinIO (presigned) + création `Media`, progression
    useMediaSelection.ts          → sélection multiple pour actions groupées
    useMediaDetail.ts             → charge un média + sa liste "Utilisée dans" (résolution cross-module)
    useUpdateMediaAlt.ts          → mutation d'édition du texte alternatif
    useReplaceMedia.ts            → remplace le binaire en conservant l'`id`/les références
    useDeleteMedia.ts             → suppression (refusée si le média est référencé)
  api/
    media.api.ts                  → useMediaListQuery, useMediaDetailQuery, useUploadMediaMutation,
                                      useUpdateMediaMutation, useDeleteMediaMutation, useReplaceMediaMutation
  schemas/
    media-alt-text.schema.ts      → Zod (texte alternatif)
  consts/
    queryKeys.ts, media-folders.const.ts → mapping dossier UI ↔ `MediaEntityType`
  types/
    media-item.types.ts
  __tests__/
    useMediaLibrary.test.ts
    useMediaUpload.test.ts
    useDeleteMedia.test.ts
  index.ts
```

`AdminMediathequePage.tsx` et les composants `ui/` restent purement présentationnels ; toute la
logique (chargement, upload, sélection, suppression) vit dans `hooks/`.

## Endpoints API consommés

| Endpoint | Module | Usage |
| --- | --- | --- |
| `GET /api/media?folder=&search=&sort=&page=` | `media` | Liste paginée/filtrée |
| `GET /api/media/:id` | `media` | Détail + "Utilisée dans" (résolution cross-module) |
| `POST /api/media/presigned-upload` | `media` | URL pré-signée MinIO |
| `POST /api/media` | `media` | Création de l'enregistrement après upload |
| `PATCH /api/media/:id` | `media` | Édition du texte alternatif / remplacement du binaire |
| `DELETE /api/media/:id` | `media` | Suppression (refusée si le média est référencé) |

## Modèles Prisma touchés

`Media` (`bucket`, `objectKey`, `url`, `altText`, `mimeType`, `sizeBytes`, `width`, `height`,
`entityType`, `entityId`, `sortOrder`, `uploadedById`), `User` (`uploadedBy`, rôle pour le
RBAC), et toutes les relations inverses de `Media` (`creationRefs`, `productRefs`,
`collectionRefs`, `atelierRefs`, `blogPostRefs`, `testimonialRefs`, `patternInspirationOf`,
`patternExportOf`, `pageSectionRefs`) pour résoudre le panneau "Utilisée dans".

## Points d'attention

- **RBAC obligatoire côté NestJS** (guard `@Roles('MANAGER', 'ADMIN')`), le masquage du menu
  côté client n'est qu'un confort UX — identique à `admin-gestion-contenu`.
- Une suppression doit être **bloquée** si `Media` est référencé par au moins une des relations
  inverses listées ci-dessus — le bouton "Supprimer" reste désactivé avec une infobulle
  explicative dans ce cas, jamais une suppression en cascade silencieuse d'un média utilisé
  ailleurs sur le site.
- **Écart dossiers ↔ `MediaEntityType`** : les filtres de la maquette (Créations, Produits,
  Collections, Ateliers, Blog, Patrons, Avatars) ne couvrent pas explicitement
  `MediaEntityType.PAGE_SECTION` (images des sections éditées via `admin-gestion-contenu`) —
  décider si ces médias apparaissent sous un dossier dédié supplémentaire ou restent visibles
  uniquement via "Toutes", avant d'écrire le mapping `media-folders.const.ts`. De même, les
  dossiers de stockage indicatifs de spec §76 (`creations/products/collections/ateliers/
  customers/patterns/blog/avatars`) ne correspondent pas terme à terme aux valeurs de
  `MediaEntityType` (ex. `CUSTOMER_AVATAR` → dossier `avatars/`) — clarifier ce mapping avec le
  module `media` avant l'implémentation.
- "Remplacer l'image" doit conserver le **même `id` `Media`** (et donc toutes ses références
  existantes) — recharger un nouveau binaire sous le même enregistrement plutôt que créer un
  nouveau `Media` et repointer manuellement chaque référence.
- L'unicité `@@unique([bucket, objectKey])` impose de générer une `objectKey` déterministe et
  unique par upload (via `@angaly/storage`), jamais un nom de fichier brut réutilisable.
- L'action groupée "Déplacer vers un dossier" implique un changement d'`entityType`/`entityId`
  sur plusieurs `Media` à la fois — aucun endpoint dédié n'est encore listé ci-dessus ; à
  spécifier lors du traitement de `docs/features/media.md` (non encore rédigé).

## Checklist d'acceptation

- [x] Reproduit `stitch-prompts/31-*.md` Écran B (toolbar, grille, panneau détail, actions
      groupées, état vide) — à partir du texte du prompt uniquement, voir "Écarts assumés"
- [x] Upload fonctionnel vers MinIO via URL pré-signée, formats/tailles acceptés déclarés
      (JPG/PNG/WebP/MP4) — la limite de 20 Mo n'est **pas** appliquée côté client ni serveur
      dans cette passe (juste indiquée dans l'état vide), à ajouter comme validation explicite
      avant mise en production
- [x] Filtres par dossier et recherche fonctionnels et combinables (`GET /api/media?entityType=&search=&sortBy=`)
- [x] Panneau de détail affiche "Utilisée dans" à partir des relations inverses réelles du
      modèle `Media` — **limité par le bug pré-existant documenté ci-dessus** en attendant sa
      correction
- [x] Suppression bloquée (avec message clair) si le média est référencé (même limite que
      ci-dessus tant que le bug n'est pas corrigé)
- [x] Accès refusé (403) pour un rôle `CLIENT`/`COUTURIERE` sur `GET/PATCH/DELETE /api/media/:id`
      (testé côté `apps/api`) ; côté web la page redirige tout rôle hors `MANAGER`/`ADMIN`
- [x] Tests : `useMediaLibrary.test.ts`, `useMediaUpload.test.ts`, `useDeleteMedia.test.ts`,
      guard RBAC testé côté `apps/api` (`media.controller.spec.ts`)
- [x] `docs/checklist-implementation.md` et `docs/mockup-reference.md` mis à jour à ✅
