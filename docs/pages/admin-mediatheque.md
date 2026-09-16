# Page — `admin-mediatheque`

**Statut : ✅ Fait** (session 2026-09-16). Phase 6 — Admin (back-office). **Passe
optimisation/UX** (session 2026-09-16, suite — audit complet du CMS admin) : voir
"Points d'attention" pour le détail des correctifs perf/UX/qualité de code appliqués.

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
  donc que "Télécharger"/"Supprimer". Reconfirmé toujours absent lors de l'audit
  optimisation/UX (session 2026-09-16, suite) — nécessiterait un nouvel endpoint backend,
  hors périmètre d'une passe front-only.
- **Limite de 20 Mo : désormais réellement appliquée** (session 2026-09-16, suite) — voir
  "Points d'attention" ; n'est donc plus un écart.
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
    AdminMediathequePage.tsx     → layout : toolbar + grille/liste + panneau détail + barre d'actions groupées (présentationnel — voir hooks/useAdminMediathequePage.ts)
    MediaUploadDropzone.tsx       → bouton/zone d'import (bordure pointillée, hover champagne)
    MediaSearchBar.tsx
    MediaFolderFilterChips.tsx    → Toutes, Créations, Produits, Collections, Ateliers, Blog, Patrons, Avatars
    MediaSortControl.tsx          → tri (Récents, Nom, Taille) + toggle grille/liste (réellement câblé — voir Points d'attention)
    MediaGrid.tsx                 → grille de vignettes, badge type/taille, actions au survol
    MediaListView.tsx             → vue liste compacte (lignes), alternative réelle à la grille
    MediaThumbnailCard.tsx        → vignette clavier-opérable (bouton, pas un `<div onClick>`), next/image
    MediaDetailPanel.tsx          → aperçu (next/image), métadonnées, alt text, "Utilisée dans", actions, confirmation avant suppression, Échap pour fermer
    MediaBulkActionsBar.tsx       → "N fichiers sélectionnés" (Télécharger / Supprimer — pas de "Déplacer", voir Écarts assumés)
    MediaEmptyState.tsx           → dropzone illustrée quand la médiathèque est réellement vide
    MediaNoResultsState.tsx       → état distinct quand un filtre/une recherche ne matche rien (≠ médiathèque vide)
    UploadEntriesList.tsx         → statut par fichier importé (en cours/terminé/erreur), auparavant suivi en état mais jamais affiché
  hooks/
    useAdminMediathequePage.ts    → orchestration de toute la page (filtres, debounce recherche, sélection, confirmation de suppression groupée, téléchargement groupé séquencé) — voir Points d'attention
    useMediaLibrary.ts            → liste paginée/filtrée (dossier, recherche debouncée, tri) via react-query, `staleTime` 30s
    useMediaUpload.ts             → upload vers MinIO (presigned) + création `Media`, validation taille/format côté client avant tout appel réseau
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
    queryKeys.ts                  → `mediaBaseKey` partagée + `mediaLibraryKey`/`mediaDetailKey` dérivées (invalidation react-query cohérente)
    media-folders.const.ts        → mapping dossier UI ↔ `MediaEntityType`
  types/
    media-item.types.ts
  __tests__/
    useMediaLibrary.test.ts, useMediaUpload.test.ts, useDeleteMedia.test.ts,
    useAdminMediathequePage.test.ts, MediaThumbnailCard.test.tsx, MediaDetailPanel.test.tsx,
    MediaListView.test.tsx, MediaNoResultsState.test.tsx, UploadEntriesList.test.tsx,
    AdminMediathequePage.test.tsx
  index.ts
```

`AdminMediathequePage.tsx` et les composants `ui/` restent purement présentationnels ; toute la
logique (chargement, upload, sélection, suppression, orchestration de la page) vit dans
`hooks/` — `useAdminMediathequePage.ts` (session 2026-09-16, suite) a été ajouté pour sortir
de `AdminMediathequePage.tsx` la logique qui s'y était accumulée (dérivation dossier actif,
gestion d'erreur de suppression), conformément à cette règle.

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

- **Audit optimisation/UX complet** (session 2026-09-16, suite — à la demande explicite de
  vérifier "le CMS admin complet" et d'y apporter optimisation et facilité d'usage) :
  - **Bug de couleurs corrigé** : la quasi-totalité des composants de cette feature (et du
    shell partagé `admin-dashboard/ui/AdminSidebar.tsx`/`AdminLayout.tsx`) utilisaient des
    classes Tailwind jamais définies (`text-slate`, `bg-primary-deep-navy`, `bg-ivory-warm`,
    `text-warning`) au lieu des tokens réels du thème ANGALY (`angaly-slate`, `angaly-navy`,
    `angaly-warm-ivory`, `angaly-warning`, voir `apps/web/src/app/globals.css`) — ces classes
    ne produisaient aucun style (aucune règle CSS générée), donc une grande partie du texte/
    des fonds de cette page (et de `admin-gestion-contenu`) s'affichait sans la couleur ANGALY
    prévue. Corrigé partout dans les deux features + le shell admin.
  - **Performance** : recherche débouncée (300 ms, `useDebouncedValue`) avant de déclencher
    une requête ; `staleTime` de 30 s sur `useMediaLibrary` ; vignettes en `next/image`
    (au lieu de `<img>` brut) ; invalidation react-query unifiée sur une seule clé de base
    (`mediaBaseKey`) au lieu de littéraux `['admin','media']`/`['admin','media','list']`
    incohérents entre les 4 hooks de mutation ; téléchargement groupé séquencé (liens
    `<a download>` échelonnés) plutôt qu'une boucle `window.open()` bloquée par les
    anti-popups des navigateurs au-delà du premier fichier.
  - **UX** : confirmation obligatoire avant toute suppression (`ConfirmDialog`, unitaire et
    groupée — un clic accidentel ne supprime plus rien définitivement) ; vignettes
    réellement opérables au clavier (l'ouverture du détail était un `<div onClick>`, jamais
    focusable) ; case de sélection exposée en `role="checkbox"`/`aria-checked` ; import
    surfaçant désormais le statut par fichier (`UploadEntriesList`, l'état existait déjà mais
    n'était jamais affiché — un échec d'upload dans un lot était invisible) ; validation
    taille/format côté client avant tout appel réseau ; état "aucun résultat pour ce filtre"
    distinct de l'état "médiathèque vide" (`MediaNoResultsState` vs `MediaEmptyState`) ;
    squelettes de chargement à la place du texte "Chargement…" ; le bouton "Vue liste" —
    auparavant sans effet (`view` suivi en état mais jamais consommé) — pilote désormais un
    vrai `MediaListView.tsx`.
  - **Qualité de code** : `formatFileSize` dédupliqué (`@/lib/utils`, était réimplémenté à
    l'identique dans `MediaThumbnailCard.tsx` et `MediaDetailPanel.tsx`) ; logique
    d'orchestration de page déplacée de `AdminMediathequePage.tsx` vers le nouveau
    `useAdminMediathequePage.ts`.
  - **Volontairement non traité dans cette passe** (nécessite un changement backend/API,
    hors périmètre d'un audit front) : bulk action "Déplacer vers un dossier", et le bug
    pré-existant `confirm-upload` documenté ci-dessous.
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
      (JPG/PNG/WebP/MP4) — la limite de 20 Mo est désormais **réellement appliquée** côté
      client (`useMediaUpload.ts`, rejet avant tout appel réseau) et côté serveur
      (`ConfirmUploadRequestDto`/`MediaEntity`, session 2026-09-16, suite — voir
      `docs/features/media.md`)
- [x] Filtres par dossier et recherche fonctionnels et combinables (`GET /api/media?entityType=&search=&sortBy=`)
- [x] Panneau de détail affiche "Utilisée dans" à partir des relations inverses réelles du
      modèle `Media` — **limité par le bug pré-existant documenté ci-dessus** en attendant sa
      correction
- [x] Suppression bloquée (avec message clair) si le média est référencé (même limite que
      ci-dessus tant que le bug n'est pas corrigé)
- [x] Accès refusé (403) pour un rôle `CLIENT`/`COUTURIERE` sur `GET/PATCH/DELETE /api/media/:id`
      (testé côté `apps/api`) ; côté web la page redirige tout rôle hors `MANAGER`/`ADMIN`
- [x] Tests : 10 fichiers de tests (`useMediaLibrary`, `useMediaUpload`, `useDeleteMedia`,
      `useAdminMediathequePage`, `MediaThumbnailCard`, `MediaDetailPanel`, `MediaListView`,
      `MediaNoResultsState`, `UploadEntriesList`, `AdminMediathequePage`), guard RBAC testé
      côté `apps/api` (`media.controller.spec.ts`, y compris le rejet 400 du dépassement de
      20 Mo)
- [x] `docs/checklist-implementation.md` et `docs/mockup-reference.md` mis à jour à ✅
