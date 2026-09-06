# Page — `admin-gestion-contenu`

**Statut : ⬜ À faire.** Phase 6 — Admin (back-office).

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

- [ ] Reproduit fidèlement `stitch-prompts/31-*.md` Écran A (sidebar, liste de sections, éditeur)
- [ ] Sélection d'une section charge son formulaire, sauvegarde brouillon fonctionnelle
- [ ] Publication fonctionnelle et visible immédiatement côté public (page `home` notamment)
- [ ] Historique des versions consultable et "Restaurer" opérationnel
- [ ] Accès refusé (redirection ou 403) pour un rôle `CLIENT`/`COUTURIERE`
- [ ] Tests : `useSectionEditor.test.ts`, `useSectionsList.test.ts`, test guard RBAC côté `apps/api`
- [ ] `docs/checklist-implementation.md` et `docs/mockup-reference.md` mis à jour à ✅
