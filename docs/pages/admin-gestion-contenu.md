# Page — `admin-gestion-contenu`

**Statut : ✅ Fait** (session 2026-09-16). Phase 6 — Admin (back-office).

## Écarts assumés

- **Vérification Stitch non disponible dans cette session** : `mcp__stitch__*` a renvoyé
  `Incompatible auth server: does not support dynamic client registration` (OAuth non
  configuré pour cet environnement non interactif) et la CLI `agy` n'est pas installée. La
  structure/copy ci-dessous s'appuie donc sur `stitch-prompts/31-admin-gestion-contenu-mediatheque.md`
  (texte détaillé : sidebar, colonnes, champs de formulaire, tiroir d'historique) **sans
  vérification de l'écran rendu réel**, contrairement à la règle absolue #9 — à revalider dès
  qu'une session avec accès Stitch fonctionnel est disponible, avant tout ajustement visuel
  ultérieur.
- **Champ "Eyebrow"** décrit dans le prompt Stitch pour le hero n'a pas d'équivalent dans le
  modèle `PageSection` (schema.prisma : `titleText`/`subtitleText`/`bodyText`/`ctaPrimaryLabel`/
  `ctaSecondaryLabel`/`dataJson`/`mediaId`) — omis du formulaire plutôt que détourné dans un
  champ existant ; un futur champ dédié ou l'usage de `dataJson` pourrait le couvrir si besoin.
- **Pastille de statut à 2 valeurs (Publié/Brouillon)**, pas 3 ("Modifications non publiées")
  — voir `docs/features/content.md` pour la raison (schéma à une seule copie par locale).
- **URL réelle sans préfixe `/admin`** : `(admin)` est un *route group* Next.js (aucun segment
  d'URL ajouté) — la page vit réellement à `/gestion-contenu`, pas `/admin/gestion-contenu`
  comme indiqué plus bas (et comme la fiche `admin-ai-settings` l'indique déjà pour
  `/ai-settings`, écart pré-existant de la session `admin-ai-settings`). La sidebar
  (`admin-dashboard/ui/AdminSidebar.tsx`) a été corrigée pour pointer vers les vraies URLs
  (`/dashboard`, `/gestion-contenu`, `/mediatheque`, `/ai-settings`) ; le `redirect()` interne
  historique de `apps/web/src/app/(admin)/ai-settings/page.tsx` vers `/admin/dashboard` reste
  à corriger la prochaine fois que ce fichier (Phase 5) sera modifié.

## Objet

Éditeur de contenu par page/section pour les rôles `MANAGER`/`ADMIN` : modifier tous les
textes (et déclencher le remplacement d'images, géré via `admin-mediatheque`) du site
public sans intervention développeur. Répond directement à la demande "manage all texts and
images in the website".

## Route(s)

`apps/web/src/app/(admin)/gestion-contenu/page.tsx` → `/admin/gestion-contenu`
(+ `?page=accueil&section=hero` en query pour deep-link vers une section précise)

Protégée par middleware + guard NestJS : rôle `MANAGER` ou `ADMIN` uniquement.

## Référence maquette

- Prompt Stitch : `stitch-prompts/31-admin-gestion-contenu-mediatheque.md` (Écran A)
- Écran Stitch : **ANGALY Back-office — Gestion de contenu**
- Section spécification : §67

## Arborescence de composants attendue

```
apps/web/src/features/admin-gestion-contenu/
  ui/
    AdminContentPage.tsx        → layout 2 colonnes (liste + éditeur)
    SectionsList.tsx            → colonne gauche : pages/sections + statut (pill)
    SectionEditorForm.tsx       → colonne droite : formulaire par section
    LocaleTabs.tsx               → onglets Français / Malagasy
    VersionHistoryDrawer.tsx     → tiroir d'historique des versions
    PreviewToggle.tsx
  hooks/
    useSectionsList.ts           → liste des PageSection groupées par page
    useSectionEditor.ts          → charge une section, gère le formulaire (react-hook-form),
                                    bascule brouillon/publié, appelle save/publish
    useSectionVersionHistory.ts  → liste + action "Restaurer"
  api/
    page-sections.api.ts         → useSectionsQuery, useSectionQuery, useSaveDraftMutation,
                                    usePublishMutation, useRestoreVersionMutation
  schemas/
    section-editor.schema.ts     → Zod, champs dynamiques selon les champs remplis de la section
  consts/
    queryKeys.ts
  __tests__/
    useSectionEditor.test.ts
    useSectionsList.test.ts
  index.ts
```

`AdminContentPage.tsx` et les composants `ui/` restent purement présentationnels ; toute la
logique de chargement/sauvegarde/versioning vit dans `hooks/`.

## Endpoints API consommés

| Endpoint | Module | Usage |
| --- | --- | --- |
| `GET /api/content/sections` | `content` | Liste groupée par page, avec statut |
| `GET /api/content/sections/:page/:sectionKey` | `content` | Détail d'une section (toutes locales) |
| `PATCH /api/content/sections/:page/:sectionKey` | `content` | Sauvegarde (brouillon) |
| `POST /api/content/sections/:page/:sectionKey/publish` | `content` | Publication |
| `GET /api/content/sections/:id/versions` | `content` | Historique |
| `POST /api/content/sections/:id/versions/:versionId/restore` | `content` | Restauration |

## Modèles Prisma touchés

`PageSection`, `PageSectionVersion`, `Media` (référence de l'image de section), `User`
(auteur de la modification, rôle).

## Points d'attention

- **RBAC obligatoire côté NestJS** (guard `@Roles('MANAGER', 'ADMIN')`), le masquage du menu
  côté client n'est qu'un confort UX — voir `docs/phases/phase-6-admin-cms.md`.
- Toute sauvegarde crée une `PageSectionVersion` (snapshot JSON complet) avant d'écraser
  `PageSection` — non négociable, c'est le seul filet de sécurité contre une erreur d'un
  utilisateur non développeur.
- "Publier" doit être une action explicite et distincte de "Enregistrer comme brouillon" —
  ne jamais publier automatiquement à la sauvegarde.
- L'unicité `(page, sectionKey, locale)` du modèle `PageSection` signifie qu'il faut créer
  une ligne par langue — `LocaleTabs.tsx` doit clairement indiquer quelle locale est en
  cours d'édition pour éviter d'écraser la mauvaise langue.

## Checklist d'acceptation

- [x] Reproduit `stitch-prompts/31-*.md` Écran A (sidebar, liste de sections, éditeur) — **à
      partir du texte du prompt uniquement**, pas de l'écran Stitch rendu (voir "Écarts
      assumés" : accès `mcp__stitch__*`/`agy` indisponible dans cette session)
- [x] Sélection d'une section charge son formulaire, sauvegarde brouillon fonctionnelle
- [x] Publication fonctionnelle (bascule `DRAFT`→`PUBLISHED` en base) — pas encore "visible
      immédiatement côté public" : aucune page publique ne lit encore `PageSection` (étape 4
      de `docs/phases/phase-6-admin-cms.md`, explicitement hors périmètre de cette session)
- [x] Historique des versions consultable et "Restaurer" opérationnel
- [x] Accès refusé (403) pour un rôle `CLIENT`/`COUTURIERE` (testé côté `apps/api`) ; côté web,
      la page redirige tout rôle hors `MANAGER`/`ADMIN` vers `/dashboard`
- [x] Tests : `useSectionEditor.test.ts`, `useSectionsList.test.ts`, guard RBAC testé côté
      `apps/api` (`page-sections.controller.spec.ts`)
- [x] `docs/checklist-implementation.md` et `docs/mockup-reference.md` mis à jour à ✅
