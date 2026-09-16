# Page — `admin-gestion-contenu`

**Statut : ✅ Fait** (session 2026-09-16). Phase 6 — Admin (back-office). **Passe
optimisation/UX** (session 2026-09-16, suite — audit complet du CMS admin) : voir
"Points d'attention" pour le détail des correctifs perf/UX/qualité de code appliqués.

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
    AdminContentPage.tsx        → layout 2 colonnes (liste + éditeur), avertit avant de perdre des modifications non enregistrées (voir Points d'attention)
    SectionsList.tsx            → colonne gauche : pages/sections + statut (pill), squelette de chargement
    SectionEditorForm.tsx       → colonne droite : formulaire par section, aperçu scopé (useWatch), signale son état "modifié" au parent
    LocaleTabs.tsx               → onglets Français / Malagasy
    VersionHistoryDrawer.tsx     → tiroir d'historique des versions — Radix Dialog (focus-trap + Échap, voir Points d'attention)
    PreviewToggle.tsx
  hooks/
    useSectionsList.ts           → liste des PageSection groupées par page, `staleTime` 30s
    useSectionEditor.ts          → charge une section, gère le formulaire (react-hook-form),
                                    bascule brouillon/publié, appelle save/publish, expose `availableLocales`
    useSectionVersionHistory.ts  → liste + action "Restaurer"
  api/
    page-sections.api.ts         → useSectionsQuery, useSectionQuery, useSaveDraftMutation,
                                    usePublishMutation, useRestoreVersionMutation
  schemas/
    section-editor.schema.ts     → Zod, champs dynamiques selon les champs remplis de la section
  consts/
    queryKeys.ts
  __tests__/
    useSectionEditor.test.ts, useSectionsList.test.ts, SectionEditorForm.test.tsx,
    AdminContentPage.test.tsx, VersionHistoryDrawer.test.tsx
  index.ts
```

`AdminContentPage.tsx` et les composants `ui/` restent purement présentationnels ; toute la
logique de chargement/sauvegarde/versioning vit dans `hooks/` — `availableLocales` (dérivé
depuis `useSectionEditor.ts`, session 2026-09-16 suite) a été déplacé hors de
`AdminContentPage.tsx` pour rester cohérent avec cette règle.

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

- **Audit optimisation/UX complet** (session 2026-09-16, suite — à la demande explicite de
  vérifier "le CMS admin complet" et d'y apporter optimisation et facilité d'usage), voir
  aussi `docs/pages/admin-mediatheque.md` pour le détail du bug de couleurs (commun aux deux
  features + au shell admin) :
  - **Bug de couleurs corrigé** : `text-slate`/`bg-primary-deep-navy`/`bg-ivory`/
    `text-warning` (classes Tailwind jamais définies) remplacées par les vrais tokens
    ANGALY (`angaly-slate`/`angaly-navy`/`angaly-ivory`/`angaly-warning`) dans les 6
    composants `ui/` de cette feature.
  - **Performance** : `availableLocales` déplacé dans `useSectionEditor.ts` (`useMemo`,
    au lieu d'un `.map()` recalculé à chaque rendu de `AdminContentPage.tsx`) ; `staleTime`
    de 30 s sur `useSectionsList` ; `SectionEditorForm.tsx` scope son abonnement au formulaire
    avec `useWatch({ name: ['titleText', 'subtitleText'] })` au lieu d'un `watch()` global qui
    re-rendait tous les champs à chaque frappe pour ne nourrir que `PreviewToggle`.
  - **UX** : avertissement (avant perte de données) si l'utilisateur change de section ou de
    langue avec un brouillon non enregistré (`formState.isDirty`, confirmation + garde
    `beforeunload`) — silencieusement perdu auparavant ; `VersionHistoryDrawer` reconstruit
    sur `@radix-ui/react-dialog` (même primitive que `MobileDrawer`/`MobileSearchOverlay` côté
    site public) pour un vrai piège de focus et une fermeture à l'Échap, au lieu d'un `div`
    sans aucune gestion clavier ; squelettes de chargement à la place du texte "Chargement…" ;
    l'explication du bouton "Publier" désactivé est désormais un texte visible relié par
    `aria-describedby` plutôt qu'un `title` (infobulle survol uniquement, invisible au
    clavier/lecteur d'écran).
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
- [x] Publication fonctionnelle (bascule `DRAFT`→`PUBLISHED` en base) — **visible
      immédiatement côté public** depuis que l'étape 4 de `docs/phases/phase-6-admin-cms.md`
      a été terminée (sessions ultérieures) : les 14 pages Phase 1 lisent désormais
      `PageSection` via `GET /content/public/:page`
- [x] Historique des versions consultable et "Restaurer" opérationnel
- [x] Accès refusé (403) pour un rôle `CLIENT`/`COUTURIERE` (testé côté `apps/api`) ; côté web,
      la page redirige tout rôle hors `MANAGER`/`ADMIN` vers `/dashboard`
- [x] Tests : 5 fichiers de tests (`useSectionEditor`, `useSectionsList`, `SectionEditorForm`,
      `AdminContentPage`, `VersionHistoryDrawer`), guard RBAC testé côté `apps/api`
      (`page-sections.controller.spec.ts`)
- [x] `docs/checklist-implementation.md` et `docs/mockup-reference.md` mis à jour à ✅
